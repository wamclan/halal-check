(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const state = {lang: "en", tab: "barcode", result: null, file: null, eng: null, ctl: null, camOn: false};
  const L = () => I18N[state.lang];
  const pick = v => (v && typeof v === "object") ? (v[state.lang] || v.en) : v;
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function setStatus(id, text, isErr) { const s = $(id); s.textContent = text || ""; s.className = "status" + (isErr ? " err" : ""); }

  /* ---------- language ---------- */
  function applyLang() {
    const t = L();
    document.documentElement.lang = state.lang;
    document.documentElement.dir = t.dir;
    document.title = t.brand;
    const text = {brandName: "brand", tTitle: "title", tIntro: "intro", "tab-barcode": "tabBarcode", "tab-photo": "tabPhoto", "tab-text": "tabText", "tab-e": "tabE",
      tBarcodeHint: "barcodeHint", lblBarcodePhoto: "scanFromPhoto", tManual: "manualLabel", btnLookup: "lookup", tPhotoHint: "photoHint",
      tDropTitle: "dropTitle", tDropSub: "dropSub", btnPhoto: "analyse", btnStop: "stop", tTextHint: "textHint", btnText: "check", btnClear: "clear",
      tEHint: "eHint", btnE: "checkE", footLegal: "footLegal"};
    for (const id in text) $(id).textContent = t[text[id]];
    $("btnCam").textContent = state.camOn ? t.stopCam : t.startCam;
    $("barcodeInput").placeholder = t.manualPlaceholder;
    document.querySelectorAll(".langs button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === state.lang)));
    const ex = $("examples"); ex.replaceChildren(el("span", "hint", t.exTitle + ":"));
    t.ex.forEach(([name, txt]) => {
      const b = el("button", "chip", name); b.type = "button";
      b.onclick = () => { $("ingText").value = txt; };
      ex.append(b);
    });
    if (state.result) render();
  }

  function setTab(name) {
    if (name !== "barcode") stopCam();
    state.tab = name;
    ["barcode", "photo", "text", "e"].forEach(k => {
      $("tab-" + k).setAttribute("aria-selected", String(k === name));
      $("panel-" + k).hidden = k !== name;
    });
  }

  /* ---------- results ---------- */
  function itemNode(it) {
    const t = L();
    const li = el("li", "item " + it.status);
    const h = el("div", "h");
    const b = el("b", null, pick(it.name));
    if (it.code) b.append(el("span", "code", " " + it.code));
    h.append(b, el("span", "badge " + it.status, it.status === "bad" ? t.sBad : it.status === "warn" ? t.sWarn : t.sOk));
    li.append(h);
    if (it.status === "ok") li.append(el("p", null, t.statedOk));
    else if (it.why) li.append(el("p", null, pick(it.why)));
    if (it.ai) li.append(el("p", null, t.aiNote));
    if (it.seg && !it.code && !it.ai) { const q = el("p", "snip", "“" + it.seg + "”"); q.dir = "auto"; li.append(q); }
    return li;
  }

  function rulesLine() {
    const m = state.eng && state.eng.meta; if (!m) return "";
    const t = L();
    return (m.reviewedBy ? t.rulesReviewed.replace("{by}", m.reviewedBy) : t.rulesDraft).replace("{v}", "v" + m.version);
  }

  function render() {
    const box = $("result"), r = state.result, t = L();
    box.replaceChildren();
    if (!r) { box.hidden = true; return; }
    box.hidden = false;

    if (r.kind === "message") {
      const v = el("div", "verdict warn");
      v.append(el("p", null, t[r.msg]));
      if (r.goPhoto) { const b = el("button", "btn", t.goPhoto); b.type = "button"; b.onclick = () => { setTab("photo"); $("panel-photo").scrollIntoView({block: "start"}); }; v.append(b); }
      box.append(v);
      appendRead(box, r.read);
    } else {
      const v = el("div", "verdict " + r.verdict);
      v.append(el("span", "tag", t.tag));
      v.append(el("h2", null, r.verdict === "bad" ? t.vBad : r.verdict === "warn" ? t.vWarn : t.vOk));
      const desc = r.mode === "e" && !r.items.length ? t.eNotFound : r.verdict === "bad" ? t.dBad : r.verdict === "warn" ? t.dWarn : t.dOk;
      v.append(el("p", null, desc));
      v.append(el("p", "cert", t.notCert));
      box.append(v);
      if (r.items.length) {
        box.append(el("h3", "hint", t.flagged));
        const ul = el("ul", "ledger");
        r.items.forEach(it => ul.append(itemNode(it)));
        box.append(ul);
      }
      appendRead(box, r.read);
      box.append(el("p", "meta", rulesLine()));
    }
    box.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start"});
  }

  function appendRead(box, rd) {
    if (!rd) return;
    const t = L();
    if (!(rd.product || rd.text || rd.halalMark || rd.dbHalal || rd.sourceUrl)) return;
    const d = el("div", "read");
    const line = (label, val) => { const p = el("div"); p.append(el("b", null, label + ": "), document.createTextNode(val)); d.append(p); };
    if (rd.product) line(t.product, rd.brand ? rd.product + " (" + rd.brand + ")" : rd.product);
    if (rd.text) line(t.read, rd.text);
    if (rd.halalMark) d.append(el("div", null, "✓ " + t.halalMark));
    if (rd.dbHalal) d.append(el("div", null, "✓ " + t.halalLabelDb));
    if (rd.sourceUrl) {
      d.append(el("div", null, t.dataSource));
      const a = el("a", null, t.openOff); a.href = rd.sourceUrl; a.target = "_blank"; a.rel = "noopener noreferrer"; d.append(a);
    }
    box.append(d);
  }

  function ready() {
    if (state.eng) return true;
    state.result = {kind: "message", msg: "errRules"}; render(); return false;
  }

  function showAnalysis(mode, items, read) {
    state.result = {kind: "analysis", mode, items, verdict: state.eng.verdictOf(items), read};
    render();
  }

  function runText(text, read) {
    if (!ready()) return;
    if (!String(text).trim()) { state.result = {kind: "message", msg: "none"}; return render(); }
    showAnalysis("text", state.eng.analyse(text), read || null);
  }

  function runE() {
    if (!ready()) return;
    const f = state.eng.lookupE($("eInput").value);
    if (!f) { state.result = {kind: "message", msg: "eBadFmt"}; return render(); }
    showAnalysis("e", f.rule ? [{status: f.rule.status, name: f.rule.name, why: f.rule.reason, code: f.code}] : [], null);
  }

  /* ---------- barcode ---------- */
  async function lookup(raw) {
    if (!ready()) return;
    const code = String(raw || "").replace(/\D/g, "");
    if (!HalalEngine.validGtin(code)) return setStatus("camStatus", L().badBarcode, true);
    stopCam();
    setStatus("camStatus", L().looking);
    try {
      const r = await fetch("/api/product?code=" + (code.length === 12 ? "0" + code : code) + "&lang=" + state.lang);
      const j = await r.json().catch(() => ({}));
      if (!j.ok) return setStatus("camStatus", j.code === "rate_limited" ? L().errRate : L().errGeneric, true);
      setStatus("camStatus", "");
      const read = {product: j.name, brand: j.brand, sourceUrl: j.sourceUrl, dbHalal: !!j.halalLabel};
      if (!j.found) { state.result = {kind: "message", msg: "notFound", goPhoto: true}; return render(); }
      if (!j.ingredients) { state.result = {kind: "message", msg: "noIngredients", goPhoto: true, read}; return render(); }
      read.text = j.ingredients;
      showAnalysis("barcode", state.eng.analyse(j.ingredients), read);
    } catch (_) { setStatus("camStatus", L().errNetwork, true); }
  }

  async function startCam() {
    $("finder").hidden = false; setStatus("camStatus", L().camStarting);
    try {
      await Scanner.start($("cam"), text => {
        const code = String(text).replace(/\D/g, "");
        if (!HalalEngine.validGtin(code)) return;
        try { navigator.vibrate && navigator.vibrate(60); } catch (_) {}
        $("barcodeInput").value = code; lookup(code);
      });
      state.camOn = true; $("btnCam").textContent = L().stopCam; setStatus("camStatus", L().camHelp);
    } catch (e) {
      $("finder").hidden = true; state.camOn = false;
      setStatus("camStatus", e && e.code === "denied" ? L().camDenied : L().camUnsupported, true);
    }
  }
  function stopCam() {
    Scanner.stop(); state.camOn = false; $("finder").hidden = true;
    $("btnCam").textContent = L().startCam;
  }

  /* ---------- photo ---------- */
  async function toJpeg(file) {
    let src, w, h, cleanup = () => {};
    try { src = await createImageBitmap(file, {imageOrientation: "from-image"}); w = src.width; h = src.height; }
    catch (_) {
      const url = URL.createObjectURL(file);
      src = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
      w = src.naturalWidth; h = src.naturalHeight; cleanup = () => URL.revokeObjectURL(url);
    }
    let blob = null;
    for (const [max, q] of [[1600, 0.85], [1400, 0.78], [1100, 0.7]]) {
      const s = Math.min(1, max / Math.max(w, h));
      const c = document.createElement("canvas"); c.width = Math.round(w * s); c.height = Math.round(h * s);
      c.getContext("2d").drawImage(src, 0, 0, c.width, c.height);
      blob = await new Promise(ok => c.toBlob(ok, "image/jpeg", q));
      if (blob && blob.size <= 2.4e6) break;
    }
    cleanup();
    if (!blob) throw new Error("image");
    return new Promise((ok, no) => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result).split(",")[1]); fr.onerror = no; fr.readAsDataURL(blob); });
  }

  function photoError(code) {
    const t = L();
    return {not_configured: t.errNotConfigured, rate_limited: t.errRate, daily_cap: t.errDaily, bad_image: t.errImg, too_large: t.errTooLarge, refused: t.errRefused,
      unreadable: t.errUnreadable, upstream_busy: t.errBusy, upstream_timeout: t.errBusy}[code] || t.errGeneric;
  }

  async function readPhoto() {
    if (!state.file || !ready()) return;
    setStatus("photoStatus", L().reading);
    $("btnPhoto").disabled = true; $("btnStop").hidden = false;
    state.ctl = new AbortController();
    try {
      const image = await toJpeg(state.file);
      const r = await fetch("/api/read-label", {method: "POST", headers: {"Content-Type": "application/json"}, signal: state.ctl.signal,
        body: JSON.stringify({image, mime: "image/jpeg", lang: state.lang})});
      const j = await r.json().catch(() => ({ok: false, code: r.status === 413 ? "too_large" : "error"}));
      if (!j.ok) return setStatus("photoStatus", photoError(j.code), true);
      setStatus("photoStatus", "");
      const text = j.ingredients || "";
      $("ingText").value = text;
      const items = state.eng.analyse(text);
      const have = new Set(items.map(i => state.eng.norm(pick(i.name))));
      /* The AI may add doubts, never a haram verdict: its items are always "doubtful" and marked as suggestions. */
      (j.extra || []).forEach(x => { if (!have.has(state.eng.norm(x.term))) items.push({status: "warn", name: x.term, why: x.reason, ai: true}); });
      if (!text && !j.product) { state.result = {kind: "message", msg: "none"}; return render(); }
      showAnalysis("photo", items, {product: j.product, text, halalMark: j.halalMark});
    } catch (e) {
      if (!(e && e.name === "AbortError")) setStatus("photoStatus", e && e.message === "image" ? L().errImg : L().errNetwork, true);
      else setStatus("photoStatus", "");
    } finally { $("btnPhoto").disabled = false; $("btnStop").hidden = true; state.ctl = null; }
  }

  function onFile(f) {
    const pv = $("preview");
    if (pv.dataset.url) { try { URL.revokeObjectURL(pv.dataset.url); } catch (_) {} pv.dataset.url = ""; }
    state.file = f || null;
    if (!f) { pv.hidden = true; $("dropIdle").hidden = false; $("btnPhoto").disabled = true; return; }
    const u = URL.createObjectURL(f); pv.dataset.url = u; pv.src = u; pv.hidden = false; $("dropIdle").hidden = true;
    $("btnPhoto").disabled = false; setStatus("photoStatus", "");
  }

  /* ---------- boot ---------- */
  async function boot() {
    let saved = null; try { saved = localStorage.getItem("halal-lang"); } catch (_) {}
    const nav = (navigator.language || "en").slice(0, 2);
    state.lang = I18N[saved] ? saved : I18N[nav] ? nav : "en";
    document.querySelectorAll(".langs button").forEach(b => b.onclick = () => {
      state.lang = b.dataset.lang;
      try { localStorage.setItem("halal-lang", state.lang); } catch (_) {}
      applyLang();
    });
    document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => setTab(b.dataset.tab));
    $("btnCam").onclick = () => state.camOn ? stopCam() : startCam();
    $("btnLookup").onclick = () => lookup($("barcodeInput").value);
    $("barcodeInput").addEventListener("keydown", e => { if (e.key === "Enter") lookup($("barcodeInput").value); });
    $("barcodePhoto").addEventListener("change", async e => {
      const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return;
      setStatus("camStatus", L().looking);
      const code = await Scanner.fromImage(f);
      if (!code) return setStatus("camStatus", L().noBarcodeFound, true);
      $("barcodeInput").value = code.replace(/\D/g, ""); lookup(code);
    });
    $("btnText").onclick = () => runText($("ingText").value, null);
    $("btnClear").onclick = () => { $("ingText").value = ""; state.result = null; render(); };
    $("btnE").onclick = runE;
    $("eInput").addEventListener("keydown", e => { if (e.key === "Enter") runE(); });
    $("photoInput").addEventListener("change", e => onFile(e.target.files && e.target.files[0]));
    $("btnPhoto").onclick = readPhoto;
    $("btnStop").onclick = () => state.ctl && state.ctl.abort();
    applyLang(); setTab("barcode");
    try {
      const res = await fetch("/data/rules.json");
      if (!res.ok) throw new Error("rules");
      state.eng = HalalEngine.create(await res.json());
    } catch (_) { state.result = {kind: "message", msg: "errRules"}; render(); }
  }
  window.addEventListener("pagehide", () => Scanner.stop());
  boot();
})();
