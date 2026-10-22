"use strict";
/* GET /api/product?code=<barcode>&lang=en|nl|ar
   Looks a barcode up in Open Food Facts (community data, ODbL licence) and returns name, brand and ingredients. */
const {send, clientIp, sameSite, clean, fetchTimeout} = require("./_lib/util");
const {bump} = require("./_lib/limit");

const FIELDS = "code,product_name,brands,ingredients_text,ingredients_text_en,ingredients_text_nl,ingredients_text_ar,labels_tags";

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, {ok: false, code: "method"}, {Allow: "GET"});
  if (!sameSite(req)) return send(res, 403, {ok: false, code: "forbidden"});

  const url = new URL(req.url, "http://localhost");
  const code = url.searchParams.get("code") || "";
  const lang = ["en", "nl", "ar"].includes(url.searchParams.get("lang")) ? url.searchParams.get("lang") : "en";
  if (!/^\d{8,14}$/.test(code)) return send(res, 400, {ok: false, code: "bad_code"});

  const n = await bump("rl:product:" + clientIp(req), 3600);
  if (n > Number(process.env.PRODUCT_RATE_PER_HOUR || 90)) return send(res, 429, {ok: false, code: "rate_limited"});

  const base = (process.env.OFF_API_BASE || "https://world.openfoodfacts.org").replace(/\/$/, "");
  const contact = process.env.CONTACT_EMAIL || "no-contact-set";
  let r;
  try {
    r = await fetchTimeout(base + "/api/v2/product/" + code + ".json?fields=" + FIELDS, {
      headers: {"User-Agent": "HalalCheck/1.0 (" + contact + ")", Accept: "application/json"}
    }, 8000);
  } catch (_) { return send(res, 504, {ok: false, code: "upstream_timeout"}); }

  if (r.status === 404) return send(res, 200, {ok: true, found: false, code});
  if (!r.ok) return send(res, 502, {ok: false, code: "upstream_error"});
  let j;
  try { j = await r.json(); } catch (_) { return send(res, 502, {ok: false, code: "upstream_error"}); }
  const p = j && j.product;
  if (!p || j.status === 0) return send(res, 200, {ok: true, found: false, code}, {"Cache-Control": "public, s-maxage=3600"});

  const own = p["ingredients_text_" + lang];
  const text = clean(own || p.ingredients_text || p.ingredients_text_en || p.ingredients_text_nl || p.ingredients_text_ar, 4000);
  const tags = Array.isArray(p.labels_tags) ? p.labels_tags : [];
  return send(res, 200, {
    ok: true, found: true, code,
    name: clean(p.product_name, 140),
    brand: clean(p.brands, 100),
    ingredients: text,
    halalLabel: tags.some(t => /(^|:)halal$/.test(String(t))),
    sourceUrl: "https://world.openfoodfacts.org/product/" + code
  }, {"Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800"});
};
