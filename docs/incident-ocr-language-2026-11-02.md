# OCR & ingredient-language incident — 2026-11-02

## Confirmed observations
A mobile user photographed a German-language magnesium/vitamin supplement ingredients panel. The photo tab returned a generic error while a previous barcode message was still visible. A previous Norwegian Caesar dressing label (vann, eggeplomme, Parmigiano Reggiano-ost) was displayed as nothing flagged.

Vercel production runtime error aggregation reported 3 occurrences of **gemini status 404** on **/api/read-label** between 2026-11-02 00:18:29 UTC and 00:30:40 UTC.

The backend previously selected **gemini-2.5-flash** by default. Google limits access to 2.5 models for newer API projects, so a model-access restriction is a plausible explanation, but the exact upstream response body was not logged. The 404 is confirmed; its precise Google-side cause is not.
- https://ai.google.dev/gemini-api/docs/deprecations
- https://ai.google.dev/gemini-api/docs/models
- https://ai.google.dev/api/models

## Implemented in this branch
- Default model: **gemini-3.8-flash**, configurable using GEMINI_MODEL. Distinct error codes for unavailable model (404), invalid credentials, upstream request errors and unreadable ingredients.
- OCR requests original-language Zutaten/Ingredients/Ingredienser ingredient text, not nutrition claims, warnings or translated guesses, and reports original language and whether the section is fully legible.
- Photos retain more detail before JPEG compression (up to 2560px), with manual text entry if OCR fails.
- Norwegian and Danish cheese expressions and German source-dependent fatty acid salt ingredients trigger source-check warnings, without claiming haram status.
- Detection of label language is separate from the chosen UI language and is marked heuristic. Zero alerts never means fully verified halal.
- Clears stale results between scans; distinguishes Open Food Facts text from actual photo transcriptions.
- Bumps offline app cache to include updated scripts.

## Release gate
Unit tests cover Gemini model 404, missing ingredients, Norwegian Caesar dressing and German magnesium supplement; Chromium tests cover upload errors, manual fallback, original-language output, inconclusive classification and clearing previous results. These tests use synthetic service responses.

**Not yet proven:** real Gemini calls under the Vercel API key, photo reading on actual iOS/Android devices, full supplier origin or certification validation, and the legal status of every individual ingredient. This is a research screening aid, not a product halal certificate or fatwa.
