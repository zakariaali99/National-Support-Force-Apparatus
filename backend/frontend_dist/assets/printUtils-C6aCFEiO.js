function e({title:e,subtitle:t,department:n=`إدارة الشؤون الإدارية والعهد`,docType:r=`كشف رسمي معتمد`,documentNumber:i,orientation:a=`portrait`,contentHtml:o,showSignatures:s=!0}){let c=a===`landscape`,l=c?1200:920,u=c?850:1080,d=window.open(``,`_blank`,`width=${l},height=${u},menubar=no,toolbar=no,location=no,status=no`);if(!d){alert(`يرجى السماح بالنوافذ المنبثقة (Popups) لعرض وطباعة المستند في نافذة مستقلة.`);return}let f=new Date().toLocaleDateString(`ar-LY`,{year:`numeric`,month:`long`,day:`numeric`}),p=new Date().toLocaleTimeString(`ar-LY`,{hour:`2-digit`,minute:`2-digit`}),m=i||`NASF-${Math.floor(1e5+Math.random()*9e5)}`,h=`<!DOCTYPE html>
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
      font-size: 12.5px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    /* Screen Top Floating Toolbar */
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
      width: ${c?`297mm`:`210mm`};
      min-height: ${c?`210mm`:`297mm`};
      margin: 24px auto;
      background: #ffffff;
      padding: ${c?`14mm 16mm`:`18mm 18mm`};
      box-shadow: 0 0 20px rgba(0,0,0,0.08);
      border-radius: 4px;
      position: relative;
    }

    /* Official Government Header */
    .gov-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2.5px solid #0f172a;
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
      color: #2563eb;
      margin-top: 2px;
    }
    .gov-meta-grid {
      display: grid;
      grid-template-columns: auto auto;
      gap: 3px 14px;
      text-align: right;
      font-size: 11px;
      color: #475569;
      background: #f8fafc;
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
    }
    .gov-meta-grid strong {
      color: #0f172a;
    }

    /* Document Title Banner */
    .doc-banner {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px 16px;
      text-align: center;
      margin-bottom: 18px;
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
      font-weight: 600;
    }

    /* Form Grid / Details Box */
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      border-right: 4px solid #2563eb;
      padding-right: 8px;
      margin-bottom: 10px;
      margin-top: 16px;
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
      margin-bottom: 18px;
      font-size: 11.5px;
    }
    table.gov-table th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      padding: 7px 9px;
      border: 1px solid #cbd5e1;
      text-align: right;
    }
    table.gov-table td {
      padding: 6.5px 9px;
      border: 1px solid #e2e8f0;
      color: #334155;
      text-align: right;
    }
    table.gov-table tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Filter Summary Box */
    .filter-summary-box {
      font-size: 11px;
      color: #475569;
      background: #f1f5f9;
      padding: 6px 12px;
      border-radius: 6px;
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    /* Signatures Section */
    .signatures-block {
      margin-top: 28px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      text-align: center;
      page-break-inside: avoid;
    }
    .sig-box {
      border: 1px dashed #94a3b8;
      border-radius: 8px;
      padding: 10px 8px 24px;
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
        padding: ${c?`6mm 8mm`:`8mm 10mm`};
        box-shadow: none;
        width: 100%;
        min-height: auto;
      }
      @page {
        size: ${c?`A4 landscape`:`A4 portrait`};
        margin: ${c?`8mm`:`10mm`};
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
        <h2>الوحدة القتالية الرابعة</h2>
      </div>
      <div class="gov-meta-grid">
        <div><strong>الإدارة:</strong> ${n}</div>
        <div><strong>نوع المستند:</strong> ${r}</div>
        <div><strong>الرقم المرجعي:</strong> ${m}</div>
        <div><strong>تاريخ الطباعة:</strong> ${f}</div>
        <div style="grid-column: span 2;"><strong>توقيت الإصدار:</strong> ${p}</div>
      </div>
    </div>

    <!-- Title Banner -->
    <div class="doc-banner">
      <h3>${e}</h3>
      ${t?`<p>${t}</p>`:``}
    </div>

    <!-- Main Content Form Body -->
    ${o}

    <!-- Signatures Endorsement -->
    ${s?`
      <div class="signatures-block">
        <div class="sig-box">
          <p class="sig-title">مسؤول السجل والعهدة</p>
          <p class="sig-sub">الاسم: .......................................</p>
          <p class="sig-sub" style="margin-top: 14px;">التوقيع: .................................</p>
        </div>
        <div class="sig-box">
          <p class="sig-title">الضابط المفوّض / رئيس الفرع</p>
          <p class="sig-sub">الاسم: .......................................</p>
          <p class="sig-sub" style="margin-top: 14px;">التوقيع: .................................</p>
        </div>
        <div class="sig-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80px;">
          <p class="sig-title" style="color: #64748b;">الختم الرسمي المعتمد</p>
        </div>
      </div>
    `:``}
  </div>
</body>
</html>`;d.document.open(),d.document.write(h),d.document.close()}function t({item:t,history:n=[],type:r=`weapon`}){if(!t)return;let i=r===`weapon`?`بطاقة حصر وسجل تاريخ الحيازة للقطعة التسليحية: ${t.name||``}`:r===`vehicle`?`بطاقة تسجيل وسلسلة عهدة الآلية: ${t.name||``}`:`بطاقة صنف مخزني وسجل صرف العهدة: ${t.name||``}`,a=r===`weapon`?`الرقم التسلسلي: ${t.serial_number||`—`} | العيار: ${t.caliber||`—`}`:r===`vehicle`?`رقم الهيكل: ${t.vin_number||`—`} | رقم اللوحة: ${t.plate_number||`—`}`:`كود الصنف: ${t.item_code||`—`} | التصنيف: ${t.category_name||`—`}`,o=r===`weapon`?`إدارة التسليح والذخائر`:r===`vehicle`?`إدارة النقليات والآليات`:`المستودع والمخازن العامة`,s=r===`weapon`?`بطاقة أصل وسجل حيازة تسليحية`:r===`vehicle`?`بطاقة آلية وسلسلة عهدة`:`بطاقة صنف ومحضر حيازة`,c=``;c=r===`weapon`?`
      <div class="section-title">أولاً: البيانات الفنية والتسليحية للقطعة</div>
      <div class="form-grid">
        <div class="form-row"><span class="form-label">اسم السلاح / العتاد:</span><span class="form-value">${t.name||`—`}</span></div>
        <div class="form-row"><span class="form-label">التصنيف التسليحي:</span><span class="form-value">${t.category_name||`—`}</span></div>
        <div class="form-row"><span class="form-label">الرقم التسلسلي المنقوش:</span><span class="form-value font-mono">${t.serial_number||`—`}</span></div>
        <div class="form-row"><span class="form-label">العيار الباليستي:</span><span class="form-value">${t.caliber||`—`}</span></div>
        <div class="form-row"><span class="form-label">الموديل / بلد الصنع:</span><span class="form-value">${t.model_name||`—`}</span></div>
        <div class="form-row"><span class="form-label">الحالة الفنية للقطعة:</span><span class="form-value">${t.status_display||t.status||`صالح للخدمة`}</span></div>
        <div class="form-row"><span class="form-label">الكمية الإجمالية:</span><span class="form-value">${t.total_quantity||1}</span></div>
        <div class="form-row"><span class="form-label">المتوفر في الخزينة:</span><span class="form-value">${t.available_quantity??1}</span></div>
        <div class="form-row" style="grid-column: span 2;"><span class="form-label">موقع الحفظ والملاحظات:</span><span class="form-value">${t.notes||`مسجل بخزينة الأسلحة الرئيسية`}</span></div>
      </div>
    `:r===`vehicle`?`
      <div class="section-title">أولاً: البيانات الفنية والمواصفات الرسمية للمركبة</div>
      <div class="form-grid">
        <div class="form-row"><span class="form-label">اسم وطراز المركبة:</span><span class="form-value">${t.name||`—`}</span></div>
        <div class="form-row"><span class="form-label">نوع المركبة:</span><span class="form-value">${t.vehicle_type_display||t.vehicle_type||`—`}</span></div>
        <div class="form-row"><span class="form-label">رقم الهيكل (VIN):</span><span class="form-value font-mono">${t.vin_number||`—`}</span></div>
        <div class="form-row"><span class="form-label">رقم اللوحة المعدنية:</span><span class="form-value">${t.plate_number||`—`}</span></div>
        <div class="form-row"><span class="form-label">سنة الصنع والموديل:</span><span class="form-value">${t.model_year||`—`}</span></div>
        <div class="form-row"><span class="form-label">اللون:</span><span class="form-value">${t.color||`—`}</span></div>
        <div class="form-row"><span class="form-label">نوع التبعية:</span><span class="form-value">${t.affiliation_type===`external`?`جهة خارجية (${t.external_unit_name||`—`})`:`وحدة داخلية (${t.faction_name||`—`})`}</span></div>
        <div class="form-row"><span class="form-label">حالة التشغيل:</span><span class="form-value">${t.status_display||t.status||`جاهزة للعمليات`}</span></div>
        <div class="form-row"><span class="form-label">السائق المسند إليه:</span><span class="form-value">${t.driver_name?`${t.driver_name} (${t.driver_force_number||``})`:`غير مسند لسائق حالياً`}</span></div>
        <div class="form-row"><span class="form-label">السلاح المثبت:</span><span class="form-value">${t.has_weapon?`${t.mounted_weapon_name||`سلاح مثبت`} (رقم: ${t.mounted_weapon_serial||`—`})`:`بدون سلاح مثبت`}</span></div>
      </div>
    `:`
      <div class="section-title">أولاً: البيانات الفنية والمخزنية للصنف</div>
      <div class="form-grid">
        <div class="form-row"><span class="form-label">اسم الصنف:</span><span class="form-value">${t.name||`—`}</span></div>
        <div class="form-row"><span class="form-label">التصنيف العام:</span><span class="form-value">${t.category_name||`—`}</span></div>
        <div class="form-row"><span class="form-label">كود الصنف / الباركود:</span><span class="form-value font-mono">${t.item_code||`—`}</span></div>
        <div class="form-row"><span class="form-label">وحدة القياس / العبوة:</span><span class="form-value">${t.unit||`قطعة`}</span></div>
        <div class="form-row"><span class="form-label">إجمالي الرصيد:</span><span class="form-value">${t.total_quantity||0}</span></div>
        <div class="form-row"><span class="form-label">المتوفر بالمخزن:</span><span class="form-value">${t.available_quantity??t.total_quantity??0}</span></div>
        <div class="form-row"><span class="form-label">المسلّم كعهدة:</span><span class="form-value">${(t.total_quantity||0)-(t.available_quantity||0)}</span></div>
        <div class="form-row"><span class="form-label">حالة الصنف:</span><span class="form-value">${t.status_display||t.status||`صالح للاستخدام`}</span></div>
        <div class="form-row" style="grid-column: span 2;"><span class="form-label">ملاحظات ومكان التخزين:</span><span class="form-value">${t.notes||`مسجل بالمستودع المركزي`}</span></div>
      </div>
    `;let l=`
    <div class="section-title">ثانياً: سجل سلسلة الحيازة والتنقلات والعهد الرسمية</div>
  `;!n||n.length===0?l+=`
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; color: #64748b; font-size: 12px; margin-bottom: 20px;">
        لا توجد سجلات حيازة أو تنقلات سابقة مسجلة على هذا الأصل حتى تاريخه.
      </div>
    `:l+=`
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
          ${n.map((e,t)=>`
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
    `;let u=c+l;e({title:i,subtitle:a,department:o,docType:s,documentNumber:`CARD-${t.id}-${Date.now().toString().slice(-4)}`,orientation:`portrait`,contentHtml:u})}function n({item:t,custodyRecord:n,voucherNumber:r}){let i=n?.member_name||`الفرد المستلم للعهدة`,a=n?.force_number||`—`,o=n?.rank_name||`عضو بالقوة`,s=n?.faction_name||`الإدارة العامة`,c=t?.name||n?.item_name||`صنف عسكري / مهمات`,l=t?.code||n?.item_code||`—`,u=t?.serial_number||n?.serial_number||`—`,d=`
    <div class="section-title">أولاً: بيانات الطرف المستلم للعهدة</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">اسم المستلم الكامل:</span><span class="form-value">${i}</span></div>
      <div class="form-row"><span class="form-label">الرقم العسكري:</span><span class="form-value font-mono">${a}</span></div>
      <div class="form-row"><span class="form-label">الرتبة العسكرية:</span><span class="form-value">${o}</span></div>
      <div class="form-row"><span class="form-label">الوحدة / الفصيل:</span><span class="form-value">${s}</span></div>
    </div>

    <div class="section-title">ثانياً: تفاصيل الصنف المسلّم كعهدة رسمية</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">اسم الصنف / العتاد:</span><span class="form-value">${c}</span></div>
      <div class="form-row"><span class="form-label">التصنيف:</span><span class="form-value">${t?.category_name||`مهمات وعتاد`}</span></div>
      <div class="form-row"><span class="form-label">كود الصنف:</span><span class="form-value font-mono">${l}</span></div>
      <div class="form-row"><span class="form-label">الرقم التسلسلي:</span><span class="form-value font-mono">${u}</span></div>
      <div class="form-row"><span class="form-label">الكمية المسلمة:</span><span class="form-value">${n?.quantity||1}</span></div>
      <div class="form-row"><span class="form-label">تاريخ التسليم:</span><span class="form-value">${new Date().toLocaleDateString(`ar-LY`)}</span></div>
      <div class="form-row" style="grid-column: span 2;"><span class="form-label">إقرار الاستلام:</span><span class="form-value">أقر أنا المستلم أعلاه بأنني استلمت الصنف الموضح بكامل حالته الفنية وأتعهد بالمحافظة عليه وفق اللوائح المعمول بها.</span></div>
    </div>
  `;e({title:`محضر تسليم واستلام عهدة ومهمات عسكرية رسمية`,subtitle:`رقم المحضر: ${r||`VOUCH-`+Date.now().toString().slice(-6)}`,department:`إدارة التسليح والمهمات والعهد`,docType:`محضر تسليم واستلام عهدة`,documentNumber:r,orientation:`portrait`,contentHtml:d})}function r({vehicle:t,tripNumber:n}){if(!t)return;let r=`
    <div class="section-title">أولاً: بيانات الآلية / المركبة المأمورة</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">اسم وطراز المركبة:</span><span class="form-value">${t.name||`—`}</span></div>
      <div class="form-row"><span class="form-label">رقم اللوحة المعدنية:</span><span class="form-value font-mono">${t.plate_number||`—`}</span></div>
      <div class="form-row"><span class="form-label">رقم الهيكل (VIN):</span><span class="form-value font-mono">${t.vin_number||`—`}</span></div>
      <div class="form-row"><span class="form-label">نوع التبعية:</span><span class="form-value">${t.affiliation_type===`external`?`جهة خارجية (${t.external_unit_name||`—`})`:`فصيل داخلي (${t.faction_name||`—`})`}</span></div>
      <div class="form-row"><span class="form-label">السائق المكلّف:</span><span class="form-value">${t.driver_name||`غير محدد`}</span></div>
      <div class="form-row"><span class="form-label">الرقم العسكري للسائق:</span><span class="form-value font-mono">${t.driver_force_number||`—`}</span></div>
      <div class="form-row" style="grid-column: span 2;"><span class="form-label">السلاح والتجهيز:</span><span class="form-value">${t.has_weapon?`${t.mounted_weapon_name||`سلاح مثبت`} (رقم: ${t.mounted_weapon_serial||`—`})`:`بدون تسليح مثبت`}</span></div>
    </div>

    <div class="section-title">ثانياً: خط السير والتكليف العملياتي</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">نقطة الانطلاق:</span><span class="form-value">المقر الرئيسي / معسكر القوة</span></div>
      <div class="form-row"><span class="form-label">الوجهة والمهمة:</span><span class="form-value">مأمورية عملياتية وتأمين رسمي</span></div>
      <div class="form-row"><span class="form-label">تاريخ وتوقيت الانطلاق:</span><span class="form-value">${new Date().toLocaleDateString(`ar-LY`)}</span></div>
      <div class="form-row"><span class="form-label">مدة الإذن:</span><span class="form-value">24 ساعة من تاريخ وساعة الإصدار</span></div>
    </div>
  `;e({title:`أمر تحرك ومأمورية آلية عسكرية رسمية`,subtitle:`إذن تحرك رسمي صادر للمركبة: ${t.name} (لوحة: ${t.plate_number||`—`})`,department:`شعبة النقليات والحركة`,docType:`أمر تحرك وبطاقة تشغيل`,documentNumber:n||`TRIP-${Date.now().toString().slice(-6)}`,orientation:`portrait`,contentHtml:r})}function i({items:t=[],domain:n=`inventory`,filtersSummary:r=``}){let i=n===`armory`,a=i?`كشف حصر وجرد مستودع التسليح والأسلحة والذخائر الرسمي`:`كشف حصر وجرد المستودع والمخازن العامة الرسمي`,o=i?`إدارة التسليح والذخائر`:`المستودع والمخازن العامة`,s=i?`كشف حصر تسليحي`:`كشف جرد مستودع`,c=0,l=0,u=0,d=0;t.forEach(e=>{c+=Number(e.total_quantity)||0,l+=Number(e.available_quantity)||0,u+=Number(e.assigned_quantity)||0,d+=Number(e.damaged_quantity)||0});let f=`
    ${r?`<div class="filter-summary-box"><strong>معايير التصفية المطبقة:</strong> ${r}</div>`:``}
    <div class="form-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px; background: #f8fafc;">
      <div class="form-row"><span class="form-label">إجمالي الأصناف:</span><span class="form-value">${t.length} صنف</span></div>
      <div class="form-row"><span class="form-label">إجمالي الرصيد:</span><span class="form-value">${c} قطعة</span></div>
      <div class="form-row"><span class="form-label">المتوفر بالمستودع:</span><span class="form-value" style="color: #16a34a;">${l}</span></div>
      <div class="form-row"><span class="form-label">المسلّم كعهدة:</span><span class="form-value" style="color: #2563eb;">${u}</span></div>
    </div>
  `,p=t.length===0?`<tr><td colspan="8" style="text-align: center; padding: 18px; color: #64748b;">لا توجد أصناف مسجلة في هذا الكشف.</td></tr>`:t.map((e,t)=>`
        <tr>
          <td style="text-align: center; font-weight: 700;">${t+1}</td>
          <td style="font-weight: 700; color: #0f172a;">${e.name||`—`}</td>
          <td>${e.category_name||`عام`}</td>
          <td class="font-mono">${i?e.serial_number||e.caliber||`—`:e.item_code||`—`}</td>
          <td style="text-align: center; font-weight: 700; color: #16a34a;">${e.available_quantity??0}</td>
          <td style="text-align: center; font-weight: 700; color: #2563eb;">${e.assigned_quantity??0}</td>
          <td style="text-align: center; font-weight: 700; color: #dc2626;">${e.damaged_quantity??0}</td>
          <td style="text-align: center; font-weight: 800;">${e.total_quantity??0}</td>
        </tr>
      `).join(``),m=`
    <div class="section-title">بيان الأصناف والكميات وحالة الأرصدة والعهد</div>
    <table class="gov-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">#</th>
          <th>اسم الصنف / القطعة</th>
          <th>التصنيف</th>
          <th>${i?`الرقم التسلسلي / العيار`:`كود الصنف`}</th>
          <th style="text-align: center;">المتوفر</th>
          <th style="text-align: center;">العهدة</th>
          <th style="text-align: center;">التالف</th>
          <th style="text-align: center;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${p}
      </tbody>
    </table>
  `;e({title:a,subtitle:`تاريخ الجرد: ${new Date().toLocaleDateString(`ar-LY`)} | إجمالي الأصناف المشمولة: ${t.length}`,department:o,docType:s,documentNumber:`INV-SUM-${Date.now().toString().slice(-6)}`,orientation:i?`portrait`:`landscape`,contentHtml:f+m})}function a({vehicles:t=[],filtersSummary:n=``}){let r=t.length,i=t.filter(e=>e.status===`ready`).length,a=t.filter(e=>e.affiliation_type===`external`||!!e.external_unit_name).length,o=t.filter(e=>e.has_weapon).length,s=`
    ${n?`<div class="filter-summary-box"><strong>معايير التصفية المطبقة:</strong> ${n}</div>`:``}
    <div class="form-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px; background: #f8fafc;">
      <div class="form-row"><span class="form-label">إجمالي الأسطول:</span><span class="form-value">${r} آلية</span></div>
      <div class="form-row"><span class="form-label">جاهزة للعمليات:</span><span class="form-value" style="color: #16a34a;">${i}</span></div>
      <div class="form-row"><span class="form-label">تبعية خارجية:</span><span class="form-value" style="color: #7c3aed;">${a}</span></div>
      <div class="form-row"><span class="form-label">مركبات مسلحة:</span><span class="form-value" style="color: #d97706;">${o}</span></div>
    </div>
  `,c=`
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
        ${t.length===0?`<tr><td colspan="8" style="text-align: center; padding: 18px; color: #64748b;">لا توجد مركبات مسجلة في هذا الكشف.</td></tr>`:t.map((e,t)=>`
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
  `;e({title:`كشف حصر وجرد أسطول الآليات والمركبات الرسمي`,subtitle:`تاريخ الحصر: ${new Date().toLocaleDateString(`ar-LY`)} | إجمالي المركبات: ${t.length}`,department:`إدارة النقليات والآليات`,docType:`كشف حصر أسطول الآليات`,documentNumber:`VEH-SUM-${Date.now().toString().slice(-6)}`,orientation:`landscape`,contentHtml:s+c})}function o({logs:t=[],filtersSummary:n=``}){let r=`
    ${n?`<div class="filter-summary-box"><strong>معايير التصفية المطبقة:</strong> ${n}</div>`:``}
    <div class="form-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 16px; background: #f8fafc;">
      <div class="form-row"><span class="form-label">إجمالي العمليات:</span><span class="form-value">${t.length} عملية</span></div>
      <div class="form-row"><span class="form-label">تاريخ التقرير:</span><span class="form-value">${new Date().toLocaleDateString(`ar-LY`)}</span></div>
      <div class="form-row"><span class="form-label">مستوى التوثيق:</span><span class="form-value" style="color: #2563eb;">تدقيق شامل وموثق</span></div>
    </div>
  `,i=`
    <div class="section-title">بيان سجل التدقيق والأنشطة الإدارية والعملياتية</div>
    <table class="gov-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">#</th>
          <th>التوقيت والتاريخ</th>
          <th>المستخدم القائم بالإجراء</th>
          <th>نوع العملية</th>
          <th>الكيان المستهدف</th>
          <th>تفاصيل البيان</th>
          <th>عنوان IP</th>
        </tr>
      </thead>
      <tbody>
        ${t.length===0?`<tr><td colspan="7" style="text-align: center; padding: 18px; color: #64748b;">لا توجد سجلات تدقيق مطابقة لمعايير البحث والتصفية.</td></tr>`:t.map((e,t)=>`
        <tr>
          <td style="text-align: center; font-weight: 700;">${t+1}</td>
          <td>${e.timestamp?new Date(e.timestamp).toLocaleString(`ar-LY`):`—`}</td>
          <td style="font-weight: 700; color: #0f172a;">${e.actor_name||e.actor_username||`مستخدم النظام`}</td>
          <td>${e.action_display||e.action||`—`}</td>
          <td>${e.target_type_display||e.target_type||`—`}</td>
          <td>${e.description||e.notes||`—`}</td>
          <td class="font-mono text-micro">${e.ip_address||`—`}</td>
        </tr>
      `).join(``)}
      </tbody>
    </table>
  `;e({title:`سجل التدقيق وتوثيق الأنشطة والعمليات الرسمي`,subtitle:`تقرير حصر التدقيق والأنشطة الرقمية | إجمالي السجلات: ${t.length}`,department:`شعبة الرقابة والتدقيق الداخلي`,docType:`تقرير تدقيق ومطابقة أنشطة`,documentNumber:`AUDIT-${Date.now().toString().slice(-6)}`,orientation:`landscape`,contentHtml:r+i})}function s({members:t=[],filtersSummary:n=``}){let r=`
    ${n?`<div class="filter-summary-box"><strong>معايير التصفية المطبقة:</strong> ${n}</div>`:``}
    <div class="form-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 16px; background: #f8fafc;">
      <div class="form-row"><span class="form-label">إجمالي الأفراد:</span><span class="form-value">${t.length} فرد</span></div>
      <div class="form-row"><span class="form-label">تاريخ الحصر:</span><span class="form-value">${new Date().toLocaleDateString(`ar-LY`)}</span></div>
      <div class="form-row"><span class="form-label">حالة القيد:</span><span class="form-value" style="color: #16a34a;">كشف رسمي معتمد</span></div>
    </div>
  `,i=`
    <div class="section-title">بيان أفراد القوة والبيانات العسكرية والتنظيمية</div>
    <table class="gov-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">#</th>
          <th>الرقم العسكري</th>
          <th>الاسم الكامل</th>
          <th>الرتبة</th>
          <th>الفصيل / الإدارة</th>
          <th>الرقم الوطني</th>
          <th>رقم الهاتف</th>
        </tr>
      </thead>
      <tbody>
        ${t.length===0?`<tr><td colspan="7" style="text-align: center; padding: 18px; color: #64748b;">لا توجد سجلات أفراد مطابقة لخيارات التصفية.</td></tr>`:t.map((e,t)=>`
        <tr>
          <td style="text-align: center; font-weight: 700;">${t+1}</td>
          <td class="font-mono" style="font-weight: 700;">${e.force_number||`—`}</td>
          <td style="font-weight: 700; color: #0f172a;">${e.full_name||`—`}</td>
          <td>${e.rank_name||`عضو`}</td>
          <td>${e.faction_name||`عام`}</td>
          <td class="font-mono">${e.national_number||`—`}</td>
          <td>${e.phone_number||`—`}</td>
        </tr>
      `).join(``)}
      </tbody>
    </table>
  `;e({title:`كشف حصر وبيانات أفراد القوة الرسمية`,subtitle:`كشف حصر أفراد القوة والمنتسبين | إجمالي الأفراد: ${t.length}`,department:`شعبة شؤون الأفراد والضباط`,docType:`كشف حصر قوة عسكرية`,documentNumber:`MEM-SUM-${Date.now().toString().slice(-6)}`,orientation:`landscape`,contentHtml:r+i})}export{s as a,i,o as n,r as o,n as r,a as s,t};