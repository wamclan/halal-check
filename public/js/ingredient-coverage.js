/* Heuristic ingredient-language hints, never certified translation. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.IngredientCoverage = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const WORDS = {
    de: ["zutaten","speisefettsäuren","magnesiumsalze","trennmittel","füllstoff","nahrungsergänzungsmittel","farbstoff","magnesiumoxid","käse","molke"],
    da: ["ingredienser","æggeblomme","rapsolie","sennepsmel","worcestersaus","ansjospaste","hvidløgspulver","eddike","xanthangummi","stabilisator","parmesanost"],
    nl: ["ingrediënten","zonnebloemolie","stremsel","aardappelzetmeel","weipoeder","plantaardige","suiker"],
    en: ["ingredients","cheese","whey","flavouring","sunflower oil","vegetable oil","sugar","egg yolk"],
    fr: ["ingrédients","présure","fromage","gélatine","sucre","huile végétale"],
    ar: ["المكونات","مكونات","منفحة","السكر","جبن","الجيلاتين"]
  };
  const NAMES = {
    de: {en:"German",nl:"Duits",ar:"الألمانية"},
    da: {en:"Danish",nl:"Deens",ar:"الدنماركية"},
    en: {en:"English",nl:"Engels",ar:"الإنجليزية"},
    nl: {en:"Dutch",nl:"Nederlands",ar:"الهولندية"},
    fr: {en:"French",nl:"Frans",ar:"الفرنسية"},
    ar: {en:"Arabic",nl:"Arabisch",ar:"العربية"},
    und: {en:"Not identified",nl:"Niet vastgesteld",ar:"غير محددة"}
  };
  function containsWord(text, term) {
    return new RegExp("(?<![\\p{L}\\p{N}])" + term.replace(/ +/g,"\\s+") + "(?![\\p{L}\\p{N}])", "iu").test(text);
  }
  function infer(text) {
    const input = String(text || "").normalize("NFC").toLocaleLowerCase();
    if (!input.trim()) return {language:"und",hintCount:0,method:"insufficient"};
    const scored = Object.entries(WORDS).map(([language,terms]) => ({language,score:terms.filter(t=>containsWord(input,t)).length}));
    scored.sort((a,b)=>b.score-a.score);
    if (scored[0].score < 2 || scored[0].score === scored[1].score) return {language:"und",hintCount:scored[0].score,method:"insufficient"};
    return {language:scored[0].language,hintCount:scored[0].score,method:"keyword-hint"};
  }
  function label(language, uiLanguage) {
    return (NAMES[language] || NAMES.und)[uiLanguage] || (NAMES[language] || NAMES.und).en;
  }
  function screeningVerdict(items) {
    if (items.some(i=>i.status==="bad")) return "bad";
    if (items.some(i=>i.status==="warn")) return "warn";
    return "review";
  }
  return {infer,label,screeningVerdict};
});