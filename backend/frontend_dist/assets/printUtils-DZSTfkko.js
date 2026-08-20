import{t as e}from"./api-DVjQ8yrN.js";import{H as t,it as n}from"./index-CLSP145X.js";function r(t){let r=window.open(``,`_blank`);r&&r.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <title>جاري تحضير كشف الطباعة...</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Cairo', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #0a2540; }
          .loader { text-align: center; }
          .spinner { width: 36px; height: 36px; border: 3px solid #cbd5e1; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="loader">
          <div class="spinner"></div>
          <div>جاري معالجة وتجهيز كشف الطباعة الرسمي...</div>
        </div>
      </body>
      </html>
    `);let i=t.replace(/^\/?api\//,``),a=i.includes(`?`)?`&`:`?`,o=i.includes(`html=`)?i:`${i}${a}html=1`;e.get(o,{responseType:`text`}).then(({data:e})=>{if(r&&!r.closed)r.document.open(),r.document.write(e),r.document.close();else{let t=URL.createObjectURL(new Blob([e],{type:`text/html;charset=utf-8`}));window.open(t,`_blank`)}}).catch(e=>{r&&!r.closed&&r.close(),console.error(`Print error:`,e),n(`تعذر فتح كشف الطباعة — حاول مرة أخرى`,`error`)})}function i({title:e,subtitle:n,department:r=`إدارة الشؤون الإدارية والعهد`,docType:i=`كشف رسمي معتمد`,documentNumber:a,orientation:o=`portrait`,contentHtml:s,showSignatures:c=!0}){let l=o===`landscape`,u=l?1200:920,d=l?850:1080,f=window.open(``,`_blank`,`width=${u},height=${d},menubar=no,toolbar=no,location=no,status=no`);if(!f){alert(`يرجى السماح بالنوافذ المنبثقة (Popups) لعرض وطباعة المستند في نافذة مستقلة.`);return}let p=new Date().toLocaleDateString(`ar-LY`,{year:`numeric`,month:`long`,day:`numeric`}),m=new Date().toLocaleTimeString(`ar-LY`,{hour:`2-digit`,minute:`2-digit`}),h=a||`NASF-${Math.floor(1e5+Math.random()*9e5)}`,g=`<!DOCTYPE html>
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
      padding-bottom: 50px;
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
      width: ${l?`297mm`:`210mm`};
      min-height: ${l?`188mm`:`272mm`};
      margin: 20px auto;
      background: #ffffff;
      padding: ${l?`10mm 12mm`:`12mm 14mm`};
      box-shadow: 0 0 20px rgba(0,0,0,0.08);
      border-radius: 4px;
      position: relative;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }

    .doc-content-wrapper {
      flex: 1 0 auto;
      width: 100%;
    }

    .bottom-endorsement-block {
      margin-top: auto;
      flex-shrink: 0;
      width: 100%;
      break-inside: avoid;
      page-break-inside: avoid;
      padding-top: 14px;
    }

    /* Official Government Header layout */
    .gov-header-container {
      margin-bottom: 16px;
    }
    .gov-header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
    }
    .gov-title-group h1 {
      font-size: 16px;
      font-weight: 800;
      color: #0a2540;
      line-height: 1.3;
    }
    .gov-title-group h2 {
      font-size: 13px;
      font-weight: 700;
      color: #0a2540;
      margin-top: 2px;
    }
    .gov-logo {
      height: 58px;
      width: auto;
      object-fit: contain;
    }
    .gov-header-line {
      border-bottom: 2px solid #0a2540;
      margin-bottom: 8px;
    }
    .gov-header-metadata {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      font-weight: 700;
      color: #334155;
      padding-bottom: 6px;
    }

    /* Document Title Banner */
    .doc-banner {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 16px;
      text-align: center;
      margin-bottom: 16px;
    }
    .doc-banner h3 {
      font-size: 15px;
      font-weight: 800;
      color: #0a2540;
    }
    .doc-banner p {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }

    /* Form Fields Grid System */
    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #0a2540;
      border-right: 4px solid #0a2540;
      padding-right: 8px;
      margin-bottom: 8px;
      margin-top: 14px;
    }
    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 16px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 14px;
    }
    .form-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }
    .form-label {
      font-weight: 700;
      color: #64748b;
      min-width: 110px;
      font-size: 11.5px;
    }
    .form-value {
      font-weight: 700;
      color: #0f172a;
      font-size: 12px;
    }
    .font-mono {
      font-family: monospace;
    }

    /* High-density Government Data Table */
    table.gov-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 14px;
    }
    table.gov-table th {
      background: #f1f5f9;
      color: #0a2540;
      font-weight: 700;
      padding: 7px 10px;
      border: 1px solid #cbd5e1;
      text-align: start;
    }
    table.gov-table td {
      padding: 6px 10px;
      border: 1px solid #cbd5e1;
      color: #1e293b;
      text-align: start;
      vertical-align: middle;
    }
    table.gov-table tr:nth-child(even) td {
      background-color: #fafafa;
    }

    /* Signatures Section */
    .signatures-block {
      margin-top: 0;
      margin-bottom: 8px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      text-align: center;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .sig-box {
      border: 1px dashed #94a3b8;
      border-radius: 6px;
      padding: 8px 8px 20px;
      background: #fafafa;
      min-height: 80px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sig-title {
      font-size: 11.5px;
      font-weight: 800;
      color: #0a2540;
      margin-bottom: 4px;
    }
    .sig-sub {
      font-size: 10px;
      color: #64748b;
    }

    /* Consistent Bottom Footer */
    .gov-print-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #64748b;
      flex-shrink: 0;
      break-inside: avoid;
    }

    /* Print Styles */
    @media print {
      body {
        background: #ffffff;
        padding-bottom: 0;
      }
      .screen-toolbar {
        display: none !important;
      }
      .document-page {
        margin: 0;
        padding: 0;
        box-shadow: none;
        width: 100%;
        min-height: ${l?`188mm`:`272mm`};
        display: flex;
        flex-direction: column;
      }
      .doc-content-wrapper {
        flex: 1 0 auto;
      }
      .bottom-endorsement-block {
        margin-top: auto;
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .gov-print-footer {
        position: relative;
        bottom: auto;
        left: auto;
        right: auto;
        margin-top: 6px;
      }
      @page {
        size: ${l?`A4 landscape`:`A4 portrait`};
        margin: ${l?`8mm 10mm`:`10mm 12mm`};
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
    <!-- Header Container -->
    <div class="gov-header-container">
      <div class="gov-header-top">
        <div class="gov-title-group">
          <h1>دولة ليبيا</h1>
          <h2>الجهاز الوطني للقوى المساندة / الوحدة القتالية الرابعة</h2>
        </div>
        <img class="gov-logo" src="${t}" alt="شعار الجهاز" onerror="this.src='/nasf-seal.jpg'" />
      </div>
      <div class="gov-header-line"></div>
      <div class="gov-header-metadata">
        <span>الإدارة التابعة: ${r}</span>
        <span>الرقم المرجعي للمستند: ${h}</span>
      </div>
    </div>

    <!-- Title Banner -->
    <div class="doc-banner">
      <h3>${e}</h3>
      ${n?`<p>${n}</p>`:``}
    </div>

    <!-- Main Content Form Body -->
    <div class="doc-content-wrapper">
      ${s}
    </div>

    <!-- Bottom Endorsement & Signatures Pinned Block -->
    <div class="bottom-endorsement-block">
      ${c?`
        <div class="signatures-block">
          <div class="sig-box">
            <p class="sig-title">مسؤول السجل والعهدة</p>
            <p class="sig-sub">الاسم: .......................................</p>
            <p class="sig-sub" style="margin-top: 14px;">التوقيع: .................................</p>
          </div>
          <div class="sig-box">
            <p class="sig-title">الضابط المفوّض / رئيس شعبة الشؤون الإدارية</p>
            <p class="sig-sub">الاسم: .......................................</p>
            <p class="sig-sub" style="margin-top: 14px;">التوقيع: .................................</p>
          </div>
          <div class="sig-box" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 80px;">
            <p class="sig-title" style="color: #64748b; font-size: 12px;">الختم الرسمي المعتمد</p>
            <p class="sig-sub" style="margin-top: 4px; font-weight: 700; color: #0a2540;">(يعتمد / آمر القوة)</p>
          </div>
        </div>
      `:``}

      <!-- Consistent Footer -->
      <div class="gov-print-footer">
        <span>تاريخ الطباعة: ${p}</span>
        <span>توقيت الإصدار: ${m}</span>
      </div>
    </div>
  </div>
</body>
</html>`;f.document.open(),f.document.write(g),f.document.close()}function a({item:e={},domain:t=`inventory`,type:n,history:r=[]}){let a=t===`armory`||n===`weapon`||!!(e.serial_number||e.caliber),o=a?`بطاقة صنف سلاح وتجهيز تسليحي: ${e.name||`صنف تسليحي`}`:`بطاقة صنف ومواصفات مستودعية: ${e.name||`صنف مستودعي`}`,s=a?`إدارة التسليح والذخائر`:`المستودع والمخازن العامة`,c=a?`بطاقة صنف تسليحي`:`بطاقة صنف مخزني`,l=Array.isArray(r)&&r.length>0?`
    <div class="section-title">سجل الحركات والعمليات السابقة على الصنف</div>
    <table class="gov-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">#</th>
          <th>تاريخ العملية</th>
          <th>نوع الحركة</th>
          <th>الكمية</th>
          <th>المستلم / القائم بالإجراء</th>
          <th>البيان والملاحظات</th>
        </tr>
      </thead>
      <tbody>
        ${r.slice(0,15).map((e,t)=>`
          <tr>
            <td style="text-align: center; font-weight: 700;">${t+1}</td>
            <td>${e.created_at?new Date(e.created_at).toLocaleDateString(`ar-LY`):e.date||`—`}</td>
            <td style="font-weight: 700;">${e.action_display||e.action_type||e.action||`حركة مستودعية`}</td>
            <td style="text-align: center; font-weight: 700;">${e.quantity??1}</td>
            <td>${e.member_name||e.performed_by_name||`—`}</td>
            <td>${e.notes||e.description||`—`}</td>
          </tr>
        `).join(``)}
      </tbody>
    </table>
    `:``,u=`
    <div class="section-title">المواصفات الفنية والبيانات الأساسية</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">اسم الصنف:</span><span class="form-value">${e.name||`—`}</span></div>
      <div class="form-row"><span class="form-label">التصنيف:</span><span class="form-value">${e.category_name||`عام`}</span></div>
      <div class="form-row"><span class="form-label">${a?`العيار / المواصفة:`:`كود الصنف:`}</span><span class="form-value">${e.caliber||e.item_code||`—`}</span></div>
      <div class="form-row"><span class="form-label">الرقم التسلسلي:</span><span class="form-value font-mono">${e.serial_number||`غير محدد`}</span></div>
      <div class="form-row"><span class="form-label">بلد الصنع / المصنع:</span><span class="form-value">${e.manufacturer||`—`}</span></div>
      <div class="form-row"><span class="form-label">موقع التخزين / الجناح:</span><span class="form-value">${e.storage_location||`المستودع الرئيسي`}</span></div>
    </div>

    <div class="section-title">الأرصدة الحالية وحالة العهدة والتخزين</div>
    <div class="form-grid" style="grid-template-columns: repeat(4, 1fr);">
      <div class="form-row"><span class="form-label">إجمالي الرصيد:</span><span class="form-value font-mono" style="font-size: 14px; font-weight: 800;">${e.total_quantity??0}</span></div>
      <div class="form-row"><span class="form-label">المتاح بالمخزن:</span><span class="form-value font-mono" style="font-size: 14px; color: #16a34a; font-weight: 800;">${e.available_quantity??0}</span></div>
      <div class="form-row"><span class="form-label">المسلّم بعهدة:</span><span class="form-value font-mono" style="font-size: 14px; color: #2563eb; font-weight: 800;">${e.assigned_quantity??0}</span></div>
      <div class="form-row"><span class="form-label">التالف / المعطل:</span><span class="form-value font-mono" style="font-size: 14px; color: #dc2626; font-weight: 800;">${e.damaged_quantity??0}</span></div>
    </div>

    ${e.notes?`
      <div class="section-title">الملاحظات والتعليمات الفنية</div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #334155; margin-bottom: 16px;">
        ${e.notes}
      </div>
    `:``}

    ${l}
  `;i({title:o,subtitle:`كود الصنف: ${e.serial_number||e.item_code||`NASF-ITEM`} | الحالة العامة: ممتاز وجاهز للصرف`,department:s,docType:c,documentNumber:`CARD-${(e.id||Date.now().toString().slice(-5)).toString().padStart(5,`0`)}`,orientation:`portrait`,contentHtml:u})}function o({custody:e,custodyRecord:t,item:n={},member:r={},action:a=`صرف عهدة`,notes:o,voucherNumber:s}){let c=t||e||{},l=!!(n.serial_number||n.caliber||c.serial_number),u=`محضر ${a} رسمي معتمد`,d=l?`إدارة التسليح والذخائر`:`إدارة المستودعات والعهد العامة`,f=r?.full_name||c.member_name||c.recipient_name||`—`,p=r?.force_number||c.force_number||c.recipient_force_number||`—`,m=r?.rank_name||c.rank_name||c.recipient_rank||`عضو`,h=r?.faction_name||c.faction_name||c.recipient_faction||`عام`,g=r?.national_number||c.national_number||`—`,_=r?.phone_number||c.phone||c.phone_number||`—`,v=n?.name||c.item_name||`—`,y=c.quantity||e?.quantity||1,b=l?n.serial_number||c.serial_number||n.caliber||`—`:n.item_code||c.item_code||`—`,x=o||c.notes||e?.notes||n?.notes||``,S=`
    <div class="section-title">بيانات المستلم / صاحب العهدة</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">اسم المستلم:</span><span class="form-value">${f}</span></div>
      <div class="form-row"><span class="form-label">الرقم العسكري:</span><span class="form-value font-mono">${p}</span></div>
      <div class="form-row"><span class="form-label">الرتبة العسكرية:</span><span class="form-value">${m}</span></div>
      <div class="form-row"><span class="form-label">الإدارة / الفصيل:</span><span class="form-value">${h}</span></div>
      <div class="form-row"><span class="form-label">الرقم الوطني:</span><span class="form-value font-mono">${g}</span></div>
      <div class="form-row"><span class="form-label">رقم الهاتف:</span><span class="form-value font-mono">${_}</span></div>
    </div>

    <div class="section-title">بيانات الصنف أو السلاح المسلّم</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">الصنف المسلّم:</span><span class="form-value">${v}</span></div>
      <div class="form-row"><span class="form-label">الكمية المسلّمة:</span><span class="form-value font-mono" style="font-weight: 800;">${y} قطعة</span></div>
      <div class="form-row"><span class="form-label">${l?`الرقم التسلسلي (Serial):`:`كود القطعة:`}</span><span class="form-value font-mono">${b}</span></div>
      <div class="form-row"><span class="form-label">الحالة عند التسليم:</span><span class="form-value" style="color: #16a34a;">ممتازة وجاهزة للاستخدام</span></div>
    </div>

    ${x?`
    <div class="section-title">ملاحظات وبيان التكليف والصرف</div>
    <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 12px 16px; border-radius: 8px; font-size: 11.5px; line-height: 1.6; color: #1e293b; margin-bottom: 16px;">
      <strong style="color: #0a2540;">ملاحظات الصرف والتكليف: </strong>${x}
    </div>
    `:``}

    <div class="section-title">إقرار وتعهد الاستلام</div>
    <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 14px 18px; border-radius: 8px; font-size: 11.5px; line-height: 1.7; color: #1e293b; margin-bottom: 20px;">
      أقر أنا المذكور بياناتي أعلاه بأنني قد استلمت العهدة الموضحة تفاصيلها بهذا المحضر، وهي بحالة فنية ممتازة وصالحة للاستعمال، وأتعهد بالمحافظة التامة عليها واستخدامها وفق الأوامر والتعليمات العسكرية المعمول بها، وتحمل المسؤولية القانونية والإدارية الكاملة في حال فقدانها أو إتلافها أو إهمالها.
    </div>
  `;i({title:u,subtitle:`رقم إذن الصرف: ${s||c.id||`VCH-001`} | تاريخ التسليم: ${new Date().toLocaleDateString(`ar-LY`)}`,department:d,docType:`محضر تسليم واستلام عهدة`,documentNumber:s||`VOUCHER-${c.id||Date.now().toString().slice(-5)}`,orientation:`portrait`,contentHtml:S})}function s({vehicle:e={},trip:t={},tripNumber:n,notes:r}){let a=e.name||`الآلية والمركبة`,o=n||t.id||`TRIP-${Date.now().toString().slice(-5)}`,s=r||t.notes||e.notes||``,c=`
    <div class="section-title">بيانات الآلية والمركبة</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">المركبة والطراز:</span><span class="form-value">${a}</span></div>
      <div class="form-row"><span class="form-label">رقم اللوحة:</span><span class="form-value font-mono">${e.plate_number||`بدون لوحة`}</span></div>
      <div class="form-row"><span class="form-label">رقم الهيكل (VIN):</span><span class="form-value font-mono">${e.vin_number||`—`}</span></div>
      <div class="form-row"><span class="form-label">التبعية:</span><span class="form-value">${e.affiliation_type===`external`?e.external_unit_name||`جهة خارجية`:e.faction_name||`عام`}</span></div>
      <div class="form-row"><span class="form-label">قراءة العداد الحالية:</span><span class="form-value font-mono">${e.odometer_reading?`${e.odometer_reading} كم`:`—`}</span></div>
      <div class="form-row"><span class="form-label">التسليح المثبت:</span><span class="form-value">${e.has_weapon?e.mounted_weapon_name:`غير مسلحة`}</span></div>
    </div>

    <div class="section-title">بيانات السائق المكلف والمهمة</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">السائق المكلف:</span><span class="form-value">${e.driver_name||t.driver_name||e.assigned_driver_name||`—`}</span></div>
      <div class="form-row"><span class="form-label">وجهة التحرك:</span><span class="form-value">${t.destination||e.destination||`وفق خط السير المعتمد`}</span></div>
      <div class="form-row"><span class="form-label">تاريخ ووقت التحرك:</span><span class="form-value">${t.departure_time||new Date().toLocaleString(`ar-LY`)}</span></div>
      <div class="form-row"><span class="form-label">الغرض من التحرك:</span><span class="form-value">${t.purpose||e.purpose||`مهمة إدارية / عملياتية رسمية`}</span></div>
    </div>

    <div class="section-title">بيانات خط السير وقراءات العداد والعودة</div>
    <table class="gov-table">
      <thead>
        <tr>
          <th>نقطة الانطلاق</th>
          <th>الوجهة / خط السير</th>
          <th style="text-align: center;">عداد البداية (كم)</th>
          <th style="text-align: center;">عداد العودة (كم)</th>
          <th style="text-align: center;">ساعة الخروج</th>
          <th style="text-align: center;">ساعة الرجوع</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>مقر الجهاز الرئيسي</td>
          <td style="font-weight: 700; color: #1e40af;">${t.destination||e.destination||`وفق خط السير المعتمد`}</td>
          <td style="text-align: center; font-family: monospace; font-weight: 700;">${t.start_odometer||e.odometer_reading||`0`} كم</td>
          <td style="text-align: center; font-family: monospace; font-weight: 700; color: #047857;">${t.return_odometer?`${t.return_odometer} كم`:`..................... كم`}</td>
          <td style="text-align: center; font-family: monospace;">${t.departure_time||`........ : ........`}</td>
          <td style="text-align: center; font-family: monospace; font-weight: 700; color: #047857;">${t.return_time||`........ : ........`}</td>
        </tr>
      </tbody>
    </table>

    ${s?`
    <div class="section-title">ملاحظات ومأمورية التحرك والتكليف</div>
    <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 12px 16px; border-radius: 8px; font-size: 11.5px; line-height: 1.6; color: #1e293b; margin-bottom: 16px;">
      <strong style="color: #0a2540;">ملاحظات التكليف والمأمورية: </strong>${s}
    </div>
    `:``}

    <div class="section-title">تعليمات السير والانضباط</div>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; font-size: 11.5px; color: #475569; margin-bottom: 16px;">
      يُحظر استخدام المركبة في غير الأغراض المحددة بأمر التحرك، ويلتزم السائق بقواعد المرور والسرعات المحددة وفحص السوائل والإطارات قبل الانطلاق.
    </div>
  `;i({title:`أمر تحرك ومهمة مركبة آلية رسمي`,subtitle:`رقم أمر التحرك: ${o} | المركبة: ${a}`,department:`إدارة النقليات والآليات`,docType:`أمر تحرك رسمي`,documentNumber:o,orientation:`portrait`,contentHtml:c})}var c=s;function l({items:e=[],domain:t=`inventory`,filtersSummary:n=``}){let r=t===`armory`,a=r?`كشف حصر وجرد مستودع التسليح والأسلحة والذخائر الرسمي`:`كشف حصر وجرد المستودع والمخازن العامة الرسمي`,o=r?`إدارة التسليح والذخائر`:`المستودع والمخازن العامة`,s=r?`كشف حصر تسليحي`:`كشف جرد مستودع`,c=n?`<div class="filter-summary-box"><strong>معايير التصفية المطبقة:</strong> ${n}</div>`:``,l=e.length===0?`<tr><td colspan="8" style="text-align: center; padding: 18px; color: #64748b;">لا توجد أصناف مسجلة في هذا الكشف.</td></tr>`:e.map((e,t)=>`
        <tr>
          <td style="text-align: center; font-weight: 700;">${t+1}</td>
          <td style="font-weight: 700; color: #0f172a;">${e.name||`—`}</td>
          <td>${e.category_name||`عام`}</td>
          <td class="font-mono">${r?e.serial_number||e.caliber||`—`:e.item_code||`—`}</td>
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
          <th>${r?`الرقم التسلسلي / العيار`:`كود الصنف`}</th>
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
  `;i({title:a,subtitle:`تاريخ الجرد: ${new Date().toLocaleDateString(`ar-LY`)} | إجمالي الأصناف المشمولة: ${e.length}`,department:o,docType:s,documentNumber:`INV-SUM-${Date.now().toString().slice(-6)}`,orientation:r?`portrait`:`landscape`,contentHtml:c+u})}function u({vehicles:e=[],filtersSummary:t=``}){let n=t?`<div class="filter-summary-box"><strong>معايير التصفية المطبقة:</strong> ${t}</div>`:``,r=`
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
  `;i({title:`كشف حصر وجرد أسطول الآليات والمركبات الرسمي`,subtitle:`تاريخ الحصر: ${new Date().toLocaleDateString(`ar-LY`)} | إجمالي المركبات: ${e.length}`,department:`إدارة النقليات والآليات`,docType:`كشف حصر أسطول الآليات`,documentNumber:`VEH-SUM-${Date.now().toString().slice(-6)}`,orientation:`landscape`,contentHtml:n+r})}function d({logs:e=[],filtersSummary:t=``}){let n=t?`<div class="filter-summary-box"><strong>معايير التصفية المطبقة:</strong> ${t}</div>`:``,r=`
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
        ${e.length===0?`<tr><td colspan="7" style="text-align: center; padding: 18px; color: #64748b;">لا توجد سجلات تدقيق مطابقة لمعايير البحث والتصفية.</td></tr>`:e.map((e,t)=>`
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
  `;i({title:`سجل التدقيق وتوثيق الأنشطة والعمليات الرسمي`,subtitle:`تقرير حصر التدقيق والأنشطة الرقمية | إجمالي السجلات: ${e.length}`,department:`شعبة الرقابة والتدقيق الداخلي`,docType:`تقرير تدقيق ومطابقة أنشطة`,documentNumber:`AUDIT-${Date.now().toString().slice(-6)}`,orientation:`landscape`,contentHtml:n+r})}function f({members:e=[],filtersSummary:t=``}){let n=t?`<div class="filter-summary-box"><strong>معايير التصفية المطبقة:</strong> ${t}</div>`:``,r=`
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
        ${e.length===0?`<tr><td colspan="7" style="text-align: center; padding: 18px; color: #64748b;">لا توجد سجلات أفراد مطابقة لخيارات التصفية.</td></tr>`:e.map((e,t)=>`
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
  `;i({title:`كشف حصر وبيانات أفراد القوة الرسمية`,subtitle:`كشف حصر أفراد القوة والمنتسبين | إجمالي الأفراد: ${e.length}`,department:`شعبة شؤون الأفراد والضباط`,docType:`كشف حصر قوة عسكرية`,documentNumber:`MEM-SUM-${Date.now().toString().slice(-6)}`,orientation:`landscape`,contentHtml:n+r})}function p({member:e={}}){let t=`استمارة وبيانات قيد فرد: ${e.full_name||`عضو`}`,n=e.faction_name?`إدارة / ${e.faction_name}`:`شعبة شؤون الأفراد والضباط`,r=e.force_number||`—`,a=e.photo_url||e.photo||e.photo_thumb_url,o=`
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 14px 18px; margin-bottom: 18px;">
      <div style="width: 95px; height: 120px; border: 1.5px solid #0a2540; border-radius: 6px; background: #ffffff; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        ${a?`<img src="${a}" alt="صورة الفرد" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='<span style=\\'font-size: 10px; color: #94a3b8; font-weight: bold;\\'>صورة شخصية</span>'" />`:`<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 11px; font-weight: 700; color: #94a3b8; text-align: center; line-height: 1.4;">صورة الفرد<br>(غير متوفرة)</div>`}
      </div>
      <div style="flex: 1;">
        <h2 style="font-size: 17px; font-weight: 800; color: #0a2540; margin: 0 0 10px 0;">${e.full_name||`—`}</h2>
        <div class="form-grid" style="padding: 0; background: transparent; border: none; margin-bottom: 0; gap: 6px 14px;">
          <div class="form-row"><span class="form-label" style="min-width: 90px;">الرقم الحربي:</span><span class="form-value font-mono" style="font-weight: 800; color: #0a2540;">${r}</span></div>
          <div class="form-row"><span class="form-label" style="min-width: 90px;">الرتبة العسكرية:</span><span class="form-value" style="font-weight: 700; color: #2563eb;">${e.rank_name||`—`}</span></div>
          <div class="form-row"><span class="form-label" style="min-width: 90px;">الإدارة التابع لها:</span><span class="form-value">${e.faction_name||`—`}</span></div>
          <div class="form-row"><span class="form-label" style="min-width: 90px;">حالة الخدمة:</span><span class="form-value" style="color: #16a34a; font-weight: 700;">${e.service_status===`active`?`نشط / بالخدمة`:e.service_status||`نشط`}</span></div>
        </div>
      </div>
    </div>
  `,s=`
    <div class="section-title">البيانات الشخصية والسكنية</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">الرقم الوطني:</span><span class="form-value font-mono">${e.national_number||`—`}</span></div>
      <div class="form-row"><span class="form-label">رقم الهوية:</span><span class="form-value font-mono">${e.id_card_number||`—`}</span></div>
      <div class="form-row"><span class="form-label">رقم جواز السفر:</span><span class="form-value font-mono">${e.passport_number||`—`}</span></div>
      <div class="form-row"><span class="form-label">اسم الأم:</span><span class="form-value">${e.mother_name||`—`}</span></div>
      <div class="form-row"><span class="form-label">تاريخ الميلاد:</span><span class="form-value font-mono">${e.date_of_birth||`—`}</span></div>
      <div class="form-row"><span class="form-label">مكان الميلاد:</span><span class="form-value">${e.place_of_birth||`—`}</span></div>
      <div class="form-row"><span class="form-label">فصيلة الدم:</span><span class="form-value font-mono" style="font-weight: 800; color: #dc2626;">${e.blood_type||`—`}</span></div>
      <div class="form-row"><span class="form-label">رقم الهاتف:</span><span class="form-value font-mono">${e.phone||e.phone_number||`—`}</span></div>
      <div class="form-row"><span class="form-label">تاريخ الالتحاق:</span><span class="form-value font-mono">${e.join_date||`—`}</span></div>
      <div class="form-row"><span class="form-label">السكن الحالي:</span><span class="form-value">${e.current_residence||`—`}</span></div>
      <div class="form-row"><span class="form-label">أقرب نقطة دالة:</span><span class="form-value">${e.nearest_landmark||`—`}</span></div>
      <div class="form-row"><span class="form-label">حالة الاعتماد:</span><span class="form-value" style="font-weight: 700;">${e.approval_status===`approved`?`معتمد`:e.approval_status||`معتمد`}</span></div>
    </div>
  `,c=`
    <div class="section-title">التعهدات والالتزامات المسجلة</div>
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px 16px; border-radius: 8px; font-size: 11.5px; line-height: 1.7; color: #334155; margin-bottom: 16px;">
      ${e.pledges?e.pledges.replace(/\n/g,`<br>`):`لا توجد تعهدات خاصة مسجلة، ويلتزم الفرد بالواجبات واللوائح العسكرية المعمول بها بالجهاز.`}
    </div>
  `;i({title:t,subtitle:`الرقم الحربي: ${r} | الرتبة: ${e.rank_name||`—`} | الإدارة: ${e.faction_name||`—`}`,department:n,docType:`استمارة قيد وبيانات فرد`,documentNumber:r,orientation:`portrait`,contentHtml:o+s+c})}export{l as a,c,o as i,u as l,d as n,p as o,r,f as s,a as t};