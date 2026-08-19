import{l as e,o as t,s as n,t as r}from"./api-DVjQ8yrN.js";import{o as i}from"./dist-B0JVubfI.js";import{t as a}from"./package-D8TtYB5H.js";import{t as o}from"./printer-EjfTHSct.js";import{a as s,i as c,n as l,o as u,r as d,t as f}from"./Dialog-DH7nT5in.js";import{At as p,Ct as m,Et as h,H as g,Tt as _,at as v}from"./index-yb7dZDrl.js";import{t as y}from"./Badge-DeOai21K.js";var b=e(n(),1);function x({title:e,subtitle:t,documentNumber:n,contentHtml:r}){let i=window.open(``,`_blank`,`width=920,height=1080,menubar=no,toolbar=no,location=no,status=no`);if(!i){alert(`يرجى السماح بالنوافذ المنبثقة (Popups) لعرض وطباعة المستند في نافذة مستقلة.`);return}let a=new Date().toLocaleDateString(`ar-LY`,{year:`numeric`,month:`long`,day:`numeric`}),o=new Date().toLocaleTimeString(`ar-LY`,{hour:`2-digit`,minute:`2-digit`}),s=`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${e||`مستند رسمي - الجهاز الوطني للقوى المساندة`}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Cairo', system-ui, -apple-system, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      line-height: 1.6;
      font-size: 13px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    /* Screen Top Toolbar */
    .screen-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: #0f172a;
      color: #ffffff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .screen-toolbar .title {
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .screen-toolbar .btn-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .btn {
      font-family: inherit;
      font-size: 12.5px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-outline {
      background: rgba(255,255,255,0.1);
      color: #ffffff;
      border: 1px solid rgba(255,255,255,0.2);
    }
    .btn-outline:hover {
      background: rgba(255,255,255,0.2);
    }

    /* A4 Document Page Container */
    .document-page {
      width: 210mm;
      min-height: 297mm;
      margin: 24px auto;
      background: #ffffff;
      padding: 20mm 18mm;
      box-shadow: 0 0 20px rgba(0,0,0,0.08);
      border-radius: 4px;
      position: relative;
    }

    /* Official Government Header */
    .gov-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .gov-title-group h1 {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.3;
    }
    .gov-title-group h2 {
      font-size: 13px;
      font-weight: 700;
      color: #334155;
      margin-top: 2px;
    }
    .gov-meta {
      text-align: left;
      font-size: 11px;
      color: #475569;
      line-height: 1.5;
    }
    .gov-meta strong {
      color: #0f172a;
    }

    /* Document Title Banner */
    .doc-banner {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 16px;
      text-align: center;
      margin-bottom: 20px;
    }
    .doc-banner h3 {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
    }
    .doc-banner p {
      font-size: 11.5px;
      color: #64748b;
      margin-top: 2px;
    }

    /* Form Grid / Details Box */
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      border-right: 4px solid #2563eb;
      padding-right: 8px;
      margin-bottom: 10px;
      margin-top: 18px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 16px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
    }
    .form-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
      font-size: 12px;
    }
    .form-label {
      font-weight: 700;
      color: #475569;
      min-width: 110px;
    }
    .form-value {
      font-weight: 600;
      color: #0f172a;
      word-break: break-word;
    }

    /* Tables */
    table.gov-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
      margin-bottom: 20px;
      font-size: 11.5px;
    }
    table.gov-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      text-align: right;
    }
    table.gov-table td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      color: #334155;
      text-align: right;
    }
    table.gov-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Signatures Section */
    .signatures-block {
      margin-top: 36px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      text-align: center;
      page-break-inside: avoid;
    }
    .sig-box {
      border: 1px dashed #94a3b8;
      border-radius: 8px;
      padding: 12px 8px 30px;
      background: #fafafa;
    }
    .sig-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    .sig-sub {
      font-size: 10.5px;
      color: #64748b;
    }

    /* Print Styles */
    @media print {
      body {
        background: #ffffff;
      }
      .screen-toolbar {
        display: none !important;
      }
      .document-page {
        margin: 0;
        padding: 10mm 12mm;
        box-shadow: none;
        width: 100%;
        min-height: auto;
      }
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
    }
  </style>
</head>
<body>
  <div class="screen-toolbar">
    <div class="title">
      <span>📄</span>
      <span>${e||`معاينة الطباعة الرسمية`}</span>
    </div>
    <div class="btn-group">
      <button class="btn btn-primary" onclick="window.print()">
        <span>🖨️ طباعة المستند الآن</span>
      </button>
      <button class="btn btn-outline" onclick="window.close()">
        <span>إغلاق النافذة</span>
      </button>
    </div>
  </div>

  <div class="document-page">
    <!-- Header -->
    <div class="gov-header">
      <div class="gov-title-group">
        <h1>دولة ليبيا — الجهاز الوطني للقوى المساندة</h1>
        <h2>منظومة الشؤون الإدارية والتسليح والآليات</h2>
      </div>
      <div class="gov-meta">
        <div><strong>الرقم المرجعي:</strong> ${n||`DOC-`+Math.floor(1e5+Math.random()*9e5)}</div>
        <div><strong>تاريخ الطباعة:</strong> ${a}</div>
        <div><strong>التوقيت:</strong> ${o}</div>
      </div>
    </div>

    <!-- Title Banner -->
    <div class="doc-banner">
      <h3>${e}</h3>
      ${t?`<p>${t}</p>`:``}
    </div>

    <!-- Main Content Form Body -->
    ${r}

    <!-- Signatures Endorsement -->
    <div class="signatures-block">
      <div class="sig-box">
        <p class="sig-title">مسؤول السجل والعهدة</p>
        <p class="sig-sub">الاسم: .......................................</p>
        <p class="sig-sub" style="margin-top: 18px;">التوقيع: .................................</p>
      </div>
      <div class="sig-box">
        <p class="sig-title">الضابط المفوّض / رئيس الفرع</p>
        <p class="sig-sub">الاسم: .......................................</p>
        <p class="sig-sub" style="margin-top: 18px;">التوقيع: .................................</p>
      </div>
      <div class="sig-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 85px;">
        <p class="sig-title" style="color: #64748b;">الختم الرسمي المعتمد</p>
      </div>
    </div>
  </div>
</body>
</html>`;i.document.open(),i.document.write(s),i.document.close()}function S({item:e,history:t=[],type:n=`weapon`}){if(!e)return;let r=n===`weapon`?`بطاقة حصر وسجل تاريخ الحيازة للقطعة التسليحية: ${e.name||``}`:n===`vehicle`?`بطاقة تسجيل وسلسلة عهدة الآلية: ${e.name||``}`:`بطاقة صنف مخزني وسجل صرف العهدة: ${e.name||``}`,i=n===`weapon`?`الرقم التسلسلي: ${e.serial_number||`—`} | العيار: ${e.caliber||`—`}`:n===`vehicle`?`رقم الهيكل: ${e.vin_number||`—`} | رقم اللوحة: ${e.plate_number||`—`}`:`كود الصنف: ${e.item_code||`—`} | التصنيف: ${e.category_name||`—`}`,a=``;a=n===`weapon`?`
      <div class="section-title">أولاً: البيانات الفنية والتسليحية للقطعة</div>
      <div class="form-grid">
        <div class="form-row"><span class="form-label">اسم السلاح / العتاد:</span><span class="form-value">${e.name||`—`}</span></div>
        <div class="form-row"><span class="form-label">التصنيف التسليحي:</span><span class="form-value">${e.category_name||`—`}</span></div>
        <div class="form-row"><span class="form-label">الرقم التسلسلي المنقوش:</span><span class="form-value font-mono">${e.serial_number||`—`}</span></div>
        <div class="form-row"><span class="form-label">العيار الباليستي:</span><span class="form-value">${e.caliber||`—`}</span></div>
        <div class="form-row"><span class="form-label">الموديل / بلد الصنع:</span><span class="form-value">${e.model_name||`—`}</span></div>
        <div class="form-row"><span class="form-label">الحالة الفنية للقطعة:</span><span class="form-value">${e.status_display||e.status||`صالح للخدمة`}</span></div>
        <div class="form-row"><span class="form-label">الكمية الإجمالية:</span><span class="form-value">${e.total_quantity||1}</span></div>
        <div class="form-row"><span class="form-label">المتوفر في الخزينة:</span><span class="form-value">${e.available_quantity??1}</span></div>
        <div class="form-row" style="grid-column: span 2;"><span class="form-label">موقع الحفظ والملاحظات:</span><span class="form-value">${e.notes||`مسجل بخزينة الأسلحة الرئيسية`}</span></div>
      </div>
    `:n===`vehicle`?`
      <div class="section-title">أولاً: البيانات الفنية والمواصفات الرسمية للمركبة</div>
      <div class="form-grid">
        <div class="form-row"><span class="form-label">اسم وطراز المركبة:</span><span class="form-value">${e.name||`—`}</span></div>
        <div class="form-row"><span class="form-label">نوع المركبة:</span><span class="form-value">${e.vehicle_type_display||e.vehicle_type||`—`}</span></div>
        <div class="form-row"><span class="form-label">رقم الهيكل (VIN):</span><span class="form-value font-mono">${e.vin_number||`—`}</span></div>
        <div class="form-row"><span class="form-label">رقم اللوحة المعدنية:</span><span class="form-value">${e.plate_number||`—`}</span></div>
        <div class="form-row"><span class="form-label">سنة الصنع والموديل:</span><span class="form-value">${e.model_year||`—`}</span></div>
        <div class="form-row"><span class="form-label">اللون:</span><span class="form-value">${e.color||`—`}</span></div>
        <div class="form-row"><span class="form-label">نوع التبعية:</span><span class="form-value">${e.affiliation_type===`external`?`جهة خارجية (${e.external_unit_name||`—`})`:`وحدة داخلية (${e.faction_name||`—`})`}</span></div>
        <div class="form-row"><span class="form-label">حالة التشغيل:</span><span class="form-value">${e.status_display||e.status||`جاهزة للعمليات`}</span></div>
        <div class="form-row"><span class="form-label">السائق المسند إليه:</span><span class="form-value">${e.driver_name?`${e.driver_name} (${e.driver_force_number||``})`:`غير مسند لسائق حالياً`}</span></div>
        <div class="form-row"><span class="form-label">السلاح المثبت:</span><span class="form-value">${e.has_weapon?`${e.mounted_weapon_name||`سلاح مثبت`} (رقم: ${e.mounted_weapon_serial||`—`})`:`بدون سلاح مثبت`}</span></div>
      </div>
    `:`
      <div class="section-title">أولاً: البيانات الفنية والمخزنية للصنف</div>
      <div class="form-grid">
        <div class="form-row"><span class="form-label">اسم الصنف:</span><span class="form-value">${e.name||`—`}</span></div>
        <div class="form-row"><span class="form-label">التصنيف العام:</span><span class="form-value">${e.category_name||`—`}</span></div>
        <div class="form-row"><span class="form-label">كود الصنف / الباركود:</span><span class="form-value font-mono">${e.item_code||`—`}</span></div>
        <div class="form-row"><span class="form-label">وحدة القياس / العبوة:</span><span class="form-value">${e.unit||`قطعة`}</span></div>
        <div class="form-row"><span class="form-label">إجمالي الرصيد:</span><span class="form-value">${e.total_quantity||0}</span></div>
        <div class="form-row"><span class="form-label">المتوفر بالمخزن:</span><span class="form-value">${e.available_quantity??e.total_quantity??0}</span></div>
        <div class="form-row"><span class="form-label">المسلّم كعهدة:</span><span class="form-value">${(e.total_quantity||0)-(e.available_quantity||0)}</span></div>
        <div class="form-row"><span class="form-label">حالة الصنف:</span><span class="form-value">${e.status_display||e.status||`صالح للاستخدام`}</span></div>
        <div class="form-row" style="grid-column: span 2;"><span class="form-label">ملاحظات ومكان التخزين:</span><span class="form-value">${e.notes||`مسجل بالمستودع المركزي`}</span></div>
      </div>
    `;let o=`
    <div class="section-title">ثانياً: سجل سلسلة الحيازة والتنقلات والعهد الرسمية</div>
  `;!t||t.length===0?o+=`
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; color: #64748b; font-size: 12px; margin-bottom: 20px;">
        لا توجد سجلات حيازة أو تنقلات سابقة مسجلة على هذا الأصل حتى تاريخه.
      </div>
    `:o+=`
      <table class="gov-table">
        <thead>
          <tr>
            <th style="width: 30px;">#</th>
            <th>تاريخ الإجراء</th>
            <th>نوع الحركة / الإجراء</th>
            <th>المستلم / المستفيد</th>
            <th>الرقم العسكري / التبعية</th>
            <th>القائم بالصرف والإجراء</th>
            <th>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${t.map((e,t)=>`
            <tr>
              <td style="text-align: center; font-weight: 700;">${t+1}</td>
              <td>${e.action_date||e.created_at?new Date(e.action_date||e.created_at).toLocaleDateString(`ar-LY`):`—`}</td>
              <td style="font-weight: 700;">${e.action_display||e.action||`تسليم عهدة`}</td>
              <td>${e.member_name||e.driver_name||e.driver||`—`}</td>
              <td>${e.force_number||e.external_unit_name||e.faction_name||`—`}</td>
              <td>${e.issued_by_name||e.issued_by||`مسؤول المنظومة`}</td>
              <td>${e.notes||`—`}</td>
            </tr>
          `).join(``)}
        </tbody>
      </table>
    `;let s=a+o;x({title:r,subtitle:i,documentNumber:`CARD-${e.id}-${Date.now().toString().slice(-4)}`,contentHtml:s})}function C({item:e,custodyRecord:t,voucherNumber:n}){let r=t?.member_name||`الفرد المستلم للعهدة`,i=t?.force_number||`—`,a=t?.rank_name||`عضو بالقوة`,o=t?.faction_name||`الإدارة العامة`,s=e?.name||t?.item_name||`صنف عسكري / مهمات`,c=e?.code||t?.item_code||`—`,l=e?.serial_number||t?.serial_number||`—`,u=`
    <div class="section-title">أولاً: بيانات الطرف المستلم للعهدة</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">اسم المستلم الكامل:</span><span class="form-value">${r}</span></div>
      <div class="form-row"><span class="form-label">الرقم العسكري:</span><span class="form-value font-mono">${i}</span></div>
      <div class="form-row"><span class="form-label">الرتبة العسكرية:</span><span class="form-value">${a}</span></div>
      <div class="form-row"><span class="form-label">الوحدة / الفصيل:</span><span class="form-value">${o}</span></div>
    </div>

    <div class="section-title">ثانياً: تفاصيل الصنف المسلّم كعهدة رسمية</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">اسم الصنف / العتاد:</span><span class="form-value">${s}</span></div>
      <div class="form-row"><span class="form-label">التصنيف:</span><span class="form-value">${e?.category_name||`مهمات وعتاد`}</span></div>
      <div class="form-row"><span class="form-label">كود الصنف:</span><span class="form-value font-mono">${c}</span></div>
      <div class="form-row"><span class="form-label">الرقم التسلسلي:</span><span class="form-value font-mono">${l}</span></div>
      <div class="form-row"><span class="form-label">الكمية المسلمة:</span><span class="form-value">${t?.quantity||1}</span></div>
      <div class="form-row"><span class="form-label">تاريخ التسليم:</span><span class="form-value">${new Date().toLocaleDateString(`ar-LY`)}</span></div>
      <div class="form-row" style="grid-column: span 2;"><span class="form-label">إقرار الاستلام:</span><span class="form-value">أقر أنا المستلم أعلاه بأنني استلمت الصنف الموضح بكامل حالته الفنية وأتعهد بالمحافظة عليه وفق اللوائح المعمول بها.</span></div>
    </div>
  `;x({title:`محضر تسليم واستلام عهدة ومهمات عسكرية رسمية`,subtitle:`رقم المحضر: ${n||`VOUCH-`+Date.now().toString().slice(-6)}`,documentNumber:n,contentHtml:u})}function w({vehicle:e,tripNumber:t}){if(!e)return;let n=`
    <div class="section-title">أولاً: بيانات الآلية / المركبة المأمورة</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">اسم وطراز المركبة:</span><span class="form-value">${e.name||`—`}</span></div>
      <div class="form-row"><span class="form-label">رقم اللوحة المعدنية:</span><span class="form-value font-mono">${e.plate_number||`—`}</span></div>
      <div class="form-row"><span class="form-label">رقم الهيكل (VIN):</span><span class="form-value font-mono">${e.vin_number||`—`}</span></div>
      <div class="form-row"><span class="form-label">نوع التبعية:</span><span class="form-value">${e.affiliation_type===`external`?`جهة خارجية (${e.external_unit_name||`—`})`:`فصيل داخلي (${e.faction_name||`—`})`}</span></div>
      <div class="form-row"><span class="form-label">السائق المكلّف:</span><span class="form-value">${e.driver_name||`غير محدد`}</span></div>
      <div class="form-row"><span class="form-label">الرقم العسكري للسائق:</span><span class="form-value font-mono">${e.driver_force_number||`—`}</span></div>
      <div class="form-row" style="grid-column: span 2;"><span class="form-label">السلاح والتجهيز:</span><span class="form-value">${e.has_weapon?`${e.mounted_weapon_name||`سلاح مثبت`} (رقم: ${e.mounted_weapon_serial||`—`})`:`بدون تسليح مثبت`}</span></div>
    </div>

    <div class="section-title">ثانياً: خط السير والتكليف العملياتي</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">نقطة الانطلاق:</span><span class="form-value">المقر الرئيسي / معسكر القوة</span></div>
      <div class="form-row"><span class="form-label">الوجهة والمهمة:</span><span class="form-value">مأمورية عملياتية وتأمين رسمي</span></div>
      <div class="form-row"><span class="form-label">تاريخ وتوقيت الانطلاق:</span><span class="form-value">${new Date().toLocaleDateString(`ar-LY`)}</span></div>
      <div class="form-row"><span class="form-label">مدة الإذن:</span><span class="form-value">24 ساعة من تاريخ وساعة الإصدار</span></div>
    </div>
  `;x({title:`أمر تحرك ومأمورية آلية عسكرية رسمية`,subtitle:`إذن تحرك رسمي صادر للمركبة: ${e.name} (لوحة: ${e.plate_number||`—`})`,documentNumber:t||`TRIP-${Date.now().toString().slice(-6)}`,contentHtml:n})}function T({items:e=[],domain:t=`inventory`}){let n=t===`armory`,r=n?`كشف حصر وجرد مستودع التسليح والأسلحة والذخائر الرسمي`:`كشف حصر وجرد المستودع والمخازن العامة الرسمي`,i=0,a=0,o=0,s=0;e.forEach(e=>{i+=Number(e.total_quantity)||0,a+=Number(e.available_quantity)||0,o+=Number(e.assigned_quantity)||0,s+=Number(e.damaged_quantity)||0});let c=`
    <div class="form-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px; background: #f8fafc;">
      <div class="form-row"><span class="form-label">إجمالي الأصناف:</span><span class="form-value">${e.length} صنف</span></div>
      <div class="form-row"><span class="form-label">إجمالي الرصيد:</span><span class="form-value">${i} قطعة</span></div>
      <div class="form-row"><span class="form-label">المتوفر بالمستودع:</span><span class="form-value" style="color: #16a34a;">${a}</span></div>
      <div class="form-row"><span class="form-label">المسلّم كعهدة:</span><span class="form-value" style="color: #2563eb;">${o}</span></div>
    </div>
  `,l=e.length===0?`<tr><td colspan="8" style="text-align: center; padding: 18px; color: #64748b;">لا توجد أصناف مسجلة في هذا الكشف.</td></tr>`:e.map((e,t)=>`
        <tr>
          <td style="text-align: center; font-weight: 700;">${t+1}</td>
          <td style="font-weight: 700; color: #0f172a;">${e.name||`—`}</td>
          <td>${e.category_name||`عام`}</td>
          <td class="font-mono">${n?e.serial_number||e.caliber||`—`:e.item_code||`—`}</td>
          <td style="text-align: center; font-weight: 700; color: #16a34a;">${e.available_quantity??0}</td>
          <td style="text-align: center; font-weight: 700; color: #2563eb;">${e.assigned_quantity??0}</td>
          <td style="text-align: center; font-weight: 700; color: #dc2626;">${e.damaged_quantity??0}</td>
          <td style="text-align: center; font-weight: 800;">${e.total_quantity??0}</td>
        </tr>
      `).join(``),u=`
    <div class="section-title">بيان الأصناف والكميات وحالة الأرصدة والعهد</div>
    <table class="gov-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">#</th>
          <th>اسم الصنف / القطعة</th>
          <th>التصنيف</th>
          <th>${n?`الرقم التسلسلي / العيار`:`كود الصنف`}</th>
          <th style="text-align: center;">المتوفر</th>
          <th style="text-align: center;">العهدة</th>
          <th style="text-align: center;">التالف</th>
          <th style="text-align: center;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${l}
      </tbody>
    </table>
  `;x({title:r,subtitle:`تاريخ الجرد: ${new Date().toLocaleDateString(`ar-LY`)} | إجمالي الأصناف: ${e.length}`,documentNumber:`INV-SUM-${Date.now().toString().slice(-6)}`,contentHtml:c+u})}function E({vehicles:e=[]}){let t=`
    <div class="form-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px; background: #f8fafc;">
      <div class="form-row"><span class="form-label">إجمالي الأسطول:</span><span class="form-value">${e.length} آلية</span></div>
      <div class="form-row"><span class="form-label">جاهزة للعمليات:</span><span class="form-value" style="color: #16a34a;">${e.filter(e=>e.status===`ready`).length}</span></div>
      <div class="form-row"><span class="form-label">تبعية خارجية:</span><span class="form-value" style="color: #7c3aed;">${e.filter(e=>e.affiliation_type===`external`||!!e.external_unit_name).length}</span></div>
      <div class="form-row"><span class="form-label">مركبات مسلحة:</span><span class="form-value" style="color: #d97706;">${e.filter(e=>e.has_weapon).length}</span></div>
    </div>
  `,n=`
    <div class="section-title">بيان أسطول الآليات والمركبات وحالة التبعية والتشغيل</div>
    <table class="gov-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">#</th>
          <th>المركبة / الطراز</th>
          <th>النوع</th>
          <th>رقم الهيكل (VIN)</th>
          <th>اللوحة</th>
          <th>التبعية</th>
          <th>السائق المكلف</th>
          <th>السلاح المثبت</th>
        </tr>
      </thead>
      <tbody>
        ${e.length===0?`<tr><td colspan="8" style="text-align: center; padding: 18px; color: #64748b;">لا توجد مركبات مسجلة في هذا الكشف.</td></tr>`:e.map((e,t)=>`
        <tr>
          <td style="text-align: center; font-weight: 700;">${t+1}</td>
          <td style="font-weight: 700; color: #0f172a;">${e.name||`—`}</td>
          <td>${e.vehicle_type_display||e.vehicle_type||`—`}</td>
          <td class="font-mono">${e.vin_number||`—`}</td>
          <td style="font-weight: 700;">${e.plate_number||`—`}</td>
          <td>${e.affiliation_type===`external`?e.external_unit_name||`جهة خارجية`:e.faction_name||`عام`}</td>
          <td>${e.driver_name||`المستودع الرئيسي`}</td>
          <td>${e.has_weapon?e.mounted_weapon_name||`سلاح مثبت`:`بدون`}</td>
        </tr>
      `).join(``)}
      </tbody>
    </table>
  `;x({title:`كشف حصر وجرد أسطول الآليات والمركبات الرسمي`,subtitle:`تاريخ الحصر: ${new Date().toLocaleDateString(`ar-LY`)} | إجمالي المركبات: ${e.length}`,documentNumber:`VEH-SUM-${Date.now().toString().slice(-6)}`,contentHtml:t+n})}var D=t(),O={ready:{label:`جاهزة للخدمة`,variant:`success`},good:{label:`صالح للاستعمال`,variant:`success`},maintenance:{label:`تحت الصيانة`,variant:`warning`},damaged:{label:`تالف / معطل`,variant:`danger`},retired:{label:`خارج الخدمة`,variant:`secondary`}},k={assigned:{label:`تسليم / صرف عهدة`,color:`text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/40 border-blue-200`},returned:{label:`إرجاع واستلام`,color:`text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40 border-emerald-200`},maintenance:{label:`إحالة للصيانة`,color:`text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/40 border-amber-200`},damaged:{label:`تسجيل تلف/عطل`,color:`text-rose-700 bg-rose-50 dark:text-rose-300 dark:bg-rose-950/40 border-rose-200`},transfer:{label:`نقل تبعية`,color:`text-purple-700 bg-purple-50 dark:text-purple-300 dark:bg-purple-950/40 border-purple-200`}};function A({open:e,onOpenChange:t,item:n,type:x=`weapon`}){let C=(0,b.useRef)(null),{data:w=[],isLoading:T}=i({queryKey:[`asset-history`,x,n?.id],queryFn:async()=>n?.id?x===`vehicle`?(await r.get(`transportation/vehicle-custody-records/`,{params:{vehicle:n.id}})).data:(await r.get(`equipment/custody/`,{params:{item:n.id}})).data:[],enabled:!!(e&&n?.id)}),E=Array.isArray(w)?w:w?.results||[];if(!n)return null;let A=O[n.status]||{label:n.status||`—`,variant:`secondary`};return(0,D.jsx)(f,{open:e,onOpenChange:t,children:(0,D.jsxs)(l,{className:`max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-[28px] border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0F172A] shadow-2xl`,children:[(0,D.jsx)(s,{className:`p-6 pb-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]`,children:(0,D.jsxs)(`div`,{className:`flex flex-col sm:flex-row sm:items-center justify-between gap-4`,children:[(0,D.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,D.jsx)(`div`,{className:`w-12 h-12 rounded-2xl bg-[#2B95E8]/10 text-[#2B95E8] flex items-center justify-center shrink-0 border border-[#2B95E8]/20`,children:x===`vehicle`?(0,D.jsx)(p,{className:`w-6 h-6`}):x===`weapon`?(0,D.jsx)(_,{className:`w-6 h-6`}):(0,D.jsx)(a,{className:`w-6 h-6`})}),(0,D.jsxs)(`div`,{className:`text-start`,children:[(0,D.jsxs)(u,{className:`text-title font-bold text-slate-900 dark:text-white flex items-center gap-2`,children:[(0,D.jsx)(`span`,{children:n.name}),(0,D.jsx)(y,{variant:A.variant,className:`text-caption font-bold`,children:A.label})]}),(0,D.jsxs)(d,{className:`text-caption text-slate-500 font-medium mt-0.5`,children:[x===`vehicle`&&`رقم الهيكل: ${n.vin_number||`—`} | اللوحة: ${n.plate_number||`—`}`,x===`weapon`&&`الرقم التسلسلي: ${n.serial_number||`—`} | العيار: ${n.caliber||`—`}`,x===`inventory`&&`كود الصنف: ${n.item_code||`—`} | التصنيف: ${n.category_name||`—`}`]})]})]}),(0,D.jsxs)(v,{onClick:()=>{S({item:n,history:E,type:x})},variant:`outline`,className:`gap-2 font-bold rounded-xl border-slate-200 dark:border-white/10 shadow-xs`,children:[(0,D.jsx)(o,{className:`w-4 h-4 text-blue-600`}),(0,D.jsx)(`span`,{children:`طباعة بطاقة الأصل وسجل الحيازة (نافذة جديدة)`})]})]})}),(0,D.jsxs)(`div`,{ref:C,className:`p-6 space-y-6 text-start`,children:[(0,D.jsxs)(`div`,{className:`hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6`,children:[(0,D.jsxs)(`div`,{className:`flex items-center gap-3`,children:[(0,D.jsx)(`img`,{src:g,alt:`شعار الجهاز`,className:`w-14 h-14 object-cover rounded-xl`}),(0,D.jsxs)(`div`,{children:[(0,D.jsx)(`h1`,{className:`text-lg font-bold text-slate-900`,children:`دولة ليبيا — الجهاز الوطني للقوى المساندة`}),(0,D.jsx)(`p`,{className:`text-sm text-slate-600 font-medium`,children:`الوحدة القتالية الرابعة — بطاقة الأصل وسلسلة الحيازة الرسمية`})]})]}),(0,D.jsxs)(`div`,{className:`text-end text-xs text-slate-500 font-mono`,children:[(0,D.jsxs)(`p`,{children:[`تاريخ الطباعة: `,new Date().toLocaleDateString(`ar-LY`)]}),(0,D.jsxs)(`p`,{children:[`الرقم المرجعي: #`,n.id]})]})]}),(0,D.jsxs)(`div`,{className:`rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-4.5 space-y-3`,children:[(0,D.jsxs)(`h3`,{className:`text-caption font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2`,children:[(0,D.jsx)(m,{className:`w-4 h-4 text-[#2B95E8]`}),`بطاقة البيانات والمواصفات الفنية`]}),(0,D.jsxs)(`div`,{className:`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-caption`,children:[x===`vehicle`&&(0,D.jsxs)(D.Fragment,{children:[(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`طراز الآلية`}),(0,D.jsx)(`span`,{className:`font-bold text-slate-900 dark:text-white`,children:n.vehicle_type_display||n.vehicle_type||`—`})]}),(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`رقم اللوحة`}),(0,D.jsx)(`span`,{className:`font-bold font-mono text-slate-900 dark:text-white dir-ltr`,children:n.plate_number||`—`})]}),(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`رقم الهيكل / VIN`}),(0,D.jsx)(`span`,{className:`font-bold font-mono text-slate-900 dark:text-white dir-ltr`,children:n.vin_number||`—`})]}),(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`سنة الصنع / اللون`}),(0,D.jsxs)(`span`,{className:`font-bold text-slate-900 dark:text-white`,children:[n.model_year||`—`,` / `,n.color||`—`]})]}),(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`التبعية الإدارية`}),(0,D.jsx)(`span`,{className:`font-bold text-slate-900 dark:text-white`,children:n.affiliation_type===`external`?`جهة خارجية (${n.external_unit_name||`—`})`:`فصيل داخلي (${n.faction_name||`عام`})`})]}),(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`السائق / المسؤول الحالي`}),(0,D.jsx)(`span`,{className:`font-bold text-slate-900 dark:text-white`,children:n.driver_name?`${n.driver_name} (${n.driver_force_number||`—`})`:`المستودع الرئيسي (غير مخصص)`})]}),n.has_weapon&&(0,D.jsxs)(D.Fragment,{children:[(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30`,children:[(0,D.jsx)(`span`,{className:`text-amber-800 dark:text-amber-300 block`,children:`السلاح المثبت`}),(0,D.jsx)(`span`,{className:`font-bold text-amber-950 dark:text-amber-100`,children:n.mounted_weapon_name||`—`})]}),(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30`,children:[(0,D.jsx)(`span`,{className:`text-amber-800 dark:text-amber-300 block`,children:`رامي السلاح`}),(0,D.jsx)(`span`,{className:`font-bold text-amber-950 dark:text-amber-100`,children:n.weapon_operator_name||`غير محدد`})]})]})]}),x===`weapon`&&(0,D.jsxs)(D.Fragment,{children:[(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`التصنيف والنوع`}),(0,D.jsx)(`span`,{className:`font-bold text-slate-900 dark:text-white`,children:n.category_name||n.category_type_display||`—`})]}),(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`الرقم التسلسلي`}),(0,D.jsx)(`span`,{className:`font-bold font-mono text-slate-900 dark:text-white dir-ltr`,children:n.serial_number||`—`})]}),(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`العيار / الطراز`}),(0,D.jsxs)(`span`,{className:`font-bold text-slate-900 dark:text-white`,children:[n.caliber||`—`,` / `,n.model_name||`—`]})]}),(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`رصيد المخزن والعهد`}),(0,D.jsxs)(`span`,{className:`font-bold text-slate-900 dark:text-white`,children:[`المتوفر: `,n.available_quantity,` / المصروف: `,n.assigned_quantity,` / الإجمالي: `,n.total_quantity]})]}),(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5 sm:col-span-2`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`العهدة الحالية`}),(0,D.jsx)(`span`,{className:`font-bold text-slate-900 dark:text-white`,children:n.assigned_member_name?`${n.assigned_member_name} (${n.assigned_member_force_number||`—`})`:`خزينة السلاح الرئيسية`})]})]}),x===`inventory`&&(0,D.jsxs)(D.Fragment,{children:[(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`التصنيف المخزني`}),(0,D.jsx)(`span`,{className:`font-bold text-slate-900 dark:text-white`,children:n.category_name||`—`})]}),(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`كود الصنف / الباركود`}),(0,D.jsx)(`span`,{className:`font-bold font-mono text-slate-900 dark:text-white dir-ltr`,children:n.item_code||`—`})]}),(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`المقاس / المواصفة`}),(0,D.jsx)(`span`,{className:`font-bold text-slate-900 dark:text-white`,children:n.size_spec||n.model_name||`—`})]}),(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`الكميات (المتوفر / العهد)`}),(0,D.jsxs)(`span`,{className:`font-bold text-slate-900 dark:text-white`,children:[`المتوفر: `,n.available_quantity,` / العهدة: `,n.assigned_quantity,` / الإجمالي: `,n.total_quantity]})]}),(0,D.jsxs)(`div`,{className:`p-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200/60 dark:border-white/5 sm:col-span-2`,children:[(0,D.jsx)(`span`,{className:`text-slate-500 block`,children:`العهدة الحالية`}),(0,D.jsx)(`span`,{className:`font-bold text-slate-900 dark:text-white`,children:n.assigned_member_name?`${n.assigned_member_name} (${n.assigned_member_force_number||`—`})`:`المستودع العام`})]})]})]}),n.notes&&(0,D.jsxs)(`div`,{className:`pt-2 text-caption text-slate-600 dark:text-slate-300`,children:[(0,D.jsx)(`span`,{className:`font-bold`,children:`ملاحظات التخزين: `}),n.notes]})]}),(0,D.jsxs)(`div`,{className:`space-y-3`,children:[(0,D.jsxs)(`div`,{className:`flex items-center justify-between`,children:[(0,D.jsxs)(`h3`,{className:`text-body-sm font-bold text-slate-900 dark:text-white flex items-center gap-2`,children:[(0,D.jsx)(h,{className:`w-4.5 h-4.5 text-[#2B95E8]`}),(0,D.jsx)(`span`,{children:`سجل حركة وسلسلة الحيازة (Possession Chain Log)`})]}),(0,D.jsxs)(`span`,{className:`text-caption text-slate-500 font-semibold`,children:[`إجمالي السجلات: `,E.length]})]}),(0,D.jsx)(`div`,{className:`rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden`,children:(0,D.jsxs)(`table`,{className:`w-full text-start text-caption`,children:[(0,D.jsx)(`thead`,{className:`bg-slate-50 dark:bg-white/5 border-b border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-gray-300 font-bold`,children:(0,D.jsxs)(`tr`,{children:[(0,D.jsx)(`th`,{className:`py-2.5 px-3 text-start`,children:`التاريخ`}),(0,D.jsx)(`th`,{className:`py-2.5 px-3 text-start`,children:`نوع الإجراء`}),(0,D.jsx)(`th`,{className:`py-2.5 px-3 text-start`,children:`المستلم / السائق / الجهة`}),x!==`vehicle`&&(0,D.jsx)(`th`,{className:`py-2.5 px-3 text-center`,children:`الكمية`}),x===`vehicle`&&(0,D.jsx)(`th`,{className:`py-2.5 px-3 text-center`,children:`العداد (كم)`}),(0,D.jsx)(`th`,{className:`py-2.5 px-3 text-start`,children:`الملاحظات وتقرير الحالة`}),(0,D.jsx)(`th`,{className:`py-2.5 px-3 text-start`,children:`المسؤول المصرح`})]})}),(0,D.jsx)(`tbody`,{className:`divide-y divide-slate-100 dark:divide-white/5`,children:T?(0,D.jsx)(`tr`,{children:(0,D.jsx)(`td`,{colSpan:7,className:`text-center py-8 text-slate-400 font-medium`,children:`جارٍ تحميل سجل الحيازة...`})}):E.length===0?(0,D.jsx)(`tr`,{children:(0,D.jsx)(`td`,{colSpan:7,className:`text-center py-8 text-slate-400 font-medium`,children:`لا توجد حركات حيازة أو تسليم مسجلة بعد لهذا الأصل.`})}):E.map(e=>{let t=k[e.action]||{label:e.action_display||e.action,color:`text-slate-700 bg-slate-100 dark:bg-white/10 border-slate-200`},n=e.driver_name||e.member_name||e.external_unit_name||e.faction_name||`—`,r=e.driver_force_number||e.member_force_number;return(0,D.jsxs)(`tr`,{className:`hover:bg-slate-50/50 dark:hover:bg-white/[0.02]`,children:[(0,D.jsx)(`td`,{className:`py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap`,children:e.action_date||e.assigned_date||(e.created_at?e.created_at.split(`T`)[0]:`—`)}),(0,D.jsx)(`td`,{className:`py-2.5 px-3 whitespace-nowrap`,children:(0,D.jsx)(`span`,{className:`inline-block px-2 py-0.5 rounded-lg text-micro font-bold border ${t.color}`,children:t.label})}),(0,D.jsxs)(`td`,{className:`py-2.5 px-3 font-bold text-slate-900 dark:text-white`,children:[(0,D.jsx)(`span`,{children:n}),r&&(0,D.jsxs)(`span`,{className:`text-micro font-mono text-slate-400 ms-1`,children:[`(`,r,`)`]})]}),x!==`vehicle`&&(0,D.jsx)(`td`,{className:`py-2.5 px-3 text-center font-bold text-slate-900 dark:text-white`,children:e.quantity||1}),x===`vehicle`&&(0,D.jsx)(`td`,{className:`py-2.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300`,children:e.odometer?`${e.odometer.toLocaleString()} كم`:`—`}),(0,D.jsx)(`td`,{className:`py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate`,children:e.notes||`—`}),(0,D.jsx)(`td`,{className:`py-2.5 px-3 text-slate-500 text-micro`,children:e.issued_by_name||`النظام`})]},e.id)})})]})})]}),(0,D.jsxs)(`div`,{className:`hidden print:grid grid-cols-3 gap-8 pt-10 border-t border-slate-200 mt-12 text-center text-sm font-bold`,children:[(0,D.jsxs)(`div`,{children:[(0,D.jsx)(`p`,{className:`text-slate-600`,children:`ضابط / مسؤول العهدة`}),(0,D.jsx)(`div`,{className:`h-14 border-b border-dashed border-slate-300 mt-2`}),(0,D.jsx)(`p`,{className:`text-xs text-slate-400 mt-1`,children:`الاسم والتوقيع`})]}),(0,D.jsxs)(`div`,{children:[(0,D.jsx)(`p`,{className:`text-slate-600`,children:`المستلم / الحائز الحالي`}),(0,D.jsx)(`div`,{className:`h-14 border-b border-dashed border-slate-300 mt-2`}),(0,D.jsx)(`p`,{className:`text-xs text-slate-400 mt-1`,children:`الاسم والتوقيع`})]}),(0,D.jsxs)(`div`,{children:[(0,D.jsx)(`p`,{className:`text-slate-600`,children:`اعتماد رئيس القسم / الآمر`}),(0,D.jsx)(`div`,{className:`h-14 border-b border-dashed border-slate-300 mt-2`}),(0,D.jsx)(`p`,{className:`text-xs text-slate-400 mt-1`,children:`الختم والاعتماد`})]})]})]}),(0,D.jsx)(c,{className:`p-4 border-t border-slate-100 dark:border-white/10 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-white/[0.02] print:hidden`,children:(0,D.jsx)(v,{type:`button`,variant:`outline`,onClick:()=>t(!1),className:`rounded-xl px-5 font-bold`,children:`إغلاق`})})]})})}export{E as a,w as i,C as n,T as r,A as t};