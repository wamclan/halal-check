"use strict";
const {send, sameSite} = require("./_lib/util");
const {options} = require("./_lib/models");
module.exports = async function handler(req, res) {
  if (req.method !== "GET") return send(res, 405, {ok:false,code:"method"},{Allow:"GET"});
  if (!sameSite(req)) return send(res, 403, {ok:false,code:"forbidden"});
  return send(res, 200, Object.assign({ok:true}, options()));
};
