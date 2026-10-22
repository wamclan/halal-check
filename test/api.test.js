const test = require("node:test");
const assert = require("node:assert");
const http = require("http");

/* Fake Gemini and Open Food Facts servers so the real handlers run end to end without network or keys. */
let lastGeminiBody = null, geminiMode = "ok";
const fake = http.createServer((req, res) => {
  const chunks = [];
  req.on("data", c => chunks.push(c));
  req.on("end", () => {
    res.setHeader("Content-Type", "application/json");
    if (req.url.startsWith("/v1beta/models/")) {
      lastGeminiBody = JSON.parse(Buffer.concat(chunks).toString() || "{}");
      if (geminiMode === "429") { res.statusCode = 429; return res.end("{}"); }
      if (geminiMode === "blocked") return res.end(JSON.stringify({promptFeedback: {blockReason: "SAFETY"}}));
      if (geminiMode === "garbage") return res.end(JSON.stringify({candidates: [{content: {parts: [{text: "sorry no"}]}}]}));
      const out = {product: "Koekjes", ingredients_text: "Tarwebloem, suiker, E471, gelatine\u0000", halal_mark: true,
        extra: [{term: "Aroma", reason: "Kan alcohol bevatten."}, {term: "", reason: "x"}]};
      return res.end(JSON.stringify({candidates: [{content: {parts: [{text: "```json\n" + JSON.stringify(out) + "\n```"}]}}]}));
    }
    if (req.url.includes("/api/v2/product/3017620422003")) {
      return res.end(JSON.stringify({status: 1, product: {code: "3017620422003", product_name: "Spread", brands: "Brand",
        ingredients_text: "sugar, palm oil", ingredients_text_nl: "suiker, palmolie", labels_tags: ["en:halal", "en:vegan"]}}));
    }
    if (req.url.includes("/api/v2/product/5000000000000")) return res.end(JSON.stringify({status: 0}));
    res.statusCode = 404; res.end("{}");
  });
});

let app, base;
test.before(async () => {
  await new Promise(r => fake.listen(0, r));
  const fp = fake.address().port;
  process.env.GEMINI_API_KEY = "test-key";
  process.env.GEMINI_API_BASE = "http://127.0.0.1:" + fp;
  process.env.OFF_API_BASE = "http://127.0.0.1:" + fp;
  process.env.RATE_PER_HOUR = "3";
  app = require("../scripts/dev-server.js");
  await new Promise(r => app.listen(0, r));
  base = "http://127.0.0.1:" + app.address().port;
});
test.after(() => { app.close(); fake.close(); });

const post = (body, headers) => fetch(base + "/api/read-label", {method: "POST", headers: Object.assign({"Content-Type": "application/json"}, headers), body: JSON.stringify(body)});
const img = Buffer.from("fake-jpeg-bytes").toString("base64");

test("read-label returns sanitized ingredients and forwards the image", async () => {
  const r = await post({image: img, mime: "image/jpeg", lang: "nl"}, {"x-real-ip": "1.1.1.1"});
  assert.strictEqual(r.status, 200);
  const j = await r.json();
  assert.strictEqual(j.ok, true);
  assert.strictEqual(j.product, "Koekjes");
  assert.ok(!j.ingredients.includes("\u0000"));
  assert.strictEqual(j.halalMark, true);
  assert.strictEqual(j.extra.length, 1);
  const parts = lastGeminiBody.contents[0].parts;
  assert.strictEqual(parts[1].inline_data.data, img);
  assert.ok(parts[0].text.includes("Dutch"));
});
test("read-label rejects bad input", async () => {
  assert.strictEqual((await post({image: "***", mime: "image/jpeg"}, {"x-real-ip": "2.2.2.2"})).status, 400);
  assert.strictEqual((await post({image: img, mime: "image/gif"}, {"x-real-ip": "2.2.2.2"})).status, 400);
  assert.strictEqual((await fetch(base + "/api/read-label")).status, 405);
  assert.strictEqual((await post({image: img, mime: "image/jpeg"}, {"sec-fetch-site": "cross-site"})).status, 403);
});
test("read-label limits requests per IP", async () => {
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await post({image: img, mime: "image/png"}, {"x-real-ip": "3.3.3.3"})).status);
  assert.deepStrictEqual(codes, [200, 200, 200, 429, 429]);
});
test("read-label maps upstream failures", async () => {
  geminiMode = "429";
  assert.strictEqual((await (await post({image: img, mime: "image/png"}, {"x-real-ip": "4.4.4.4"})).json()).code, "upstream_busy");
  geminiMode = "blocked";
  assert.strictEqual((await (await post({image: img, mime: "image/png"}, {"x-real-ip": "4.4.4.5"})).json()).code, "refused");
  geminiMode = "garbage";
  assert.strictEqual((await (await post({image: img, mime: "image/png"}, {"x-real-ip": "4.4.4.6"})).json()).code, "unreadable");
  geminiMode = "ok";
});
test("read-label without key says not configured", async () => {
  const k = process.env.GEMINI_API_KEY; delete process.env.GEMINI_API_KEY;
  assert.strictEqual((await post({image: img, mime: "image/png"}, {"x-real-ip": "5.5.5.5"})).status, 503);
  process.env.GEMINI_API_KEY = k;
});

test("product lookup picks the ingredient text in the UI language", async () => {
  const j = await (await fetch(base + "/api/product?code=3017620422003&lang=nl", {headers: {"x-real-ip": "6.6.6.6"}})).json();
  assert.strictEqual(j.found, true);
  assert.strictEqual(j.ingredients, "suiker, palmolie");
  assert.strictEqual(j.halalLabel, true);
  const en = await (await fetch(base + "/api/product?code=3017620422003&lang=en", {headers: {"x-real-ip": "6.6.6.6"}})).json();
  assert.strictEqual(en.ingredients, "sugar, palm oil");
});
test("product lookup handles unknown and invalid codes", async () => {
  const j = await (await fetch(base + "/api/product?code=5000000000000", {headers: {"x-real-ip": "7.7.7.7"}})).json();
  assert.strictEqual(j.found, false);
  assert.strictEqual((await fetch(base + "/api/product?code=abc")).status, 400);
});
