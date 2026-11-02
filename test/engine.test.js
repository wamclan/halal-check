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
test("Dutch pork fat and beer includes a pork-derived flag", () => {
  const r = run("Tarwe, varkensvet, zout, bier");
  assert.strictEqual(r.verdict, "bad");
});
test("Arabic pork fat is haram, gelatin doubtful", () => {
  const r = run("دقيق، والجيلاتين، شحم الخنزير");
  assert.strictEqual(r.verdict, "bad");
  assert.ok(r.names.some(n => n.startsWith("warn:Gelatin")));
});
test("fish gelatin is not silently certified by label wording", () => {
  const r = run("Suiker, visgelatine, aroma plantaardig");
  assert.strictEqual(r.verdict, "warn");
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

test("unrelated vegan claim cannot clear E471", () => {
  assert.strictEqual(run("vegan aroma, emulsifier E471").verdict, "warn");
});
test("ambiguous ham and bacon are not categorically pork", () => {
  assert.notStrictEqual(run("turkey ham, vegan bacon").verdict, "bad");
});
test("alcohol mention alone is not a categorical religious verdict", () => {
  assert.strictEqual(run("ethanol").verdict, "warn");
});
test("non-halal claim cannot establish halal", () => {
  assert.strictEqual(run("gelatin (not halal)").verdict, "warn");
});

test("pork-free and vegan pork wording is not definitive", () => {
  assert.notStrictEqual(run("Pork-free sauce, water").verdict, "bad");
  assert.notStrictEqual(run("vegan pork style flavour").verdict, "bad");
  assert.notStrictEqual(run("zonder varkensvlees").verdict, "bad");
});
test("explicit lard still triggers a source flag", () => {
  assert.equal(run("water, lard, salt").verdict, "bad");
});

test("Scandinavian Caesar dressing raises a cheese rennet-source question", () => {
  const label = "Rapsolie (62%), vann, pasteurisert eggeplomme, Parmigiano Reggiano-ost (mælk) (1%), salt, worcestersaus (vann, eddik, tamarind), ansjospaste";
  const r = run(label);
  assert.strictEqual(r.verdict, "warn");
  assert.ok(r.names.some(n => n.includes("Cheese")), JSON.stringify(r.names));
  assert.notStrictEqual(r.verdict, "bad");
});
test("German supplement fatty-acid salts trigger a source review", () => {
  const label = "Zutaten: Magnesiumoxide, Füllstoff mikrokristalline Cellulose, Trennmittel Magnesiumsalze der Speisefettsäuren, Vitamin B6, Folsäure, Vitamin B12";
  const r = run(label);
  assert.strictEqual(r.verdict, "warn");
  assert.ok(r.names.some(n => n.includes("Fatty-acid salts")), JSON.stringify(r.names));
  assert.ok(!r.names.some(n => n.startsWith("bad:")));
});
test("German vitamin D3 mentions origin uncertainty without a categorical prohibition", () => {
  const r = run("Vitamine D3, Magnesiumoxide");
  assert.strictEqual(r.verdict,"warn");
  assert.ok(r.names.some(n => n.includes("Vitamin D3")));
  assert.ok(!r.names.some(n => n.startsWith("bad:")));
});
test("Unrelated plain ingredients do not produce invented flags", () => {
  const r = run("Zutaten: Magnesiumoxide, Folsäure, Vitamin B12, Cellulose, Wasser");
  assert.strictEqual(r.verdict,"ok");
  assert.equal(r.names.length,0);
});
