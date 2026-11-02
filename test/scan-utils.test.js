const test=require("node:test");
const assert=require("node:assert/strict");
const S=require("../public/js/scan-utils.js");
const fs=require("node:fs");
const path=require("node:path");
const db=JSON.parse(fs.readFileSync(path.join(__dirname,"../public/data/evidence-knowledge.json"),"utf8"));
const index=JSON.parse(fs.readFileSync(path.join(__dirname,"../public/data/e-number-screening.json"),"utf8"));

test("compact E index matches all source-sensitive E-number records",()=>{
  const expected=db.ingredients.filter(row=>row.kind==="e_additive" && row.code && row.status!=="unknown");
  assert.equal(expected.length,40);
  assert.equal(index.records.length,346);
  assert.equal(index.records.filter(row=>row.status!=="unknown").length,40);
  const byCode=new Map(expected.map(row=>[row.code,row]));
  for(const item of index.records){
    assert.ok(item.code && item.en);
    assert.notEqual(item.status,"halal");
    if(item.status!=="unknown"){
      const src=byCode.get(item.code);
      assert.ok(src,"Missing flagged record "+item.code);
      assert.equal(item.status,src.status);
      assert.ok(item.why);
    }
  }
});

test("model suggestions that overlap one known magnesium salt are shown only once",()=>{
  const original=[{status:"warn",name:{en:"Fatty-acid salts"},seg:"Trennmittel Magnesiumsalze der Speisefettsäuren"}];
  const hints=[
    {term:"Magnesiumsalze der Speisefettsäuren",reason:"Source?"},
    {term:"Speisefettsäuren",reason:"Source?"},
    {term:"Magnesiumsalze",reason:"Source?"}
  ];
  const out=S.mergeSuggestions(original,hints,"Trennmittel Magnesiumsalze der Speisefettsäuren");
  assert.equal(out.length,1);
});

test("a genuinely separate unknown source question remains visible",()=>{
  const original=[{status:"warn",name:{en:"Cheese"},seg:"Parmigiano Reggiano-ost"}];
  const out=S.mergeSuggestions(original,[{term:"Gelatine",reason:"Check animal origin."},
    {term:"Reggiano-ost",reason:"Rennet?"}],
    "Parmigiano Reggiano-ost, Gelatine");
  assert.equal(out.length,2);
  assert.equal(out[1].name,"Gelatine");
  assert.equal(out[1].status,"warn");
});

test("model suggestions cannot add ingredients absent from the printed label",()=>{
  const out=S.mergeSuggestions([],[
    {term:"pork",reason:"Imaginary ingredient"},
    {term:"Vitamin B12",reason:"Follow up question"}
  ],"Zutaten: Magnesiumoxide, Vitamin B12");
  assert.equal(out.length,1);
  assert.equal(out[0].name,"Vitamin B12");
});

test("overlapping model suggestions retain the longest ingredient span only",()=>{
  const out=S.mergeSuggestions([],[
    {term:"Speisefettsäuren",reason:"Subterm"},
    {term:"Magnesiumsalze der Speisefettsäuren",reason:"Full name"}
  ],"Magnesiumsalze der Speisefettsäuren");
  assert.equal(out.length,1);
  assert.equal(out[0].name,"Magnesiumsalze der Speisefettsäuren");
});
