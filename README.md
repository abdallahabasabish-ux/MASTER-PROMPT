# الدكتور في العلوم - Dr. Science

منصة تعليمية متكاملة لمادة العلوم، بإشراف الأستاذ وحيد حامد.

## 🚀 عن المنصة

منصة تعليمية تقدم دروساً منظمة، فيديوهات تعليمية، ملفات مراجعة واختبارات تفاعلية لطلاب المراحل الابتدائية والإعدادية والثانوية.

### المميزات الرئيسية

- 🎥 فيديوهات تعليمية منظمة
- 📄 ملفات مراجعة PDF
- 📝 اختبارات تفاعلية (اختيار من متعدد، صح/خطأ، مقالي)
- 📊 تتبع التقدم والأداء
- 👨‍🏫 إشراف مباشر من الأستاذ وحيد حامد
- 📱 تصميم متجاوب مع جميع الأجهزة

## 🛠 التقنيات المستخدمة

- **Frontend**: HTML5, CSS3, JavaScript (ES Modules)
- **Build Tool**: Vite
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Hosting**: GitHub Pages
- **CI/CD**: GitHub Actions

## 📁 هيكل المشروع
dr-science/
├── src/
│ ├── assets/ # Styles, images, fonts
│ ├── components/ # Reusable UI components
│ ├── core/ # Router, store, events
│ ├── firebase/ # Firebase configuration
│ ├── pages/ # Page components
│ ├── services/ # Business logic
│ └── utils/ # Helpers, validators
├── firebase/
│ ├── firestore.rules
│ ├── storage.rules
│ └── functions/
├── public/
├── .env.example
├── package.json
├── vite.config.js
└── README.md

text

## 🚦 الإعداد والتشغيل

### المتطلبات الأساسية

- Node.js (v18+)
- npm (v9+)
- حساب Firebase

### خطوات التثبيت

1. **نسخ المشروع**
```bash
git clone https://github.com/your-username/dr-science.git
cd dr-science
