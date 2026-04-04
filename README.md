# 🧬 خريطة المنهج الطبي التفاعلية — سيمستر 3

<div align="center">

<br/>

[![Download ZIP](https://img.shields.io/badge/⬇️_تحميل_مضغوط-.zip-00c853?style=for-the-badge&logo=github)](https://github.com/MUE24Med/s3/archive/refs/heads/main.zip)
[![Download RAW](https://img.shields.io/badge/⬇️_تحميل_الملف_كامل-README.md-e67e22?style=for-the-badge&logo=markdown)](https://raw.githubusercontent.com/MUE24Med/s3/main/README.md)
[![Live Demo](https://img.shields.io/badge/🌐_النسخة_المباشرة-mue24med.github.io-3498db?style=for-the-badge)](https://mue24med.github.io/s3)
[![Version](https://img.shields.io/badge/الإصدار-2.0.0-ffcc00?style=for-the-badge)]()
[![License](https://img.shields.io/badge/الترخيص-MIT-9b59b6?style=for-the-badge)](LICENSE)

<br/>

</div>

---

## 🌟 نظرة عامة

خريطة منهج تفاعلية للفرقة الثانية — الفصل الدراسي الثالث. تدعم **4 مجموعات دراسية (A, B, C, D)** وتوفر وصولاً سريعاً للمحاضرات، السكاشن، الأسئلة، والإجابات عبر خريطة SVG تفاعلية.

---

## ⚡ التحميل والتشغيل

### 📥 الطريقة الأسرع — تحميل مباشر

```
https://github.com/MUE24Med/s3/archive/refs/heads/main.zip
```

> اضغط الرابط → فك الضغط → افتح `index.html` في المتصفح ✅

### 🛠️ عبر Git

```bash
git clone https://github.com/MUE24Med/s3.git
cd s3
```

### 🚀 تشغيل مع سيرفر محلي (اختياري)

```bash
npx serve .
# أو
npx live-server
```

---

## ✨ المميزات

| الميزة | التفاصيل |
|--------|----------|
| 🎮 لعبة تفاعلية | أثناء التحميل مع قائمة متصدرين عالمية |
| 📡 Service Worker | يعمل بدون إنترنت بعد أول تحميل |
| 🔎 بحث ذكي | عربي + إنجليزي مع ترجمة تلقائية لأسماء الملفات |
| 📄 معاينة PDF | مدمجة مع خيارات فتح متعددة (Mozilla / Drive / Browser) |
| 🆔 بصمة فريدة | توليد تلقائي لكل جهاز |
| 🔄 تحديث ذكي | يحدث الملفات المعدلة فقط من GitHub |
| 📱 متجاوب | يعمل على موبايل، تابلت، وسطح المكتب |

---

## 🎨 نظام الألوان

```
🔴 أحمر    → أسئلة (Q)
🔵 أزرق    → فيديو شرح (V)
⚪ أبيض    → مواد أخرى (I)
🟣 بنفسجي  → إجابات (A)
🟢 أخضر   → سكاشن (S)
🟡 أصفر   → محاضرات (L)
🟡🟢 ليموني → خاص (IS)
```

---

## 📁 هيكل الملفات

```
semester-3/
├── index.html                         # الصفحة الرئيسية
├── style.css                          # كل الأنماط
├── script.js                          # نقطة الدخول الرئيسية
├── tracker.js                         # نظام التتبع والبصمة
├── sw.js                              # Service Worker
├── javascript/
│   ├── core/
│   │   ├── config.js                  # الإعدادات العامة
│   │   ├── utils.js                   # دوال مساعدة
│   │   ├── navigation.js              # نظام التنقل
│   │   ├── group-loader.js            # تحميل المجموعات
│   │   └── state.js                   # إدارة الحالة
│   ├── features/
│   │   ├── svg-processor.js           # معالجة مستطيلات SVG
│   │   ├── preload.js                 # منطق التحميل المسبق
│   │   ├── preload-game.js            # اللعبة التفاعلية
│   │   ├── mini-game.js               # محرك اللعبة
│   │   ├── leaderboard-core.js        # منطق قائمة المتصدرين
│   │   └── leaderboard-ui.js          # واجهة قائمة المتصدرين
│   └── ui/
│       ├── wood-interface.js          # واجهة المستخدم الرئيسية
│       ├── pdf-viewer.js              # عارض PDF
│       ├── search-and-eye.js          # البحث وزر العين
│       ├── ui-controls.js             # أزرار التحكم
│       └── scroll-system.js           # نظام التمرير
├── groups/
│   ├── group-A.svg
│   ├── group-B.svg
│   ├── group-C.svg
│   └── group-D.svg
└── image/
    ├── 0.webp                         # الصورة الرئيسية
    ├── 0.png                          # نسخة PNG
    ├── wood.webp                      # خلفية الخشب
    ├── Upper_wood.webp                # الخشب العلوي
    ├── logo-A.webp … logo-D.webp      # شعارات المجموعات
    └── A/ B/ C/ D/                    # صور الجداول الأسبوعية
```

---

## 🔧 تفاصيل تقنية

### نظام التحديثات

```javascript
// فحص تحديثات GitHub كل 5 دقائق
setInterval(checkForUpdates, 300000);

// الملفات المحمية من التحديث
const PROTECTED_FILES = [
    'image/0.webp',
    'image/wood.webp',
    'image/Upper_wood.webp',
    'image/logo-A.webp',
    'image/logo-B.webp',
    'image/logo-C.webp',
    'image/logo-D.webp',
];
```

### نظام التتبع

```javascript
const analytics = {
    deviceFingerprint: "unique-hash",
    visitorID: "ID-1234",
    group: "A",
    browser: "Chrome",
    os: "Android",
    screenSize: "1920x1080",
    connection: "4g",
    activities: []
};
```

---

## 🎮 اللعبة التفاعلية

| العنصر | التأثير |
|--------|---------|
| 🦠 جرثومة | تفقد قلباً ❤️ |
| 💊 علاج | تكسب قلباً ❤️ |
| 👾 فيروس | تفقد قلباً ❤️ |

كل عنصر تتفاداه = **10 نقاط** | النتائج تُحفظ في قائمة متصدرين عالمية 🏆

---

## 📱 الأجهزة والمتصفحات المدعومة

**الأجهزة:** سطح المكتب · هواتف Android & iOS · أجهزة لوحية

**المتصفحات:** Chrome 80+ · Firefox 75+ · Safari 13+ · Edge 80+ · Samsung Internet 13+

---

## 🐛 حل المشاكل الشائعة

| المشكلة | الحل |
|---------|------|
| لا تظهر الصور | اضغط زر 🔄 Reset |
| لا تفتح الملفات | تحقق من اتصال الإنترنت |
| البحث لا يعمل | اكتب بالعربية أو الإنجليزية |

---

## 🤝 المساهمة

```bash
# 1. Fork ثم Clone
git clone https://github.com/your-username/s3.git

# 2. أنشئ فرعاً جديداً
git checkout -b feature/new-feature

# 3. Commit وPush
git commit -m "Add new feature"
git push origin feature/new-feature

# 4. افتح Pull Request
```

---

## 🔒 الخصوصية

**نجمع:** بصمة الجهاز (مشفرة) · أنشطة التصفح داخل الموقع · نتائج اللعبة

**لا نجمع:** بيانات شخصية · معلومات دفع · مواقع جغرافية · جهات اتصال

---

## 📜 الترخيص

```
MIT License — Copyright (c) 2026 George Reda
يسمح بإعادة الاستخدام، التعديل، والتوزيع بشرط الإشارة إلى المصدر.
```

---

## 👤 التواصل

**المطور:** جورج رضا
🔗 [linktr.ee/George_Reda](https://linktr.ee/George_Reda)
📞 01556081322

---

<div align="center">

مصنوع بـ ❤️ لطلاب الطب في كل مكان

**آخر تحديث:** فبراير 2026 · **الإصدار:** 2.0.0 · **الحالة:** 📈 نشط

</div>
