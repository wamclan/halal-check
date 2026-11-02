const test = require("node:test");
const assert = require("node:assert");
const http = require("http");

/* Fake Gemini and Open Food Facts servers so the real handlers run end to end without network or keys. */
let lastGeminiBody = null, lastGeminiPath = null, geminiMode = "ok", geminiCalls = 0;
const fake = http.createServer((req, res) => {
  const chunks = [];
  req.on("data", c => chunks.push(c));
  req.on("end", () => {
    res.setHeader("Content-Type", "application/json");
    if (req.url.startsWith("/v1beta/models/")) {
      lastGeminiBody = JSON.parse(Buffer.concat(chunks).toString() || "{}");
      lastGeminiPath = req.url;
      geminiCalls++;
      if (geminiMode === "503_once" && geminiCalls === 1) { res.statusCode = 503; return res.end("{}"); }
      if (geminiMode === "503") { res.statusCode = 503; return res.end("{}"); }
      if (geminiMode === "429") { res.statusCode = 429; return res.end("{}"); }
      if (geminiMode === "404") { res.statusCode = 404; return res.end("{}"); }
      if (geminiMode === "403") { res.statusCode = 403; return res.end("{}"); }
      if (geminiMode === "400") { res.statusCode = 400; return res.end("{}"); }
      if (geminiMode === "blocked") return res.end(JSON.stringify({promptFeedback: {blockReason: "SAFETY"}}));
      if (geminiMode === "garbage") return res.end(JSON.stringify({candidates: [{content: {parts: [{text: "sorry no"}]}}]}));
      const out = {product: "Koekjes", ingredients_text: "Tarwebloem, suiker, E471, gelatine\u0000", halal_mark: true,
        extra: [{term: "gelatine", reason: "Controleer de herkomst."}, {term: "Imaginary pork", reason: "Hallucination."}]};
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
  assert.strictEqual(j.extra.length, 0);
  const parts = lastGeminiBody.contents[0].parts;
  assert.strictEqual(parts[1].inline_data.data, img);
  assert.ok(parts[0].text.includes("Dutch"));
  assert.ok(parts[0].text.includes("Zutaten"));
  assert.ok(parts[0].text.includes("DO NOT translate") || parts[0].text.includes("DO NOT"));
  assert.equal(lastGeminiBody.generationConfig.thinkingConfig.thinkingLevel, "low");
  assert.equal(lastGeminiBody.generationConfig.responseMimeType, "application/json");
  assert.ok(!("temperature" in lastGeminiBody.generationConfig));
  assert.ok(lastGeminiPath.includes("/models/gemini-3.8-flash:generateContent"));
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

test("photo reader differentiates unavailable model and failed auth", async () => {
  const request = async (ip) => post({image: img, mime: "image/jpeg"}, {"x-real-ip": ip});
  geminiMode = "404";
  assert.strictEqual((await (await request("8.8.8.1")).json()).code, "model_unavailable");
  geminiMode = "403";
  assert.strictEqual((await (await request("8.8.8.2")).json()).code, "api_auth_error");
  geminiMode = "400";
  assert.strictEqual((await (await request("8.8.8.3")).json()).code, "upstream_invalid_request");
  geminiMode = "ok";
});
test("photo reader ignores model-generated halal/source claims and returns transcription only", () => {
  const {sanitize} = require("../api/read-label")._test;
  const result = sanitize({ingredients_text: "Magnesiumsalze der Speisefettsäuren, Vitamin B12",
    extra: [{term: "Speisefettsäuren",reason:"Verify source."}, {term:"Gelatine",reason:"Invented term."}]});
  assert.equal(result.extra.length, 0);
  assert.match(result.ingredients,/Speisefettsäuren/);
});


test("transient upstream Gemini 503 is retried once then succeeds", async () => {
  geminiCalls = 0;
  geminiMode = "503_once";
  const r = await post({image: img, mime: "image/png"}, {"x-real-ip": "9.9.9.1"});
  const j = await r.json();
  assert.strictEqual(r.status,200);
  assert.strictEqual(j.ok,true);
  assert.strictEqual(geminiCalls,2);
  geminiMode = "ok";
});

test("persistent upstream Gemini 503 returns a readable busy code after only one retry", async () => {
  geminiCalls = 0;
  geminiMode = "503";
  const r = await post({image: img, mime: "image/png"}, {"x-real-ip": "9.9.9.2"});
  const j = await r.json();
  assert.strictEqual(r.status,503);
  assert.strictEqual(j.code,"upstream_busy");
  assert.strictEqual(geminiCalls,2);
  geminiMode = "ok";
});

test("quota-style Gemini 429 is not automatically retried", async () => {
  geminiCalls = 0;
  geminiMode = "429";
  const r = await post({image: img, mime: "image/png"}, {"x-real-ip": "9.9.9.3"});
  assert.equal(r.status,503);
  assert.equal((await r.json()).code,"upstream_busy");
  assert.equal(geminiCalls,1);
  geminiMode = "ok";
});

test("nonretryable upstream Gemini 404 does not retry", async () => {
  geminiCalls=0;
  geminiMode="404";
  const r=await post({image: img,mime:"image/jpeg"}, {"x-real-ip":"9.9.9.4"});
  assert.equal((await r.json()).code,"model_unavailable");
  assert.equal(geminiCalls,1);
  geminiMode="ok";
});
