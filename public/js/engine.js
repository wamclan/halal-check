/* Ingredient engine. Works in the browser (window.HalalEngine) and in Node (module.exports) so the same code is tested. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.HalalEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[ً-ٰٟـ]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");
  }
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const isAr = s => /[؀-ۿ]/.test(s);

  const E_RE = /(?<![\p{L}\p{N}])e[\s-]?(\d{3,4})([a-z])?(?:\([ivx]+\))?(?![\p{L}\p{N}])/giu;
  const NOT_HALAL = /non[\s-]?halal|not halal|niet[\s-]?halal|غير حلال|ليس حلال|haram/g;
  const CLEAR_ANY = /(?<![\p{L}\p{N}])(halal|plant|plants|plantaardig|plantaardige|vegetable|vegetal|vegan|vegetarian|vegetarisch|microbial|microbieel|fish|vis|visgelatine|synthetic|synthetisch|حلال|نباتي|نباتيه)(?![\p{L}\p{N}])/iu;
  const CLEAR_HALAL = /(?<![\p{L}\p{N}])(halal|حلال)(?![\p{L}\p{N}])/iu;
  const ALC_FREE = /alcohol[\s-]*(free|vrij|vrije)|non[\s-]*alcoholic|alcoholvrij|zonder alcohol|without alcohol|free from alcohol|خالي من الكحول|بدون كحول|0[.,]0\s*%/;

  function splitTop(text) {
    const out = []; let depth = 0, cur = "";
    for (const ch of text) {
      if ("([{".includes(ch)) depth++;
      else if (")]}".includes(ch)) depth = Math.max(0, depth - 1);
      if (depth === 0 && /[,;\n\r،؛•·]/.test(ch)) { if (cur.trim()) out.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  function create(data) {
    const rules = data.rules.map(r => {
      const parts = r.terms.map(x => {
        const n = esc(norm(x)).replace(/\s+/g, "\\s+");
        return isAr(x) ? "[وبفلك]?(?:ال)?" + n : n;
      });
      return Object.assign({}, r, {re: new RegExp("(?<![\\p{L}\\p{N}])(?:" + parts.join("|") + ")(?![\\p{L}\\p{N}])", "iu")});
    });
    const eNumbers = data.eNumbers;
    const eLookup = num => eNumbers[String(Number(num))] || null;

    function analyse(text) {
      const items = []; const seen = new Set();
      for (const seg of splitTop(String(text || ""))) {
        const n = norm(seg).replace(NOT_HALAL, " ");
        const hasE = [...n.matchAll(E_RE)];
        const snippet = seg.length > 70 ? seg.slice(0, 67) + "…" : seg;
        const push = (key, status, name, why, code) => {
          if (seen.has(key)) return; seen.add(key);
          items.push({status, name, why, code, seg: snippet});
        };
        const clears = cl => (cl === "halal" ? CLEAR_HALAL : CLEAR_ANY).test(n);
        for (const m of hasE) {
          const rule = eLookup(m[1]);
          if (!rule) continue;
          const code = "E" + m[1] + (m[2] ? m[2].toLowerCase() : "");
          const cleared = clears("any");
          push("E" + m[1], cleared ? "ok" : rule.status, rule.name, cleared ? null : rule.reason, code);
        }
        for (const r of rules) {
          if (r.skipWhenENumberPresent && hasE.length) continue;
          if (!r.re.test(n)) continue;
          if (r.id === "alcohol" && ALC_FREE.test(n)) continue;
          if (r.status === "bad") { push(r.id, "bad", r.name, r.reason); continue; }
          const cleared = clears(r.clearedBy || "any");
          if (cleared && r.clearedBy === "halal") continue;
          push(r.id, cleared ? "ok" : "warn", r.name, cleared ? null : r.reason);
        }
      }
      const order = {bad: 0, warn: 1, ok: 2};
      items.sort((a, b) => order[a.status] - order[b.status]);
      return items;
    }

    function verdictOf(items) {
      if (items.some(i => i.status === "bad")) return "bad";
      if (items.some(i => i.status === "warn")) return "warn";
      return "ok";
    }

    /* E-number lookup for the E-number tab. Returns null when the input is not an E-number. */
    function lookupE(raw) {
      const m = String(raw).trim().match(/^e?[\s-]*(\d{3,4})\s*([a-z])?(?:\([ivx]+\))?$/i);
      if (!m) return null;
      const code = "E" + m[1] + (m[2] ? m[2].toLowerCase() : "");
      const rule = eLookup(m[1]);
      return {code, rule: rule ? {status: rule.status, name: rule.name, reason: rule.reason} : null};
    }

    return {analyse, verdictOf, lookupE, norm, meta: data.meta};
  }

  /* GTIN check digit (EAN-8, UPC-A, EAN-13, GTIN-14). */
  function validGtin(code) {
    if (!/^\d{8}$|^\d{12,14}$/.test(code)) return false;
    const d = code.split("").map(Number); const check = d.pop();
    let sum = 0;
    for (let i = d.length - 1, w = 3; i >= 0; i--, w = w === 3 ? 1 : 3) sum += d[i] * w;
    return (10 - (sum % 10)) % 10 === check;
  }

  return {create, validGtin, norm};
});
