/* Evidence-first catalogue search: pure functions for both Node tests and browser UI. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.EvidenceCore = api;
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  function norm(v) {
    return String(v == null ? "" : v).normalize("NFKD")
      .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, "")
      .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
      .toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ").trim();
  }
  function code(v) {
    const m = String(v || "").trim().match(/^e[\s-]*(\d{3,4})([a-z])?(?:\s*\(\s*(i{1,3}|iv|v)\s*\))?$/i);
    return m ? "E" + m[1] + (m[2] || "").toLowerCase() + (m[3] ? "(" + m[3].toLowerCase() + ")" : "") : null;
  }
  function validate(data) {
    if (!data || !Array.isArray(data.ingredients) || !Array.isArray(data.sources)) throw Error("Invalid evidence structure");
    const ids = new Set(), refs = new Set(data.sources.map(x => x.id)), codes = new Set();
    for (const row of data.ingredients) {
      if (!row.id || ids.has(row.id)) throw Error("Duplicate/missing ingredient ID: " + row.id);
      ids.add(row.id);
      if (!row.sourceIds || !row.sourceIds.length || row.sourceIds.some(id => !refs.has(id))) throw Error("Missing source: " + row.id);
      if (!row.decision || !row.decision.halalRulingConfidence) throw Error("Missing evaluation scope: " + row.id);
      if (row.kind === "e_additive") {
        if (!row.code || codes.has(row.code)) throw Error("Duplicate/missing E identifier: " + row.code);
        codes.add(row.code);
      }
    }
    return {ingredients: ids.size, eNumbers: codes.size, sources: refs.size};
  }
  function create(data) {
    const stats = validate(data);
    const rows = data.ingredients.map(row => {
      const names = [row.id, row.code, row.en, row.nl, row.de, row.fr, row.ar, ...(row.aliases || [])];
      return {row, hay: norm(names.filter(Boolean).join(" | ")), head: norm(row.en || ""), exactCode: row.code || ""};
    });
    const sources = new Map(data.sources.map(x => [x.id, x]));
    const byCode = new Map(rows.filter(x => x.exactCode).map(x => [x.exactCode.toLowerCase(), x.row]));
    function find(opts = {}) {
      const q = norm(opts.query || ""), cq = code(opts.query || "");
      const kind = opts.kind || "all", status = opts.status || "all";
      let filtered = rows.filter(x => (kind === "all" || x.row.kind === kind) &&
        (status === "all" || x.row.status === status));
      if (q) {
        filtered = filtered.filter(x => cq && x.exactCode.toLowerCase() === cq.toLowerCase() || x.hay.includes(q));
        filtered.sort((a, b) => {
          function score(x) {
            return (cq && x.exactCode.toLowerCase() === cq.toLowerCase() ? 100 : 0) +
              (x.head.startsWith(q) ? 20 : 0) + (norm(x.exactCode) === q ? 40 : 0);
          }
          return score(b) - score(a) || a.row.id.localeCompare(b.row.id);
        });
      } else filtered.sort((a,b) => (a.row.code || a.row.en || "").localeCompare(b.row.code || b.row.en || "", undefined, {numeric: true}));
      const total = filtered.length, offset = Math.max(0, Math.floor(opts.offset || 0)), limit = Math.min(60, Math.max(1, Math.floor(opts.limit || 24)));
      return {total, items: filtered.slice(offset, offset + limit).map(x => x.row), hasMore: offset + limit < total};
    }
    return {stats, find, byCode, sources, data};
  }
  return {norm, code, validate, create};
});