const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const HE = require("../public/js/engine.js");
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "../public/data/rules.json"), "utf8"));
const eng = HE.create(data);

const run = text => {
  const items = eng.analyse(text);
  return {verdict: eng.verdictOf(items), names: items.map(i => i.status + ":" + (i.code || i.name.en))};
};

test("plain product with nothing flagged", () => {
  assert.strictEqual(run("Tomato 60%, water, sunflower oil, salt, onion, spices, citric acid").verdict, "ok");
});
test("biscuit with whey, E471 and flavouring is doubtful", () => {
  const r = run("Wheat flour, sugar, palm oil, whey powder, emulsifier (E471), natural flavouring, salt");
  assert.strictEqual(r.verdict, "warn");
  assert.ok(r.names.includes("warn:E471"));
  assert.ok(r.names.includes("warn:Whey"));
});
test("gummies with gelatin and E120 are doubtful", () => {
  const r = run("Glucose syrup, sugar, gelatin, citric acid, E120, flavouring");
  assert.strictEqual(r.verdict, "warn");
  assert.ok(r.names.includes("warn:E120"));
});
test("Dutch pork fat and beer are haram", () => {
  const r = run("Tarwe, varkensvet, zout, bier");
  assert.strictEqual(r.verdict, "bad");
});
test("Arabic pork fat is haram, gelatin doubtful", () => {
  const r = run("دقيق، والجيلاتين، شحم الخنزير");
  assert.strictEqual(r.verdict, "bad");
  assert.ok(r.names.some(n => n.startsWith("warn:Gelatin")));
});
test("fish gelatin is cleared by its stated source", () => {
  const r = run("Suiker, visgelatine, aroma plantaardig");
  assert.strictEqual(r.verdict, "ok");
});
test("alcohol free beer extract is not flagged as alcohol", () => {
  assert.strictEqual(run("Water, alcoholvrij bier extract, sugar").verdict, "ok");
});
test("'not halal' wording does not clear an item", () => {
  assert.strictEqual(run("gelatin (not halal)").verdict, "warn");
});
test("hamburger does not match ham", () => {
  assert.strictEqual(run("hamburger bun, sesame").verdict, "ok");
});
test("E-number lookup", () => {
  assert.strictEqual(eng.lookupE("e 471").rule.status, "warn");
  assert.strictEqual(eng.lookupE("E999").rule, null);
  assert.strictEqual(eng.lookupE("hello"), null);
});
test("GTIN check digits", () => {
  assert.ok(HE.validGtin("3017620422003"));
  assert.ok(HE.validGtin("96385074"));
  assert.ok(!HE.validGtin("3017620422004"));
  assert.ok(!HE.validGtin("123"));
});
