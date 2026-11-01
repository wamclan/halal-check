const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Core = require("../public/js/evidence-core.js");
const data = JSON.parse(fs.readFileSync(path.join(__dirname,"../public/data/evidence-knowledge.json"),"utf8"));
const model = Core.create(data);
test("catalogue validates complete evidence linkage", () => {
  assert.equal(model.stats.ingredients,431);
  assert.equal(model.stats.eNumbers,346);
  assert.equal(model.stats.sources,29);
});
test("every ingredient has explicit ruling uncertainty and evidence", () => {
  for (const row of data.ingredients) {
    assert.ok(row.decision?.halalRulingConfidence, row.id);
    assert.ok(Array.isArray(row.sourceIds) && row.sourceIds.length, row.id);
    for(const id of row.sourceIds) assert.ok(model.sources.has(id),row.id+" -> "+id);
    assert.notEqual(row.decision.halalRulingConfidence,"certain_halal",row.id);
  }
});
test("search for E471 returns source-sensitive uncertainty, not halal verdict", () => {
  const r = model.find({query:"e471"});
  assert.ok(r.items.length);
  assert.equal(r.items[0].code,"E471");
  assert.equal(r.items[0].status,"verify");
  assert.equal(r.items[0].decision.halalRulingConfidence,"not_determined");
});
test("E171 includes explicit EU regulatory note without a religious ruling", () => {
  const r=model.find({query:"E171"});
  assert.equal(r.items[0].regulatoryStatus?.status,"not_authorised_as_food_additive");
  assert.equal(r.items[0].decision?.halalRulingConfidence,"not_determined");
});
test("language independent alias search", () => {
  assert.ok(model.find({query:"جيلاتين"}).total>0);
  assert.ok(model.find({query:"gelatine"}).total>0);
  assert.ok(model.find({query:"collagen"}).total>0);
});
test("catalogue supports scoped filters without invented labels", () => {
  const r=model.find({kind:"processing_aid_or_enzyme",limit:60});
  assert.equal(r.total,32);
  assert.ok(r.items.every(x=>x.kind==="processing_aid_or_enzyme"));
  assert.equal(model.find({kind:"e_additive",status:"unknown",limit:60}).total>200,true);
});
test("all 431 records are reachable with pagination", () => {
  let offset=0, seen=new Set(),r;
  do {r=model.find({offset,limit:37});
    for(const x of r.items) {assert.ok(!seen.has(x.id));seen.add(x.id);}
    offset+=r.items.length;
  }while(r.hasMore);
  assert.equal(seen.size,431);
});
test("rejects duplicate identifiers and broken citations", () => {
  const d={ingredients:[...data.ingredients.slice(0,1), {...data.ingredients[0]}], sources:data.sources};
  assert.throws(()=>Core.validate(d),/Duplicate/);
  d.ingredients=[{...data.ingredients[0],sourceIds:["ABSENT"]}];
  assert.throws(()=>Core.validate(d),/Missing source/);
});
test("E-code suffixes remain distinct", () => {
  assert.equal(Core.code("e 472a"),"E472a");
  assert.equal(Core.code("E160b(ii)"),"E160b(ii)");
});
