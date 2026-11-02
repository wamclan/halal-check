"use strict";
// Client-visible model choices, with server-enforced operator opt-in to the
// more expensive Argon model. Never send API credentials to the browser.
const FLASH = "gemini-3.8-flash";
const ARGON = "gemini-4-argon";
const {hasRedis} = require("./limit");
function argonEnabled(env = process.env) {
  return env.GEMINI_ENABLE_ARGON === "true" && hasRedis(env);
}
function options(env = process.env) {
  return {
    models: [
      {id: FLASH, enabled: true},
      {id: ARGON, enabled: argonEnabled(env)}
    ],
    defaultModel: env.GEMINI_MODEL === ARGON && argonEnabled(env) ? ARGON : FLASH,
    argonEnabled: argonEnabled(env),
    // Safe public flags only; do not expose secret URLs or tokens.
    argonPrerequisite: env.GEMINI_ENABLE_ARGON === "true" && !hasRedis(env) ? "shared_counter_required" : null
  };
}
function resolveModel(requested, env = process.env) {
  if (requested !== undefined && requested !== null && typeof requested !== "string")
    return {code: "invalid_model_selection"};
  const choice = requested ? requested.trim() : (env.GEMINI_MODEL || FLASH);
  // Keep older operator-controlled defaults compatible, but never accept
  // arbitrary model names from public clients.
  if (requested && choice !== FLASH && choice !== ARGON)
    return {code: "invalid_model_selection"};
  if (!/^[a-zA-Z0-9._-]{2,90}$/.test(choice))
    return {code: "invalid_model_config"};
  if (choice === ARGON && env.GEMINI_ENABLE_ARGON !== "true")
    return {code: "model_not_enabled"};
  if (choice === ARGON && !hasRedis(env))
    return {code: "premium_limits_unavailable"};
  return {model: choice};
}
module.exports = {FLASH, ARGON, options, resolveModel, argonEnabled};