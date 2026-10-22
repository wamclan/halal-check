# Halal Check

موقع للجوال بثلاث لغات (English / Nederlands / العربية) يفحص مكونات المنتجات الغذائية:
**مسح باركود** (Open Food Facts) + **تصوير قائمة المكونات** + **لصق النص** + **بحث برقم E**.
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
  read-label.js         يستقبل الصورة ويقرؤها 
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

