"use strict";
/* Local server for development and tests: serves public/ and mounts the files in api/ like Vercel does.
   Usage: node scripts/dev-server.js [port]   (reads GEMINI_API_KEY etc. from the environment) */
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "public");
const types = {".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json",
  ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png", ".txt": "text/plain", ".webmanifest": "application/manifest+json"};

/* Apply the same response headers as vercel.json so the Content-Security-Policy is exercised locally. */
let globalHeaders = [];
try {
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "vercel.json"), "utf8"));
  const g = (cfg.headers || []).find(h => h.source === "/(.*)");
  if (g) globalHeaders = g.headers;
} catch (_) {}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://localhost");
  for (const h of globalHeaders) res.setHeader(h.key, h.value);
  if (u.pathname.startsWith("/api/")) {
    const name = u.pathname.slice(5).replace(/[^a-z0-9-]/gi, "");
    const file = path.join(__dirname, "..", "api", name + ".js");
    if (!name || !fs.existsSync(file)) { res.statusCode = 404; return res.end("not found"); }
    delete require.cache[require.resolve(file)];
    try { return await require(file)(req, res); }
    catch (e) { console.error(e); res.statusCode = 500; return res.end("error"); }
  }
  let p = decodeURIComponent(u.pathname);
  if (p === "/") p = "/index.html";
  else if (!path.extname(p)) p += ".html";
  const f = path.normalize(path.join(root, p));
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.statusCode = 404; return res.end("not found"); }
  res.setHeader("Content-Type", types[path.extname(f)] || "application/octet-stream");
  fs.createReadStream(f).pipe(res);
});

if (require.main === module) {
  const port = Number(process.argv[2] || process.env.PORT || 3000);
  server.listen(port, () => console.log("http://localhost:" + port));
}
module.exports = server;
