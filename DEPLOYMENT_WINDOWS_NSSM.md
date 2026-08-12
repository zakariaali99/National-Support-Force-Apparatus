# 🖥️ دليل التثبيت والتشغيل المحلي على بيئة ويندوز (Windows NSSM Deployment Guide)

يقدم هذا الدليل خطوة بخطوة كيفية تجهيز وتثبيت **منظومة الجهاز الوطني للقوى المساندة** كخدمة تعمل في الخلفية على نظام ويندوز (Windows Service) باستخدام أداة **NSSM** (Non-Sucking Service Manager) وخادم **Waitress** عالي الأداء.

---

## 📌 المتطلبات الأساسية للنظام (Prerequisites)

قبل البدء، يجب التأكد من تثبيت البرامج التالية على جهاز الويندوز:

1. **Python (الإصدار 3.11 أو أحدث)**:
   - قم بتنزيله من [python.org](https://www.python.org/downloads/).
   - ⚠️ **هام جداً**: تأكد من تفعيل خيار **"Add Python to PATH"** عند التثبيت.

2. **Node.js**:
   - ⚡ **غير مطلوب على جهاز الويندوز**: واجهة المستعرض React SPA مضمنة ومبنية مسبقاً داخل المشروع (`frontend/dist`). يتم التشغيل بالكامل عبر خادم Python فقط.

3. **أداة NSSM (Non-Sucking Service Manager)**:
   - قم بتنزيل الأداة من [nssm.cc/download](https://nssm.cc/download).
   - استخرج ملف `nssm.exe` (إصدار 64-bit) وحطه في مجلد المشروع الرئيسي (بجانب ملف `nssm_install_services.bat`).

4. **المكتبات المساندة للطباعة PDF (WeasyPrint GTK for Windows)**:
   - لطباعة المستندات وملفات الأفراد بتقنية PDF، يوصى بتثبيت [GTK3 for Windows](https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases).

---

## 🚀 خطوات التثبيت والتشغيل الآلي (One-Click Setup)

### الخطوة 1: تجهيز وبناء النظام (Deploy Build)
1. افتح مجلد المشروع.
2. اضغط مرتين على ملف **`deploy_windows.bat`**.
3. سيقوم السكريبت تلقائياً بـ:
   - إنشاء البيئة الافتراضية لـ Python (`backend/venv`).
   - تثبيت كافة الحزم والمكتبات المطلوبة وخادم Waitress.
   - بناء تطبيق الواجهة الأمامية React SPA (`frontend/dist`).
   - إنشاء قاعدة البيانات وجداول النظام وتغذيتها بالبيانات الأساسية.

---

### الخطوة 2: تثبيت الخدمة للعمل التلقائي (NSSM Service Installation)
1. اضغط بـ **زر الماوس الأيمن** على ملف **`nssm_install_services.bat`**.
2. اختر **"Run as administrator" (تشغيل كمسؤول)**.
3. سيقوم السكريبت بتسجيل الخدمة باسم **`NSFA-Apparatus`** وتفعيل تشغيلها التلقائي مع إقلاع نظام ويندوز.

---

## 🌐 الوصول إلى المنظومة

بعد اكتمال التثبيت، تعمل المنظومة مباشرة على منفذ **`8000`**:

- **من الجهاز المحلي**:  
  `http://localhost:8000`  
  أو  
  `http://127.0.0.1:8000`

- **من أجهزة الشبكة المحلية (Intranet)**:  
  `http://[IP-Address-Of-Server]:8000`  
  *(مثال: `http://192.168.1.100:8000`)*

---

## ⚙️ إدارات الخدمة والسجلات (Management & Logs)

### التحكم بالخدمة من سطر الأوامر (CMD as Admin):
```cmd
:: تشغيل الخدمة
net start NSFA-Apparatus

:: إيقاف الخدمة
net stop NSFA-Apparatus

:: الاستعلام عن حالة الخدمة
nssm status NSFA-Apparatus
```

### سجلات الأخطاء والتشغيل (Logs):
تتم كتابة سجلات النظام تلقائياً داخل المجلد:
`logs\nssm_stdout.log`  
`logs\nssm_stderr.log`

---

## 🗑️ إزالة الخدمة (Uninstall Service)

إذا رغبت في إيقاف وإزالة الخدمة من نظام ويندوز:
1. اضغط بـ **زر الماوس الأيمن** على ملف **`nssm_uninstall_services.bat`**.
2. اختر **"Run as administrator"**.

---

## 🔒 بيانات الدخول الافتراضية
- **اسم المستخدم**: `admin`
- **كلمة المرور**: `admin123`
