/* Barcode scanning on the device with ZXing. No video or image leaves the phone.
   The camera loop is our own: ZXing's built-in loop stops for good on the first unexpected error (for example
   a frame decoded before the video has its first picture), which would leave the scanner dead. */
(function () {
  "use strict";
  let reader = null, stream = null, timer = null, active = false, videoEl = null;

  function hints() {
    const h = new Map();
    h.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [ZXing.BarcodeFormat.EAN_13, ZXing.BarcodeFormat.EAN_8, ZXing.BarcodeFormat.UPC_A]);
    h.set(ZXing.DecodeHintType.TRY_HARDER, true);
    return h;
  }

  async function start(video, onCode) {
    if (!window.ZXing || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw {code: "unsupported"};
    stop();
    active = true; videoEl = video;
    try {
      stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: {ideal: "environment"}, width: {ideal: 1280}, height: {ideal: 720}}, audio: false});
      if (!active) { stream.getTracks().forEach(t => t.stop()); stream = null; return; }
      video.srcObject = stream;
      await video.play();
    } catch (e) {
      stop();
      const denied = e && (e.name === "NotAllowedError" || e.name === "SecurityError" || e.name === "PermissionDeniedError");
      throw {code: denied ? "denied" : "unsupported"};
    }
    reader = new ZXing.MultiFormatReader();
    const h = hints();
    /* Frames are copied to our own canvas and decoded with ZXing's core reader. ZXing's own video helper skipped
       barcodes that this path reads at once (tested with a fake camera feed of a real EAN-13). */
    const cv = document.createElement("canvas");
    const ctx = cv.getContext("2d", {willReadFrequently: true});
    const tick = () => {
      if (!active) return;
      if (video.readyState >= 2 && video.videoWidth > 0) {
        try {
          cv.width = video.videoWidth; cv.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          const bitmap = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(new ZXing.HTMLCanvasElementLuminanceSource(cv)));
          const res = reader.decode(bitmap, h);
          if (res && active) onCode(res.getText());
        } catch (_) { /* no barcode in this frame */ }
      }
      if (active) timer = setTimeout(tick, 200);
    };
    tick();
  }

  function stop() {
    active = false;
    if (timer) { clearTimeout(timer); timer = null; }
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    if (videoEl) { try { videoEl.pause(); } catch (_) {} videoEl.srcObject = null; videoEl = null; }
    reader = null;
  }

  async function fromImage(file) {
    if (!window.ZXing) return null;
    const r = new ZXing.BrowserMultiFormatReader(hints());
    const url = URL.createObjectURL(file);
    try { return (await r.decodeFromImageUrl(url)).getText(); }
    catch (_) { return null; }
    finally { URL.revokeObjectURL(url); try { r.reset(); } catch (_) {} }
  }

  window.Scanner = {start, stop, fromImage, isActive: () => active};
})();
