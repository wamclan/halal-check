"use strict";
/* Counters for rate limits and the daily cap.
   With UPSTASH_REDIS_REST_URL/TOKEN (or Vercel KV's KV_REST_API_URL/TOKEN) the counts are shared by every
   function instance. Without them, counts live in memory per instance, which only slows abuse down. */
const {fetchTimeout} = require("./util");

const mem = new Map();

function redisConfig(env = process.env) {
  const url = env.UPSTASH_REDIS_REST_URL || env.KV_REST_API_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN || env.KV_REST_API_TOKEN;
  return url && token ? {url: url.replace(/\/$/, ""), token} : null;
}

/* Adds one to the counter `key` and returns the new count. The counter expires after `windowSec`. */
async function bump(key, windowSec) {
  const cfg = redisConfig();
  if (cfg) {
    try {
      const r = await fetchTimeout(cfg.url + "/pipeline", {
        method: "POST",
        headers: {Authorization: "Bearer " + cfg.token, "Content-Type": "application/json"},
        body: JSON.stringify([["INCR", key], ["EXPIRE", key, String(windowSec), "NX"]])
      }, 2500);
      const j = await r.json();
      const n = Array.isArray(j) && j[0] && Number(j[0].result);
      if (n) return n;
    } catch (_) { /* fall through to memory */ }
  }
  const now = Date.now();
  const e = mem.get(key);
  if (!e || e.exp < now) { mem.set(key, {n: 1, exp: now + windowSec * 1000}); return 1; }
  e.n += 1;
  if (mem.size > 5000) for (const [k, v] of mem) if (v.exp < now) mem.delete(k);
  return e.n;
}


/* Premium requests must never fall back to per-instance counters.
   A Redis failure means Argon is unavailable, NOT that limits are bypassed. */
async function bumpStrict(key, windowSec) {
  const cfg = redisConfig();
  if (!cfg) throw new Error("shared_counter_unavailable");
  let r;
  try {
    r = await fetchTimeout(cfg.url + "/pipeline", {
      method: "POST",
      headers: {Authorization: "Bearer " + cfg.token, "Content-Type": "application/json"},
      body: JSON.stringify([["INCR", key], ["EXPIRE", key, String(windowSec), "NX"]])
    }, 2500);
  } catch (_) { throw new Error("shared_counter_unavailable"); }
  if (!r.ok) throw new Error("shared_counter_unavailable");
  let j;
  try { j = await r.json(); } catch (_) { throw new Error("shared_counter_unavailable"); }
  const n = Array.isArray(j) && j[0] && Number(j[0].result);
  if (!Number.isSafeInteger(n) || n < 1 || (j[1] && j[1].error) || j[0].error)
    throw new Error("shared_counter_unavailable");
  return n;
}

module.exports = {bump, bumpStrict, hasRedis: (env = process.env) => !!redisConfig(env)};

