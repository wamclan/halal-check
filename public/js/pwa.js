(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") return;
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js", {scope:"/"}).catch(function (error) {
      console.warn("Offline support is unavailable:", error);
    });
  });
})();
