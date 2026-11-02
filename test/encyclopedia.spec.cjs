const { test, expect } = require("@playwright/test");
test.use({ viewport: { width: 390, height: 844 }, locale: "en-US" });
test("evidence page loads every indexed record with source counts", async ({page}) => {
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://127.0.0.1:3000/encyclopedia");
  await page.locator("#language").selectOption("en");
  await expect(page.locator("#countEntries")).toHaveText("431");
  await expect(page.locator("#countE")).toHaveText("346");
  await expect(page.locator("#countSources")).toHaveText("29");
  await expect(page.locator("#results .card")).toHaveCount(24);
  expect(errors).toEqual([]);
});
test("E471 shows uncertainty and its source links", async ({page}) => {
  await page.goto("http://127.0.0.1:3000/encyclopedia?q=E471");
  await page.locator("#language").selectOption("en");
  await expect(page.locator("#results .card").first()).toContainText("E471");
  await expect(page.locator("#results .card").first()).toContainText("Needs verification");
  await page.locator("#results .card").first().locator("details summary").click();
  await expect(page.locator("#results .card").first().locator("details a").first()).toBeVisible();
});
test("E171 has a regulatory alert, not a halal verdict", async ({page}) => {
  await page.goto("http://127.0.0.1:3000/encyclopedia?q=E171");
  await page.locator("#language").selectOption("en");
  await expect(page.locator(".card").first().locator(".regulatory")).toContainText("Not authorised");
  await page.locator(".card").first().locator("details summary").click();
  await expect(page.locator(".card").first().locator("details")).toContainText("Undetermined");
});
test("Arabic is RTL and Dutch can be selected", async ({page}) => {
  await page.goto("http://127.0.0.1:3000/encyclopedia?q=gelatin");
  await page.locator("#language").selectOption("ar");
  await expect(page.locator("html")).toHaveAttribute("dir","rtl");
  await page.locator("#language").selectOption("nl");
  await expect(page.locator("html")).toHaveAttribute("lang","nl");
  await expect(page.locator("#results .card").first()).toBeVisible();
});
test("main scanner includes an evidence catalogue link", async ({page}) => {
  await page.goto("http://127.0.0.1:3000/");
  await expect(page.locator("#evidenceNav")).toHaveAttribute("href","/encyclopedia");
  await page.locator("#tab-e").click();
  await page.locator("#eInput").fill("E471");
  await expect(page.locator("#evidenceLookup")).toHaveAttribute("href","/encyclopedia?q=E471");
});

test("quick E-number lookup distinguishes missing evidence from halal", async ({page}) => {
  await page.goto("http://127.0.0.1:3000/");
  await page.locator(".langs button[data-lang='en']").click();
  await page.locator("#tab-e").click();
  await page.locator("#eInput").fill("E999");
  await page.locator("#btnE").click();
  await expect(page.locator("#result .verdict h2")).toContainText("Insufficient evidence");
  await expect(page.locator("#result")).toContainText("Not a halal certificate");
});

test("PWA can reopen the evidence catalogue without a network", async ({page,context}) => {
  await page.goto("http://127.0.0.1:3000/encyclopedia");
  await expect(page.locator("#countE")).not.toHaveText("—");
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await context.setOffline(true);
  await page.reload({waitUntil:"domcontentloaded"});
  await expect(page.locator("#results .card").first()).toBeVisible();
  await context.setOffline(false);
});


const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/dLkAAAAASUVORK5CYII=", "base64");

test("Scandinavian barcode terms reveal cheese source uncertainty instead of no flags", async ({page}) => {
  await page.route("**/api/product?*", async route => route.fulfill({
    status: 200, contentType: "application/json",
    body: JSON.stringify({ok:true,found:true,name:"Caesar Dressing",brand:"Cardinis",
      ingredients:"Rapsolie (62%), vann, egg, Parmigiano Reggiano-ost (mælk) (1%), ansjospaste, salt",
      sourceUrl:"https://world.openfoodfacts.org/product/3017620422003"})
  }));
  await page.goto("http://127.0.0.1:3000/");
  await page.locator(".langs button[data-lang='ar']").click();
  await page.locator("#barcodeInput").fill("3017620422003");
  await page.locator("#btnLookup").click();
  await expect(page.locator("#result .verdict h2")).toContainText("المصدر يحتاج إلى تحقق");
  await expect(page.locator("#result")).toContainText("المكونات المسترجعة من Open Food Facts");
  await expect(page.locator(".source-text").last()).toHaveAttribute("dir","auto");
});
test("photo Gemini model 404 shows targeted failure and clears previous barcode result", async ({page}) => {
  await page.route("**/api/product?*", async route => route.fulfill({
    status:200,contentType:"application/json",
    body:JSON.stringify({ok:true,found:true,name:"Old product",ingredients:"gelatin"})
  }));
  await page.route("**/api/read-label", async route => route.fulfill({
    status:502,contentType:"application/json",
    body:JSON.stringify({ok:false,code:"model_unavailable"})
  }));
  await page.goto("http://127.0.0.1:3000/");
  await page.locator(".langs button[data-lang='en']").click();
  await page.locator("#barcodeInput").fill("3017620422003");
  await page.locator("#btnLookup").click();
  await expect(page.locator("#result")).toContainText("Old product");
  await page.locator("#tab-photo").click();
  await page.locator("#photoInput").setInputFiles({name:"label.png",mimeType:"image/png",buffer:png});
  await page.locator("#btnPhoto").click();
  await expect(page.locator("#photoStatus")).toContainText("unavailable Gemini model");
  await expect(page.locator("#result")).toBeHidden();
});
test("German supplement OCR result flags fatty-acid salts without invented verdict", async ({page}) => {
  await page.route("**/api/read-label", async route => route.fulfill({
    status:200,contentType:"application/json",
    body:JSON.stringify({ok:true,product:"Magnesium B1 B6 B12 Folsäure",
      ingredients:"Zutaten: Magnesiumoxide, mikrokristalline Cellulose, Trennmittel Magnesiumsalze der Speisefettsäuren, Folsäure, Vitamin B12",
      extra:[],halalMark:false})
  }));
  await page.goto("http://127.0.0.1:3000/");
  await page.locator(".langs button[data-lang='ar']").click();
  await page.locator("#tab-photo").click();
  await page.locator("#photoInput").setInputFiles({name:"label.png",mimeType:"image/png",buffer:png});
  await page.locator("#btnPhoto").click();
  await expect(page.locator("#result .verdict h2")).toContainText("المصدر يحتاج إلى تحقق");
  await expect(page.locator("#result")).toContainText("أملاح الأحماض الدهنية");
  await expect(page.locator("#result")).toContainText("المكونات المستخرجة من الصورة");
  await expect(page.locator("#result")).not.toContainText("مكوّن حرام");
});

test("photo processing deduplicates magnesium salt explanations and caches the same selected photo", async ({page}) => {
  let calls=0;
  await page.route("**/api/read-label", async route => {
    calls++;
    await route.fulfill({status:200,contentType:"application/json",
      body:JSON.stringify({ok:true,product:"Magnesium supplement",
        ingredients:"Trennmittel Magnesiumsalze der Speisefettsäuren, Magnesiumoxid, Vitamin B12",
        extra:[
          {term:"Speisefettsäuren",reason:"Source?"},
          {term:"Magnesiumsalze der Speisefettsäuren",reason:"Source?"},
          {term:"Magnesiumsalze",reason:"Source?"}
        ],halalMark:false})
    });
  });
  await page.goto("http://127.0.0.1:3000/");
  await page.locator(".langs button[data-lang='ar']").click();
  await page.locator("#tab-photo").click();
  await page.locator("#photoInput").setInputFiles({name:"ingredients.png",mimeType:"image/png",buffer:png});
  await page.locator("#btnPhoto").click();
  await expect(page.locator("#panel-photo #result .ledger li")).toHaveCount(1);
  await expect(page.locator("#panel-photo #result")).toContainText("أملاح الأحماض الدهنية");
  await expect(page.locator("#photoStatus")).toContainText("اكتملت قراءة الصورة");
  await page.locator("#btnPhoto").click();
  await expect(page.locator("#photoStatus")).toContainText("دون إرسال طلب جديد");
  expect(calls).toBe(1);
});
test("results are shown in the active scanner instead of beneath unrelated tabs", async ({page}) => {
  await page.route("**/api/product?*", route=>route.fulfill({status:200,contentType:"application/json",
    body:JSON.stringify({ok:true,found:true,ingredients:"gelatin",name:"Snack"})}));
  await page.goto("http://127.0.0.1:3000/");
  await page.locator("#barcodeInput").fill("3017620422003");
  await page.locator("#btnLookup").click();
  await expect(page.locator("#panel-barcode #result")).toContainText("Snack");
  await page.locator("#tab-photo").click();
  await expect(page.locator("#result")).toBeHidden();
  expect(await page.locator("#result").evaluate(el=>el.parentElement.id)).toBe("panel-photo");
  await expect(page.locator("#panel-photo")).toBeVisible();
});
test("photo button has a visible processing phase and prevents duplicate requests", async ({page}) => {
  let called=0;
  await page.route("**/api/read-label",async route=>{
    called++;
    await new Promise(resolve=>setTimeout(resolve,250));
    if(!route.request().isNavigationRequest()) await route.fulfill({status:200,contentType:"application/json",
      body:JSON.stringify({ok:true,product:"Sample",ingredients:"gelatin",extra:[],halalMark:false})}).catch(()=>{});
  });
  await page.goto("http://127.0.0.1:3000/");
  await page.locator("#tab-photo").click();
  await page.locator("#photoInput").setInputFiles({name:"ingredients.png",mimeType:"image/png",buffer:png});
  await page.locator("#btnPhoto").click();
  await expect(page.locator("#btnPhoto")).toBeDisabled();
  await expect(page.locator("#photoStatus")).toHaveClass(/pending/);
  await expect(page.locator("#panel-photo #result")).toBeVisible();
  expect(called).toBe(1);
});

test("Arabic scanner language carries into the evidence encyclopedia", async ({page}) => {
  await page.goto("http://127.0.0.1:3000/");
  await page.locator(".langs button[data-lang='ar']").click();
  await page.locator("#evidenceNav").click();
  await expect(page.locator("html")).toHaveAttribute("lang","ar");
  await expect(page.locator("html")).toHaveAttribute("dir","rtl");
  await page.locator("#language").selectOption("nl");
  await page.goto("http://127.0.0.1:3000/");
  await expect(page.locator(".langs button[data-lang='nl']")).toHaveAttribute("aria-pressed","true");
});


test("photo results show two priorities and hide the rest until requested", async ({page}) => {
  await page.route("**/api/read-label",route => route.fulfill({
    status:200,contentType:"application/json",
    body:JSON.stringify({ok:true,product:"Supplement sample",
      ingredients:"Zutaten: Gelatine, Molkenpulver, E471, Vitamin D3, Wasser",
      halalMark:false,extra:[]})
  }));
  await page.goto("http://127.0.0.1:3000/");
  await page.locator("#tab-photo").click();
  await page.locator("#photoInput").setInputFiles({name:"label.png",mimeType:"image/png",buffer:png});
  await page.locator("#btnPhoto").click();
  await expect(page.locator("#panel-photo #result .ledger").first().locator("li")).toHaveCount(2);
  await expect(page.locator(".more-findings")).toBeVisible();
  await expect(page.locator(".more-findings")).not.toHaveAttribute("open");
  await page.locator(".more-findings summary").click();
  await expect(page.locator(".more-findings .ledger li").first()).toBeVisible();
  await expect(page.locator(".raw-ingredients")).not.toHaveAttribute("open");
  await expect(page.locator(".raw-ingredients summary")).toContainText("Ingredients transcribed");
  await page.locator(".raw-ingredients summary").click();
  await expect(page.locator(".raw-ingredients .source-text")).toContainText("Zutaten:");
});


test("temporary Gemini 503 is shown in Arabic without a false halal finding", async ({page}) => {
  await page.route("**/api/read-label", route => route.fulfill({
    status:503, contentType:"application/json",
    body:JSON.stringify({ok:false,code:"upstream_busy"})
  }));
  await page.goto("http://127.0.0.1:3000/");
  await page.locator(".langs button[data-lang='ar']").click();
  await page.locator("#tab-photo").click();
  await page.locator("#photoInput").setInputFiles({name:"label.png",mimeType:"image/png",buffer:png});
  await page.locator("#btnPhoto").click();
  await expect(page.locator("#photoStatus")).toContainText("خدمة Gemini غير متاحة مؤقتًا");
  await expect(page.locator("#result")).toBeHidden();
});


test("Flash stays selected and Argon is unavailable until operator opt-in", async ({page}) => {
  await page.goto("http://127.0.0.1:3000/");
  await page.locator("#tab-photo").click();
  await expect(page.locator("#photoModel")).toHaveValue("gemini-3.8-flash");
  await expect(page.locator('#photoModel option[value="gemini-4-argon"]')).toBeDisabled();
  await expect(page.locator("#photoModelHint")).toContainText("disabled");
});

test("Enabled Argon is explicitly passed to the photo API and not reused from Flash cache", async ({page}) => {
  let used=[];
  await page.route("**/api/photo-options", route => route.fulfill({
    status:200,contentType:"application/json",
    body:JSON.stringify({ok:true,defaultModel:"gemini-3.8-flash",argonEnabled:true,
      models:[{id:"gemini-3.8-flash",enabled:true},{id:"gemini-4-argon",enabled:true}]})
  }));
  await page.route("**/api/read-label", async route => {
    const req=route.request().postDataJSON();
    used.push(req.model);
    await route.fulfill({status:200,contentType:"application/json",
      body:JSON.stringify({ok:true,product:"Magnesium",ingredients:"Magnesiumsalze der Speisefettsäuren",
        model:req.model,halalMark:false,extra:[]})});
  });
  await page.goto("http://127.0.0.1:3000/");
  await page.locator("#tab-photo").click();
  const picker=page.locator("#photoModel");
  await expect(picker.locator('option[value="gemini-4-argon"]')).toBeEnabled();
  await page.locator("#photoInput").setInputFiles({name:"label.png",mimeType:"image/png",buffer:png});
  await page.locator("#btnPhoto").click();
  await expect(page.locator("#photoStatus")).toContainText("Image processed");
  await picker.selectOption("gemini-4-argon");
  await page.locator("#btnPhoto").click();
  await expect(page.locator("#photoStatus")).toContainText("Image processed");
  expect(used).toEqual(["gemini-3.8-flash","gemini-4-argon"]);
  await page.locator("#btnPhoto").click();
  expect(used).toHaveLength(2);
});


test("Argon opt-in without shared counter stays disabled with clear message", async ({page}) => {
  await page.route("**/api/photo-options",route=>route.fulfill({
    status:200,contentType:"application/json",
    body:JSON.stringify({ok:true,defaultModel:"gemini-3.8-flash",
      argonEnabled:false,argonPrerequisite:"shared_counter_required",
      models:[{id:"gemini-3.8-flash",enabled:true},{id:"gemini-4-argon",enabled:false}]})
  }));
  await page.goto("http://127.0.0.1:3000/");
  await page.locator("#tab-photo").click();
  await expect(page.locator('#photoModel option[value="gemini-4-argon"]')).toBeDisabled();
  await expect(page.locator("#photoModelHint")).toContainText("shared rate-limit");
  await page.locator(".langs button[data-lang='ar']").click();
  await expect(page.locator("#photoModelHint")).toContainText("عدّاد استخدام مشترك");
});

test("unavailable premium budget returns clear Arabic guidance without a verdict", async ({page}) => {
  await page.route("**/api/photo-options",route=>route.fulfill({
    status:200,contentType:"application/json",
    body:JSON.stringify({ok:true,defaultModel:"gemini-3.8-flash",
      argonEnabled:true,models:[{id:"gemini-3.8-flash",enabled:true},{id:"gemini-4-argon",enabled:true}]})
  }));
  await page.route("**/api/read-label",route=>route.fulfill({
    status:503,contentType:"application/json",
    body:JSON.stringify({ok:false,code:"premium_limits_unavailable"})
  }));
  await page.goto("http://127.0.0.1:3000/");
  await page.locator(".langs button[data-lang='ar']").click();
  await page.locator("#tab-photo").click();
  await page.locator("#photoModel").selectOption("gemini-4-argon");
  await page.locator("#photoInput").setInputFiles({name:"label.png",mimeType:"image/png",buffer:png});
  await page.locator("#btnPhoto").click();
  await expect(page.locator("#photoStatus")).toContainText("توقفت القراءة المتقدمة مؤقتًا");
  await expect(page.locator("#result")).toBeHidden();
});
