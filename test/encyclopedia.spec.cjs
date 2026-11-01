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
