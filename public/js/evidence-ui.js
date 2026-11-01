/* Read-only evidence catalogue. No verdict is manufactured from missing sources. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const TXT = {
    ar: {back:"مسح الملصقات والباركود",eyebrow:"معلومات موثقة وحدود واضحة",heading:"الموسوعة العملية للمكونات والإضافات الغذائية",lead:"ابحث عن المادة أو رمز E، وراجع أسباب التنبيه ومصادره. النتائج ليست فتوى أو شهادة لمنتج بعينه.",safety:"لا يعني غياب معلومات المصدر أن المادة حرام، كما أن السماح القانوني بمضاف لا يعني أنه حلال. لا يُثبت الحكم إلا بدليل يتوافق مع المنتج وسياقه.",sEntries:"سجل",sE:"رمز E",sSources:"مصدر مرجعي",search:"البحث في قاعدة المعرفة",query:"الاسم أو رقم E",kind:"نوع المادة",status:"حالة التحقق",all:"الكل",e:"إضافات E",derivative:"مشتقات",enzyme:"إنزيمات ومساعدات تصنيع",ingredient:"مكونات عامة",verify:"يحتاج للتحقق",unknown:"غير محدد",haram_indicator:"مؤشر مصدر خنزيري صريح",claim_only:"ادعاء غير موثّق",export:"تصدير النتائج CSV",more:"عرض المزيد",results:"نتيجة",sources:"مراجع المادة",sourceRegister:"سجل المراجع",sourceIntro:"مصادر عامة للهوية أو التصنيع أو التشريعات؛ ليست شهادات حلال لمنتجات محددة.",needs:"المعلومات المطلوبة للتحقق",identity:"الثقة بالتعريف",origin:"الثقة بالمصدر",ruling:"حكم شرعي محدد",undetermined:"غير محدد",regulatory:"وضع تنظيمي",unauthorised:"غير مرخّص كمضاف غذائي في الاتحاد الأوروبي",notChecked:"لم يُتحقق من الترخيص لكل استعمال",none:"لا توجد نتائج مطابقة.",failed:"تعذّر تحميل قاعدة المعرفة. أعد تحميل الصفحة.",footer:"قاعدة بحثية مسودة غير معتمدة شرعيًا أو مخبريًا. آخر تحديث",legal:"الشروط والخصوصية"},
    en: {back:"Scan labels and barcodes",eyebrow:"Evidence with clear limitations",heading:"Ingredient & food additive encyclopedia",lead:"Find ingredients and E numbers, read the evidence and its uncertainty. Not a fatwa or product halal certificate.",safety:"Missing sourcing information does not prove haram; legal food-additive permission does not prove halal. Verify product-specific provenance.",sEntries:"records",sE:"E codes",sSources:"references",search:"Search the catalogue",query:"Name or E number",kind:"Material type",status:"Screening state",all:"All",e:"E additives",derivative:"Derivatives",enzyme:"Enzymes and processing aids",ingredient:"Other ingredients",verify:"Needs verification",unknown:"Undetermined",haram_indicator:"Explicit porcine-source indicator",claim_only:"Unverified claim",export:"Export results CSV",more:"Load more",results:"results",sources:"Record evidence",sourceRegister:"Reference register",sourceIntro:"These are general scientific and regulatory sources, not certificates for individual products.",needs:"What to verify",identity:"Identity confidence",origin:"Origin confidence",ruling:"Halal ruling",undetermined:"Undetermined",regulatory:"Regulatory status",unauthorised:"Not authorised as a food additive in the EU",notChecked:"Authorisation not individually checked",none:"No matching records.",failed:"Could not load the catalogue. Refresh to retry.",footer:"Unapproved research draft. Not a fatwa or product certification. Data reviewed",legal:"Legal and privacy"},
    nl: {back:"Etiketten en barcodes scannen",eyebrow:"Bronnen en duidelijke beperkingen",heading:"Encyclopedie van ingrediënten en additieven",lead:"Zoek ingrediënten en E-nummers, bekijk bronnen en onzekerheden. Geen halalcertificaat of religieus oordeel.",safety:"Onbekende herkomst bewijst niet dat iets haram is. Wettelijke toelating bewijst niet dat iets halal is. Controleer productgebonden bewijs.",sEntries:"records",sE:"E-nummers",sSources:"bronnen",search:"Zoeken in de databank",query:"Naam of E-nummer",kind:"Soort ingrediënt",status:"Controle-status",all:"Alles",e:"E-additieven",derivative:"Derivaten",enzyme:"Enzymen en proceshulpmiddelen",ingredient:"Overige ingrediënten",verify:"Controle nodig",unknown:"Onbekend",haram_indicator:"Duidelijke varkensbronvermelding",claim_only:"Niet-geverifieerde claim",export:"Resultaten exporteren (CSV)",more:"Meer tonen",results:"resultaten",sources:"Bronvermelding",sourceRegister:"Bronnenregister",sourceIntro:"Algemene wetenschappelijke en regelgevende bronnen, geen certificaten van individuele producten.",needs:"Te controleren",identity:"Zekerheid identiteit",origin:"Zekerheid herkomst",ruling:"Halalbeoordeling",undetermined:"Niet vastgesteld",regulatory:"Wettelijke status",unauthorised:"Niet toegestaan als levensmiddelenadditief in de EU",notChecked:"Toelating niet individueel gecontroleerd",none:"Geen overeenkomende records.",failed:"De databank kon niet worden geladen. Herlaad de pagina.",footer:"Niet-gevalideerd onderzoeksconcept. Geen fatwa of productcertificatie. Gegevens gecontroleerd",legal:"Juridisch en privacy"}
  };
  const statusIds = ["all","verify","unknown","haram_indicator","claim_only"];
  const types = [["all","all"],["e_additive","e"],["ingredient_derivative","derivative"],["processing_aid_or_enzyme","enzyme"],["ingredient","ingredient"]];
  let lang = "ar", core = null, offset = 0, query = "", kind = "all", status = "all";
  const pick = (row,key) => row[lang === "ar" ? key+"_ar" : lang === "nl" ? key+"_nl" : key] || row[key] || "";
  const label = (row) => (row[lang] || row.en || row.id);
  function elem(tag, cls, txt) { const el = document.createElement(tag); if (cls) el.className=cls; if (txt !== undefined && txt !== null) el.textContent=String(txt); return el; }
  function link(url,labelText) {
    if (typeof url !== "string" || !/^https:\/\//i.test(url)) return elem("span","meta",labelText);
    const a=elem("a",null,labelText);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;
  }
  function values(select, arr) {
    const current=select.value; select.replaceChildren();
    for(const [val,key] of arr) {const option=elem("option",null,TXT[lang][key] || val);option.value=val;select.append(option);}
    if([...select.options].some(x=>x.value===current)) select.value=current;
  }
  function localise() {
    const t=TXT[lang];
    document.documentElement.lang=lang; document.documentElement.dir=lang==="ar"?"rtl":"ltr";
    document.title=t.heading+" — Halal Lens";
    const map={back:"back",eyebrow:"eyebrow",heading:"heading",lead:"lead",safety:"safety",sEntries:"sEntries",sE:"sE",sSources:"sSources",searchTitle:"search",qLabel:"query",kindLabel:"kind",statusLabel:"status",export:"export",more:"more",sourcesTitle:"sourceRegister",sourcesIntro:"sourceIntro",legal:"legal"};
    for(const [id,key] of Object.entries(map)) $(id).textContent=t[key];
    values($("kind"),types);values($("status"),statusIds.map(x=>[x,x]));
    $("language").value=lang;
    if(core){render(true);showSources();}
    $("footer").firstChild.textContent=t.footer+": ";
  }
  function stat() {
    $("countEntries").textContent=core.stats.ingredients.toLocaleString(lang);
    $("countE").textContent=core.stats.eNumbers.toLocaleString(lang);
    $("countSources").textContent=core.stats.sources.toLocaleString(lang);
    $("reviewDate").textContent=core.data.reviewDate || "—";
  }
  function card(row){
    const t=TXT[lang], box=elem("article","card");
    const top=elem("div"); if(row.code) top.append(elem("span","code",row.code));top.append(elem("span","pill "+row.status,t[row.status] || t.unknown));box.append(top);
    box.append(elem("h3",null,label(row)));
    if(lang!=="en"&&row.en&&row.en!==label(row)) box.append(elem("div","meta",row.en));
    box.append(elem("p","why",pick(row,"why") || t.unknown));
    if(row.localisation) box.append(elem("small","meta",lang==="ar"?"بعض الأسماء غير مترجمة أو غير مدققة":"Some names are untranslated or unreviewed"));
    if(row.regulatoryStatus && row.regulatoryStatus.status==="not_authorised_as_food_additive") box.append(elem("p","regulatory",t.unauthorised+" · "+(row.regulatoryStatus.regulation||"")));
    const details=elem("details","evidence");details.append(elem("summary",null,t.sources+" ("+(row.sourceIds||[]).length+")"));
    const decision=row.decision||{}, note=elem("p");
    note.textContent=t.ruling+": "+t.undetermined+" · "+t.identity+": "+(decision.identityConfidence||t.unknown)+" · "+t.origin+": "+(decision.originConfidence||t.unknown);
    details.append(note);
    if(Array.isArray(decision.needs) && decision.needs.length) details.append(elem("p",null,t.needs+": "+decision.needs.join(" • ")));
    if(row.kind==="e_additive"&&!row.regulatoryStatus) details.append(elem("p",null,t.notChecked));
    const list=elem("ul");for(const id of row.sourceIds||[]) {const source=core.sources.get(id), li=elem("li");
      li.append(source?link(source.url,source.title||id):elem("span",null,id)); if(source&&source.publisher) li.append(elem("span","meta"," · "+source.publisher));list.append(li);
    }details.append(list);box.append(details);return box;
  }
  function render(reset){
    if(!core)return;
    if(reset)offset=0;
    query=$("query").value;kind=$("kind").value;status=$("status").value;
    const page=core.find({query,kind,status,offset,limit:24});
    if(reset)$("results").replaceChildren();
    for(const row of page.items)$("results").append(card(row));
    if(!page.total&&reset)$("results").append(elem("p","empty",TXT[lang].none));
    offset+=page.items.length;
    $("resultCount").textContent=page.total.toLocaleString(lang)+" "+TXT[lang].results;
    $("more").hidden=!page.hasMore;
    $("export").disabled=!page.total;
  }
  function showSources(){
    const root=$("allSources");root.replaceChildren();
    for(const s of core.data.sources) {const e=elem("div","source");const a=link(s.url,s.title||s.id);e.append(a);if(s.publisher)e.append(elem("small",null,s.publisher));root.append(e);}
  }
  function exportCsv(){
    if(!core)return;
    const rows=[["ID","E number","English","Dutch","German","French","Arabic","Kind","Review status","Halal ruling status","Why","Sources"]];
    // Export all filtered records via paginated reads (not just first 24).
    let start=0,page;
    do {page=core.find({query,kind,status,offset:start,limit:60});
      for(const r of page.items)rows.push([r.id,r.code||"",r.en,r.nl,r.de,r.fr,r.ar,r.kind,r.status,r.decision?.halalRulingConfidence||"",r.why,(r.sourceIds||[]).join(" | ")]);
      start+=page.items.length;
    } while(page.hasMore&&page.items.length);
    const csv=rows.map(row=>row.map(value=>{
      let v=String(value??"").replace(/^[\s]*[=+\-@]/,"'$&");
      return '"'+v.replace(/"/g,'""')+'"';
    }).join(",")).join("\r\n");
    const blob=new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob);
    const a=elem("a");a.href=url;a.download="halal-lens-evidence.csv";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function boot(){
    let saved="";try{saved=localStorage.getItem("halal-lens-language")||""}catch(_){}
    lang=TXT[saved]?saved:TXT[(navigator.language||"ar").slice(0,2)]?(navigator.language||"ar").slice(0,2):"ar";
    const deepQuery = new URLSearchParams(location.search).get("q");
    if (deepQuery) $("query").value = deepQuery.slice(0,120);
    localise();
    $("language").addEventListener("change",e=>{lang=TXT[e.target.value]?e.target.value:"ar";try{localStorage.setItem("halal-lens-language",lang)}catch(_){}localise();});
    for(const id of ["query","kind","status"])$(id).addEventListener(id==="query"?"input":"change",()=>render(true));
    $("more").addEventListener("click",()=>render(false));
    $("export").addEventListener("click",exportCsv);
    try{
      const response=await fetch("/data/evidence-knowledge.json",{credentials:"same-origin"});
      if(!response.ok)throw Error("http "+response.status);
      core=EvidenceCore.create(await response.json());stat();render(true);showSources();
    }catch(error){console.error("Evidence load failed",error);$("resultCount").textContent=TXT[lang].failed;}
  }
  boot();
})();