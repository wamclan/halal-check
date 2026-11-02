const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Engine = require("../public/js/engine.js");
const Coverage = require("../public/js/ingredient-coverage.js");
const rules = JSON.parse(fs.readFileSync(path.join(__dirname, "../public/data/rules.json"), "utf8"));
const engine = Engine.create(rules);

const norwegian = "Rapsolie (62%), vann, pasteurisert eggeplomme, hvitvinseddik, salt, Parmigiano Reggiano-ost (melk) (1%), sennepsmel, svart pepper, worcestersaus, hvitløkspulver, ansjospaste";
const german = "Zutaten: Magnesiumoxid, Füllstoff Cellulose, Trennmittel Magnesiumsalze der Speisefettsäuren, Füllstoff vernetzte Carboxymethylcellulose, Trennmittel Siliciumdioxid, Speisefettsäuren, Vitamin B12";

test("Norwegian ingredient list is identified independently of Arabic UI", () => {
  assert.equal(Coverage.infer(norwegian).language, "nb");
});
test("Norwegian cheese is flagged for a source check without a haram claim", () => {
  const findings = engine.analyse(norwegian);
  assert.ok(findings.some(f => f.name.en === "Cheese" && f.status === "warn"));
  assert.equal(Coverage.screeningVerdict(findings), "warn");
  assert.ok(!findings.some(f => f.status === "bad"));
});
test("German supplement label identifies fatty-acid salts as source-dependent", () => {
  assert.equal(Coverage.infer(german).language, "de");
  const findings = engine.analyse(german);
  const warning = findings.find(f => f.name.en === "Fatty acid salts / stearates");
  assert.ok(warning);
  assert.equal(warning.status, "warn");
  assert.match(warning.why.en, /plant or animal/);
  assert.ok(!findings.some(f => f.status === "bad"));
});
test("absence of a match is always inconclusive, never certified halal", () => {
  const findings = engine.analyse("vann, olivenolje, ansjos");
  assert.equal(Coverage.screeningVerdict(findings), "review");
});
test("heuristic does not assign a language to random unsupported words", () => {
  assert.equal(Coverage.infer("qzxv blrpp ssmmn").language, "und");
});
test("explicit prohibited-source wording remains a flag", () => {
  assert.equal(Coverage.screeningVerdict(engine.analyse("Schweinefleisch")), "bad");
});
