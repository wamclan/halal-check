"use strict";
/* Shared helpers for the serverless functions. Files starting with _ are not exposed as routes. */

function send(res, status, body, headers) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (headers) for (const k of Object.keys(headers)) res.setHeader(k, headers[k]);
  res.end(JSON.stringify(body));
}

function clientIp(req) {
  const xff = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return String(req.headers["x-real-ip"] || xff || (req.socket && req.socket.remoteAddress) || "unknown");
}

/* Browsers send Sec-Fetch-Site. Anything that says it came from another site is refused. */
function sameSite(req) {
  const s = req.headers["sec-fetch-site"];
  return !s || s === "same-origin" || s === "same-site" || s === "none";
}

async function readJson(req, maxBytes) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "string") return JSON.parse(req.body);
    if (Buffer.isBuffer(req.body)) return JSON.parse(req.body.toString("utf8"));
    return req.body;
  }
  const chunks = []; let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > maxBytes) { const e = new Error("too_large"); e.code = "too_large"; throw e; }
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
}

function clean(s, max) {
  return String(s == null ? "" : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ").trim().slice(0, max);
}

async function fetchTimeout(url, opts, ms) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, Object.assign({}, opts, {signal: ctl.signal})); }
  finally { clearTimeout(timer); }
}

module.exports = {send, clientIp, sameSite, readJson, clean, fetchTimeout};
