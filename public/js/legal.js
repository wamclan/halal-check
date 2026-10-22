(function () {
  "use strict";
  const DOC = {
    en: {title: "About, terms and privacy", back: "Back to the checker", missing: "Operator details are not filled in yet (public/site-config.json).", operator: "Operator", contact: "Contact", sections: [
      {h: "How it works", p: [
        "Halal Check compares the ingredients of a food product with a list of ingredients that Muslims consider haram or doubtful (mushbooh).",
        "The ingredients come from a barcode lookup in Open Food Facts, from a photo read by an AI service, or from text you type or paste.",
        "The rules are a keyword list and a list of E-numbers. The rules version, date and review status are shown under every result.",
        "Scholars differ on some items, for example enzymes, rennet, carmine and alcohol in flavourings. When a ruling depends on the source or the school of thought, the item is marked doubtful.",
        "\"Nothing flagged\" only means that none of the ingredients we could check is on our list. It does not mean that the product is halal."]},
      {h: "Terms of use", p: [
        "Halal Check is an aid. It is not a halal certificate, a fatwa or a religious ruling.",
        "Results can be wrong. Ingredient data can be outdated or misread, the rules can be incomplete, and recipes change. Always check the pack and, when in doubt, ask the producer or a qualified scholar.",
        "You use this site at your own responsibility. As far as the law allows, the operator is not liable for damage that results from using it.",
        "The site does not rate or name brands as halal or haram. Only upload photos of product packaging, never of people."]},
      {h: "Privacy", p: [
        "Photo tab: your photo is sent to our server and on to Google (Gemini API), which reads the text. We do not store the photo or the text. Google processes it under its Gemini API terms and may keep it for a limited time, as described there.",
        "Barcode tab: the number you scan or type is sent to our server, which asks Open Food Facts about the product. Open Food Facts receives the number from our server, not your IP address.",
        "The camera image is analysed on your device. It is not recorded and not sent anywhere.",
        "Lists and E-numbers you type stay in your browser.",
        "Your IP address is used for a counter that limits abuse, kept for up to one hour. Our hosting provider (Vercel) also processes IP addresses in its server logs.",
        "Your browser stores one thing: your language choice. There are no cookies, no analytics, no ads and no trackers. Fonts are served from this site.",
        "You can ask us about, correct or erase your data using the contact address below. You can also complain to the Dutch Data Protection Authority (Autoriteit Persoonsgegevens)."]}]},
    nl: {title: "Over, voorwaarden en privacy", back: "Terug naar de checker", missing: "Gegevens van de beheerder zijn nog niet ingevuld (public/site-config.json).", operator: "Beheerder", contact: "Contact", sections: [
      {h: "Hoe het werkt", p: [
        "Halal Check vergelijkt de ingrediënten van een voedingsproduct met een lijst van ingrediënten die moslims haram of twijfelachtig (mushbooh) vinden.",
        "De ingrediënten komen uit een barcodezoekopdracht in Open Food Facts, uit een foto die door een AI-dienst wordt gelezen, of uit tekst die je zelf typt of plakt.",
        "De regels zijn een lijst met trefwoorden en een lijst met E-nummers. De versie, datum en beoordelingsstatus van de regels staan onder elk resultaat.",
        "Geleerden verschillen van mening over sommige stoffen, zoals enzymen, stremsel, karmijn en alcohol in aroma's. Hangt een oordeel af van de herkomst of de rechtsschool, dan markeren we het ingrediënt als twijfelachtig.",
        "\"Niets gemarkeerd\" betekent alleen dat geen van de ingrediënten die we konden controleren op onze lijst staat. Het betekent niet dat het product halal is."]},
      {h: "Gebruiksvoorwaarden", p: [
        "Halal Check is een hulpmiddel. Het is geen halalcertificaat, geen fatwa en geen religieuze uitspraak.",
        "Resultaten kunnen onjuist zijn. Ingrediëntgegevens kunnen verouderd of verkeerd gelezen zijn, de regels kunnen onvolledig zijn en recepten veranderen. Controleer altijd de verpakking en vraag bij twijfel de producent of een bevoegde geleerde.",
        "Je gebruikt deze site op eigen verantwoordelijkheid. Voor zover de wet het toestaat is de beheerder niet aansprakelijk voor schade door het gebruik ervan.",
        "De site beoordeelt geen merken als halal of haram en noemt ze niet zo. Upload alleen foto's van productverpakkingen, nooit van personen."]},
      {h: "Privacy", p: [
        "Tabblad Foto: je foto gaat naar onze server en vandaar naar Google (Gemini API), dat de tekst leest. Wij slaan de foto en de tekst niet op. Google verwerkt ze volgens de Gemini API-voorwaarden en kan ze beperkte tijd bewaren, zoals daar beschreven.",
        "Tabblad Barcode: het nummer dat je scant of typt gaat naar onze server, die Open Food Facts naar het product vraagt. Open Food Facts ontvangt het nummer van onze server, niet je IP-adres.",
        "Het camerabeeld wordt op je apparaat geanalyseerd. Het wordt niet opgenomen en nergens naartoe gestuurd.",
        "Lijsten en E-nummers die je typt blijven in je browser.",
        "Je IP-adres wordt gebruikt voor een teller die misbruik beperkt en wordt maximaal een uur bewaard. Onze hostingpartij (Vercel) verwerkt IP-adressen ook in zijn serverlogs.",
        "Je browser bewaart één ding: je taalkeuze. Er zijn geen cookies, geen analytics, geen advertenties en geen trackers. Lettertypen komen van deze site zelf.",
        "Je kunt via het contactadres hieronder vragen naar je gegevens, ze laten corrigeren of wissen. Je kunt ook een klacht indienen bij de Autoriteit Persoonsgegevens."]}]},
    ar: {title: "عن الموقع والشروط والخصوصية", back: "العودة إلى أداة الفحص", missing: "بيانات المشغّل غير مكتملة بعد (public/site-config.json).", operator: "المشغّل", contact: "التواصل", sections: [
      {h: "كيف يعمل", p: [
        "يقارن فحص الحلال مكونات المنتج الغذائي بقائمة المكونات التي يعدّها المسلمون حراماً أو مشبوهة.",
        "تأتي المكونات من البحث بالباركود في Open Food Facts، أو من صورة تقرؤها خدمة ذكاء اصطناعي، أو من نص تكتبه أو تلصقه.",
        "القواعد عبارة عن قائمة كلمات مفتاحية وقائمة أرقام E. يظهر رقم إصدار القواعد وتاريخها وحالة مراجعتها تحت كل نتيجة.",
        "يختلف العلماء في بعض المواد مثل الإنزيمات والمنفحة والكرمين والكحول في النكهات. حين يتوقف الحكم على المصدر أو على المذهب نصنّف المكوّن مشبوهاً.",
        "عبارة «لا شيء مُعلَّم» تعني فقط أن أياً من المكونات التي استطعنا فحصها ليس في قائمتنا. ولا تعني أن المنتج حلال."]},
      {h: "شروط الاستخدام", p: [
        "فحص الحلال أداة مساعدة. وليس شهادة حلال ولا فتوى ولا حكماً شرعياً.",
        "قد تكون النتائج خاطئة. فبيانات المكونات قد تكون قديمة أو مقروءة خطأ، والقواعد قد تكون ناقصة، والوصفات تتغير. تحقق دائماً من العبوة، وعند الشك اسأل الشركة المنتجة أو عالماً مؤهلاً.",
        "تستخدم هذا الموقع على مسؤوليتك. وبقدر ما يسمح القانون لا يتحمل المشغّل مسؤولية أي ضرر ينتج عن استخدامه.",
        "لا يصنّف الموقع علامات تجارية بأنها حلال أو حرام ولا يسمّيها. لا ترفع إلا صور عبوات المنتجات، ولا ترفع صور أشخاص."]},
      {h: "الخصوصية", p: [
        "تبويب الصورة: تُرسل صورتك إلى خادمنا ومنه إلى Google (واجهة Gemini) لقراءة النص. لا نحفظ الصورة ولا النص. تعالجها Google وفق شروط واجهة Gemini وقد تحتفظ بها مدة محدودة كما هو موضح هناك.",
        "تبويب الباركود: الرقم الذي تمسحه أو تكتبه يُرسل إلى خادمنا، وهو يسأل Open Food Facts عن المنتج. يستلم Open Food Facts الرقم من خادمنا لا عنوان IP الخاص بك.",
        "صورة الكاميرا تُحلَّل على جهازك. لا تُسجَّل ولا تُرسل إلى أي جهة.",
        "القوائم وأرقام E التي تكتبها تبقى في متصفحك.",
        "يُستخدم عنوان IP الخاص بك في عدّاد يحدّ من إساءة الاستخدام ويُحفظ مدة لا تتجاوز ساعة. كما تعالج شركة الاستضافة (Vercel) عناوين IP في سجلات خوادمها.",
        "يحفظ متصفحك شيئاً واحداً فقط: لغتك المختارة. لا ملفات تعريف ارتباط ولا تحليلات ولا إعلانات ولا متتبعات. الخطوط تُقدَّم من هذا الموقع نفسه.",
        "يمكنك السؤال عن بياناتك أو تصحيحها أو حذفها عبر عنوان التواصل أدناه. ويمكنك أيضاً تقديم شكوى إلى هيئة حماية البيانات الهولندية (Autoriteit Persoonsgegevens)."]}]}
  };

  const $ = id => document.getElementById(id);
  const mk = (tag, text) => { const e = document.createElement(tag); if (text != null) e.textContent = text; return e; };
  let lang = "en", cfg = {};

  function draw() {
    const d = DOC[lang], t = I18N[lang];
    document.documentElement.lang = lang; document.documentElement.dir = t.dir;
    document.title = d.title + " | " + t.brand;
    $("brandName").textContent = t.brand;
    document.querySelectorAll(".langs button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    const root = $("doc"); root.replaceChildren(mk("h1", d.title));
    d.sections.forEach(s => {
      root.append(mk("h2", s.h));
      s.p.forEach(x => root.append(mk("p", x)));
    });
    const who = mk("p"); const ok = cfg.operatorName && cfg.contactEmail;
    if (ok) { who.append(document.createTextNode(d.operator + ": " + cfg.operatorName + ". " + d.contact + ": ")); const a = mk("a", cfg.contactEmail); a.href = "mailto:" + cfg.contactEmail; who.append(a); }
    else { who.className = "warnbox"; who.textContent = d.missing; }
    root.append(who);
    $("backLink").textContent = d.back;
  }

  async function boot() {
    let saved = null; try { saved = localStorage.getItem("halal-lang"); } catch (_) {}
    lang = I18N[saved] ? saved : "en";
    document.querySelectorAll(".langs button").forEach(b => b.onclick = () => {
      lang = b.dataset.lang; try { localStorage.setItem("halal-lang", lang); } catch (_) {} draw();
    });
    draw();
    try { cfg = await (await fetch("/site-config.json")).json(); } catch (_) {}
    draw();
  }
  boot();
})();
