"use strict";
// Client-visible model choices, with server-enforced operator opt-in to the
// more expensive Argon model. Never send API credentials to the browser.
const FLASH = "gemini-3.8-flash";
const ARGON = "gemini-4-argon";
function argonEnabled(env = process.env) {
  return env.GEMINI_ENABLE_ARGON === "true";
}
function options(env = process.env) {
  return {
    models: [
      {id: FLASH, enabled: true},
      {id: ARGON, enabled: argonEnabled(env)}
    ],
    defaultModel: env.GEMINI_MODEL === ARGON && argonEnabled(env) ? ARGON : FLASH,
    argonEnabled: argonEnabled(env)
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
  if (choice === ARGON && !argonEnabled(env))
    return {code: "model_not_enabled"};
  return {model: choice};
}
module.exports = {FLASH, ARGON, options, resolveModel, argonEnabled};