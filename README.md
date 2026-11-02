# Halal Check

موقع للجوال بثلاث لغات (English / Nederlands / العربية) يفحص مكونات المنتجات الغذائية:
**مسح باركود** (Open Food Facts) + **تصوير قائمة المكونات** (Gemini) + **لصق النص** + **بحث برقم E**.
النتيجة: «لا شيء مُعلَّم» أو «مشبوه (mushbooh)» أو «يحتوي على مكوّن حرام»، وتحتها دائماً أنها ليست شهادة حلال.

## ما الذي يحتويه المشروع

```
public/                 الموقع (ملفات ثابتة)
  index.html, legal.html
  js/engine.js          محرك الفحص (يعمل في المتصفح وفي الاختبارات)
  data/rules.json       قواعد المكونات وأرقام E (غيّرها دون لمس الكود)
  site-config.json      اسمك وبريدك للصفحة القانونية (املأه قبل النشر)
  vendor/, fonts/       ZXing والخطوط، مستضافة محلياً (لا طلبات إلى Google أو CDN)
api/
  read-label.js         يستقبل الصورة ويقرؤها عبر Gemini
  product.js            يبحث عن الباركود في Open Food Facts
test/                   اختبارات (npm test)
vercel.json             إعدادات النشر ورؤوس الأمان
```

## التشغيل محلياً

```bash
export GEMINI_API_KEY=...        # من Google AI Studio
npm run dev                      # http://localhost:3000
npm test
```

الكاميرا تعمل على `localhost` وعلى HTTPS فقط. Vercel يوفّر HTTPS تلقائياً.

## مفتاح Gemini

1. أنشئ مفتاحاً من https://aistudio.google.com/apikey
2. **اشتراك Gemini Pro (Google AI Pro) لا يعطي رصيداً لواجهة API.** الواجهة لها حصة مجانية وفوترة منفصلة.
3. قبل أن يرفع الناس صوراً، فعّل الفوترة على مشروع المفتاح وضع تنبيه ميزانية. حسب الشروط الحالية، قد تستخدم Google مدخلات الحصة المجانية لتحسين منتجاتها، أما الحصة المدفوعة فلا. راجع شروط Gemini API بنفسك لأن بيانات المستخدمين (الصور) مسؤوليتك بموجب قانون الخصوصية الأوروبي.
4. اسم النموذج الافتراضي `gemini-2.5-flash`. إذا غيّرته Google أو أوقفته، ضع اسم نموذج آخر في `GEMINI_MODEL`.

## النشر على Vercel

1. ارفع المجلد إلى GitHub، ثم في Vercel: **Add New > Project** واختر المستودع. الإعدادات جاهزة في `vercel.json` (لا يوجد build).
2. في **Settings > Environment Variables** أضف المتغيرات المذكورة في `.env.example`. المطلوب فقط `GEMINI_API_KEY`.
3. يُنصح بإضافة **Upstash Redis** من Vercel Marketplace. بدونه تُحسب حدود الاستخدام داخل كل نسخة من الدالة على حدة، فتبطئ الإساءة ولا تمنعها.
4. املأ `public/site-config.json` (الاسم والبريد). إلى أن تملأه تعرض صفحة الشروط تحذيراً ظاهراً.
5. اربط نطاقك.

خطة **Hobby** في Vercel للاستخدام الشخصي غير التجاري فقط. للاستخدام التجاري تحتاج Pro.

## ما اختُبر وما لم يُختبر

اختُبر:
- 11 اختباراً لمحرك الفحص (إنجليزي وهولندي وعربي، أرقام E، رقم التحقق في الباركود).
- 7 اختبارات للدوال الخادمية مع خوادم Gemini وOpen Food Facts وهمية (قراءة الصورة، تنقية الناتج، حدود الاستخدام، أخطاء Google).
- متصفح Chromium على شاشة 390px: مسح باركود EAN-13 حقيقي من بث كاميرا وهمي ومن صورة، تبويب الصورة، القوائم، أرقام E، العربية RTL، الوضع الداكن، وعدم وجود أخطاء في الـ console مع سياسة الأمان نفسها.

لم يُختبر (يلزمك تجربتها بعد النشر):
- استدعاء Gemini الحقيقي. لم يتوفر مفتاح، فالتجربة كانت على خادم وهمي بنفس شكل الاستجابة.
- Open Food Facts الحقيقي. لم يكن للبيئة وصول إلى الإنترنت.
- الجوال الفعلي، خصوصاً Safari على iPhone وكاميرا Android وإضاءة العبوات الحقيقية.

## ما يزال ناقصاً قبل الاعتماد عليه

- **القواعد مسودة ولم يراجعها عالم شرعي.** تُعرض في كل نتيجة باسم «مسودة». بعد المراجعة عدّل `meta.reviewedBy` و`meta.reviewStatus` في `rules.json` وستظهر العبارة الجديدة تلقائياً.
- نحو 20 مادة و30 رقم E فقط. تحتاج توسيعاً واختبارها على عبوات حقيقية.
- كثرة «مشبوه» للنكهات والمستحلبات حتى يحدد المراجع مستويات.
- لغات الملصقات الأخرى (التركية والفرنسية والألمانية والبولندية) غير مدعومة في الفحص.
- بيانات Open Food Facts يحررها متطوعون وقد تكون ناقصة أو قديمة. ترخيصها ODbL ويشترط ذكر المصدر (مذكور في النتيجة).
- الترجمة الهولندية يراجعها متحدث أصلي.
- لا يوجد زر «أبلغ عن خطأ»، ولا PWA، ولا Turnstile ضد الإساءة.

## تحديث الموسوعة المبنية على الأدلة — فرع التجربة (نوفمبر 2026)

أضيفت صفحة **`/encyclopedia`** إلى المستودع، وتستخدم `public/data/evidence-knowledge.json` وفيها **431 سجلًا و346 تعريفًا لأرقام E و29 مصدرًا مرجعيًا**. تتيح البحث والمرشحات واللغات الثلاث، وروابط المصادر لكل سجل، وتصدير نتائج البحث CSV. رُبطت نتائج الماسح بصفحات الموسوعة، كما يُظهر الماسح الرمز غير المدقَّق بحالة «المعلومات غير كافية» بدل اعتباره حلالًا أو حرامًا.

هذا الفهرس **ليس جميع الإضافات في العالم، ولا 431 فتوى**: أغلب السجلات أسماء/أرقام للتعريف مع `unknown` أو `verify`، وليست شهادات منتج أو فحوص منشأ منفردة. التفصيل في [سجل المصادر](docs/evidence-register-2026-11.md). يجب التحقق من مصدر المادة ومنتجها وشروط استعمالها القانوني حسب الدولة قبل أي استنتاج.

الواجهة الأصلية للباركود والتصوير ما زالت متاحة على `/`. تعتمد قراءة الصور على Gemini عبر الخادم وتتطلب `GEMINI_API_KEY`؛ لم يُختبر مفتاح حقيقي، ولا كاميرا iPhone/Android فعلية، ولا شهادات الحلال للمنتجات. لا تخزن خدمة PWA الجديدة ردود API أو الصور أو النصوص التي يدخلها المستخدم؛ وتستخدم ذاكرة تخزين للملفات العامة فقط.

### الاختبارات والنشر
- `npm test`: اختبارات المحرك وواجهات API بالردود الاصطناعية وسلامة الفهرس.
- `evidence-browser.yml`: Chromium/Playwright لاختبار المظهر والبحث واللغات ومراجع E171 وE471 والربط والتخزين غير المتصل.
- إعداد Node.js مقيد بإصدار `24.x` وVercel يستضيف الملفات الثابتة بدون عملية بناء؛ تتطلب API وظائف Vercel.
- **الفرع الرئيسي غير مُعدَّل بهذه التحديثات**؛ هذا العمل معد لطلب دمج ومراجعة بشرية قبل الإنتاج.

### بوابات الاعتماد المتبقية
تدقيق أسماء وأحكام كل مادة من جهة علمية وشرعية مؤهلة، التحقق من بيانات التراخيص الحالية في الاتحاد الأوروبي بحسب فئة الغذاء، التحقق من صلاحية شهادات المنتجات، وتجارب ميدانية على أجهزة حقيقية ومع عبوات فعلية. **غياب البيانات لا يساوي الحرام أو الحلال.**

### Photo OCR troubleshooting (November 2026)
Vercel runtime showed `gemini status 404` on `POST /api/read-label` using the previous default. The application now defaults to Google's documented **`gemini-3.8-flash`** (supports image input, JSON output) and returns `model_unavailable` for an upstream 404 rather than the generic error. Model availability depends on the **particular project's Gemini API key and entitlement**; a Vercel READY build does not test image processing.

- Required secret: `GEMINI_API_KEY` in Vercel Production and Preview; **never commit a key or paste it into logs**.
- Optional exact model ID: `GEMINI_MODEL=gemini-3.8-flash`. To change the model, set a supported ID and redeploy; the app never secretly selects a more expensive model.
- `gemini-4-argon` is available but is deliberately **not** the default for routine ingredient OCR because of cost.
- Photo quality: crop to the ingredient list, keep text large in frame, ensure sufficient focus and light, and compare the transcript with the packaging.
- Return codes include `model_unavailable` (Google 404), `api_auth_error` (401/403), `upstream_invalid_request` (400), `upstream_busy` (429), `unreadable` and `upstream_timeout`. These codes never contain API credentials, photo bytes or user input.
- Quick rules now recognize selected German and Scandinavian ingredient terms, **not all words in all languages**. Unmatched text is not evidence of halal approval; no text matches now produce an **insufficient evidence** result.
- Reference: https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash

Manual release validation remains required: real Gemini OCR with a production-like key, image permissions, PWA, physical mobile cameras, and scientific/fiqh review.


### Video-based mobile OCR performance review — November 2026

An approximately **148-second iPhone screen recording** of a German magnesium supplement showed a very long loading state between sending a photo and rendering the result. Its initial output had duplicate source alerts for a single ingredient (magnesium salts of fatty acids). PR #6 already addressed deduplication, cached repeat scans and result placement.

This release further reduces unnecessary model work:
- The **Gemini 3.8 Flash** request now uses `generationConfig.thinkingConfig.thinkingLevel=low` (officially supported). This reduces reasoning effort for transcription; no precise latency improvement is promised until live measurements.
- Gemini **only transcribes** printed ingredients and product names, returning JSON without supplemental halal/source judgements. Deterministic local rules produce source questions and citations; `extra` stays an empty array for legacy clients. Missing origins remain unknown, not haram.
- Gemini 2.5 and other older model IDs do not receive incompatible `thinkingLevel` settings.
- The client displays elapsed reading time after 10 seconds, without inventing a percentage or estimated completion time. Cancel remains available.
- The result prioritizes two findings and keeps remaining findings and the full original-language transcription in expandable sections; full evidence is still accessible.
- Production performance can be diagnosed using existing duration-only Vercel `gemini vision response` logs. These do not log images or API credentials.

**Quality gate:** Compare OCR transcripts on small German/Danish labels before and after low-thinking mode, especially long ingredient lists. If reduced thinking harms accuracy, use a separate preview with a higher level or another explicitly chosen model. The test suite uses mocked Gemini responses; a live latency benchmark must be performed on a real preview by an authorized tester.

Official model guidance: https://ai.google.dev/gemini-api/docs/generate-content/thinking and https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash/
