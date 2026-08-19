/**
 * Unified Government Print Engine
 * Official Header: دولة ليبيا — الجهاز الوطني للقوى المساندة / الوحدة القتالية الرابعة
 * Consistent Metadata: (الإدارة، نوع المستند، الرقم المرجعي التلقائي، تاريخ الطباعة، وتوقيت الإصدار)
 * Supports Portrait and Landscape orientations, with consistent signatures and page styling.
 */

export function openPrintWindow({
  title,
  subtitle,
  department = "إدارة الشؤون الإدارية والعهد",
  docType = "كشف رسمي معتمد",
  documentNumber,
  orientation = "portrait",
  contentHtml,
  showSignatures = true,
}) {
  const isLandscape = orientation === "landscape";
  const windowWidth = isLandscape ? 1200 : 920;
  const windowHeight = isLandscape ? 850 : 1080;

  const printWindow = window.open(
    "",
    "_blank",
    `width=${windowWidth},height=${windowHeight},menubar=no,toolbar=no,location=no,status=no`
  );

  if (!printWindow) {
    alert("يرجى السماح بالنوافذ المنبثقة (Popups) لعرض وطباعة المستند في نافذة مستقلة.");
    return;
  }

  const currentDate = new Date().toLocaleDateString("ar-LY", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const currentTime = new Date().toLocaleTimeString("ar-LY", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const docNum = documentNumber || `NASF-${Math.floor(100000 + Math.random() * 900000)}`;

  const fullHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${title || "مستند رسمي - الجهاز الوطني للقوى المساندة"}</title>
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
      width: ${isLandscape ? "297mm" : "210mm"};
      min-height: ${isLandscape ? "210mm" : "297mm"};
      margin: 24px auto;
      background: #ffffff;
      padding: ${isLandscape ? "14mm 16mm" : "18mm 18mm"};
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
        padding: ${isLandscape ? "6mm 8mm" : "8mm 10mm"};
        box-shadow: none;
        width: 100%;
        min-height: auto;
      }
      @page {
        size: ${isLandscape ? "A4 landscape" : "A4 portrait"};
        margin: ${isLandscape ? "8mm" : "10mm"};
      }
    }
  </style>
</head>
<body>
  <div class="screen-toolbar">
    <div class="title">
      <span>📄</span>
      <span>${title || "معاينة الطباعة الرسمية"}</span>
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
        <div><strong>الإدارة:</strong> ${department}</div>
        <div><strong>نوع المستند:</strong> ${docType}</div>
        <div><strong>الرقم المرجعي:</strong> ${docNum}</div>
        <div><strong>تاريخ الطباعة:</strong> ${currentDate}</div>
        <div style="grid-column: span 2;"><strong>توقيت الإصدار:</strong> ${currentTime}</div>
      </div>
    </div>

    <!-- Title Banner -->
    <div class="doc-banner">
      <h3>${title}</h3>
      ${subtitle ? `<p>${subtitle}</p>` : ""}
    </div>

    <!-- Main Content Form Body -->
    ${contentHtml}

    <!-- Signatures Endorsement -->
    ${
      showSignatures
        ? `
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
    `
        : ""
    }
  </div>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();
}

/**
 * Formats Asset (Weapon, Vehicle, or Inventory) into an official printable document.
 */
export function printAssetCardInNewWindow({ item, history = [], type = "weapon" }) {
  if (!item) return;

  const docTitle =
    type === "weapon"
      ? `بطاقة حصر وسجل تاريخ الحيازة للقطعة التسليحية: ${item.name || ""}`
      : type === "vehicle"
      ? `بطاقة تسجيل وسلسلة عهدة الآلية: ${item.name || ""}`
      : `بطاقة صنف مخزني وسجل صرف العهدة: ${item.name || ""}`;

  const docSubtitle =
    type === "weapon"
      ? `الرقم التسلسلي: ${item.serial_number || "—"} | العيار: ${item.caliber || "—"}`
      : type === "vehicle"
      ? `رقم الهيكل: ${item.vin_number || "—"} | رقم اللوحة: ${item.plate_number || "—"}`
      : `كود الصنف: ${item.item_code || "—"} | التصنيف: ${item.category_name || "—"}`;

  const department =
    type === "weapon"
      ? "إدارة التسليح والذخائر"
      : type === "vehicle"
      ? "إدارة النقليات والآليات"
      : "المستودع والمخازن العامة";

  const docType =
    type === "weapon"
      ? "بطاقة أصل وسجل حيازة تسليحية"
      : type === "vehicle"
      ? "بطاقة آلية وسلسلة عهدة"
      : "بطاقة صنف ومحضر حيازة";

  // Build specifications form grid
  let specsHtml = "";
  if (type === "weapon") {
    specsHtml = `
      <div class="section-title">أولاً: البيانات الفنية والتسليحية للقطعة</div>
      <div class="form-grid">
        <div class="form-row"><span class="form-label">اسم السلاح / العتاد:</span><span class="form-value">${item.name || "—"}</span></div>
        <div class="form-row"><span class="form-label">التصنيف التسليحي:</span><span class="form-value">${item.category_name || "—"}</span></div>
        <div class="form-row"><span class="form-label">الرقم التسلسلي المنقوش:</span><span class="form-value font-mono">${item.serial_number || "—"}</span></div>
        <div class="form-row"><span class="form-label">العيار الباليستي:</span><span class="form-value">${item.caliber || "—"}</span></div>
        <div class="form-row"><span class="form-label">الموديل / بلد الصنع:</span><span class="form-value">${item.model_name || "—"}</span></div>
        <div class="form-row"><span class="form-label">الحالة الفنية للقطعة:</span><span class="form-value">${item.status_display || item.status || "صالح للخدمة"}</span></div>
        <div class="form-row"><span class="form-label">الكمية الإجمالية:</span><span class="form-value">${item.total_quantity || 1}</span></div>
        <div class="form-row"><span class="form-label">المتوفر في الخزينة:</span><span class="form-value">${item.available_quantity ?? 1}</span></div>
        <div class="form-row" style="grid-column: span 2;"><span class="form-label">موقع الحفظ والملاحظات:</span><span class="form-value">${item.notes || "مسجل بخزينة الأسلحة الرئيسية"}</span></div>
      </div>
    `;
  } else if (type === "vehicle") {
    specsHtml = `
      <div class="section-title">أولاً: البيانات الفنية والمواصفات الرسمية للمركبة</div>
      <div class="form-grid">
        <div class="form-row"><span class="form-label">اسم وطراز المركبة:</span><span class="form-value">${item.name || "—"}</span></div>
        <div class="form-row"><span class="form-label">نوع المركبة:</span><span class="form-value">${item.vehicle_type_display || item.vehicle_type || "—"}</span></div>
        <div class="form-row"><span class="form-label">رقم الهيكل (VIN):</span><span class="form-value font-mono">${item.vin_number || "—"}</span></div>
        <div class="form-row"><span class="form-label">رقم اللوحة المعدنية:</span><span class="form-value">${item.plate_number || "—"}</span></div>
        <div class="form-row"><span class="form-label">سنة الصنع والموديل:</span><span class="form-value">${item.model_year || "—"}</span></div>
        <div class="form-row"><span class="form-label">اللون:</span><span class="form-value">${item.color || "—"}</span></div>
        <div class="form-row"><span class="form-label">نوع التبعية:</span><span class="form-value">${item.affiliation_type === "external" ? `جهة خارجية (${item.external_unit_name || "—"})` : `وحدة داخلية (${item.faction_name || "—"})`}</span></div>
        <div class="form-row"><span class="form-label">حالة التشغيل:</span><span class="form-value">${item.status_display || item.status || "جاهزة للعمليات"}</span></div>
        <div class="form-row"><span class="form-label">السائق المسند إليه:</span><span class="form-value">${item.driver_name ? `${item.driver_name} (${item.driver_force_number || ""})` : "غير مسند لسائق حالياً"}</span></div>
        <div class="form-row"><span class="form-label">السلاح المثبت:</span><span class="form-value">${item.has_weapon ? `${item.mounted_weapon_name || "سلاح مثبت"} (رقم: ${item.mounted_weapon_serial || "—"})` : "بدون سلاح مثبت"}</span></div>
      </div>
    `;
  } else {
    specsHtml = `
      <div class="section-title">أولاً: البيانات الفنية والمخزنية للصنف</div>
      <div class="form-grid">
        <div class="form-row"><span class="form-label">اسم الصنف:</span><span class="form-value">${item.name || "—"}</span></div>
        <div class="form-row"><span class="form-label">التصنيف العام:</span><span class="form-value">${item.category_name || "—"}</span></div>
        <div class="form-row"><span class="form-label">كود الصنف / الباركود:</span><span class="form-value font-mono">${item.item_code || "—"}</span></div>
        <div class="form-row"><span class="form-label">وحدة القياس / العبوة:</span><span class="form-value">${item.unit || "قطعة"}</span></div>
        <div class="form-row"><span class="form-label">إجمالي الرصيد:</span><span class="form-value">${item.total_quantity || 0}</span></div>
        <div class="form-row"><span class="form-label">المتوفر بالمخزن:</span><span class="form-value">${item.available_quantity ?? item.total_quantity ?? 0}</span></div>
        <div class="form-row"><span class="form-label">المسلّم كعهدة:</span><span class="form-value">${(item.total_quantity || 0) - (item.available_quantity || 0)}</span></div>
        <div class="form-row"><span class="form-label">حالة الصنف:</span><span class="form-value">${item.status_display || item.status || "صالح للاستخدام"}</span></div>
        <div class="form-row" style="grid-column: span 2;"><span class="form-label">ملاحظات ومكان التخزين:</span><span class="form-value">${item.notes || "مسجل بالمستودع المركزي"}</span></div>
      </div>
    `;
  }

  // Build History Table
  let historyHtml = `
    <div class="section-title">ثانياً: سجل سلسلة الحيازة والتنقلات والعهد الرسمية</div>
  `;

  if (!history || history.length === 0) {
    historyHtml += `
      <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; text-align: center; color: #64748b; font-size: 12px; margin-bottom: 20px;">
        لا توجد سجلات حيازة أو تنقلات سابقة مسجلة على هذا الأصل حتى تاريخه.
      </div>
    `;
  } else {
    historyHtml += `
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
          ${history
            .map(
              (rec, index) => `
            <tr>
              <td style="text-align: center; font-weight: 700;">${index + 1}</td>
              <td>${rec.action_date || rec.created_at ? new Date(rec.action_date || rec.created_at).toLocaleDateString("ar-LY") : "—"}</td>
              <td style="font-weight: 700;">${rec.action_display || rec.action || "تسليم عهدة"}</td>
              <td>${rec.member_name || rec.driver_name || rec.driver || "—"}</td>
              <td>${rec.force_number || rec.external_unit_name || rec.faction_name || "—"}</td>
              <td>${rec.issued_by_name || rec.issued_by || "مسؤول المنظومة"}</td>
              <td>${rec.notes || "—"}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  }

  const contentHtml = specsHtml + historyHtml;

  openPrintWindow({
    title: docTitle,
    subtitle: docSubtitle,
    department,
    docType,
    documentNumber: `CARD-${item.id}-${Date.now().toString().slice(-4)}`,
    orientation: "portrait",
    contentHtml,
  });
}

/**
 * Formats Custody Handover Voucher into official printable document in new window.
 */
export function printCustodyVoucherInNewWindow({ item, custodyRecord, voucherNumber }) {
  const recipientName = custodyRecord?.member_name || "الفرد المستلم للعهدة";
  const recipientForceNumber = custodyRecord?.force_number || "—";
  const recipientRank = custodyRecord?.rank_name || "عضو بالقوة";
  const recipientFaction = custodyRecord?.faction_name || "الإدارة العامة";

  const itemName = item?.name || custodyRecord?.item_name || "صنف عسكري / مهمات";
  const itemCode = item?.code || custodyRecord?.item_code || "—";
  const itemSerial = item?.serial_number || custodyRecord?.serial_number || "—";
  const itemCategory = item?.category_name || "مهمات وعتاد";
  const quantity = custodyRecord?.quantity || 1;

  const contentHtml = `
    <div class="section-title">أولاً: بيانات الطرف المستلم للعهدة</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">اسم المستلم الكامل:</span><span class="form-value">${recipientName}</span></div>
      <div class="form-row"><span class="form-label">الرقم العسكري:</span><span class="form-value font-mono">${recipientForceNumber}</span></div>
      <div class="form-row"><span class="form-label">الرتبة العسكرية:</span><span class="form-value">${recipientRank}</span></div>
      <div class="form-row"><span class="form-label">الوحدة / الفصيل:</span><span class="form-value">${recipientFaction}</span></div>
    </div>

    <div class="section-title">ثانياً: تفاصيل الصنف المسلّم كعهدة رسمية</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">اسم الصنف / العتاد:</span><span class="form-value">${itemName}</span></div>
      <div class="form-row"><span class="form-label">التصنيف:</span><span class="form-value">${itemCategory}</span></div>
      <div class="form-row"><span class="form-label">كود الصنف:</span><span class="form-value font-mono">${itemCode}</span></div>
      <div class="form-row"><span class="form-label">الرقم التسلسلي:</span><span class="form-value font-mono">${itemSerial}</span></div>
      <div class="form-row"><span class="form-label">الكمية المسلمة:</span><span class="form-value">${quantity}</span></div>
      <div class="form-row"><span class="form-label">تاريخ التسليم:</span><span class="form-value">${new Date().toLocaleDateString("ar-LY")}</span></div>
      <div class="form-row" style="grid-column: span 2;"><span class="form-label">إقرار الاستلام:</span><span class="form-value">أقر أنا المستلم أعلاه بأنني استلمت الصنف الموضح بكامل حالته الفنية وأتعهد بالمحافظة عليه وفق اللوائح المعمول بها.</span></div>
    </div>
  `;

  openPrintWindow({
    title: "محضر تسليم واستلام عهدة ومهمات عسكرية رسمية",
    subtitle: `رقم المحضر: ${voucherNumber || "VOUCH-" + Date.now().toString().slice(-6)}`,
    department: "إدارة التسليح والمهمات والعهد",
    docType: "محضر تسليم واستلام عهدة",
    documentNumber: voucherNumber,
    orientation: "portrait",
    contentHtml,
  });
}

/**
 * Formats Vehicle Trip Voucher into official printable document in new window.
 */
export function printVehicleTripVoucherInNewWindow({ vehicle, tripNumber }) {
  if (!vehicle) return;

  const contentHtml = `
    <div class="section-title">أولاً: بيانات الآلية / المركبة المأمورة</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">اسم وطراز المركبة:</span><span class="form-value">${vehicle.name || "—"}</span></div>
      <div class="form-row"><span class="form-label">رقم اللوحة المعدنية:</span><span class="form-value font-mono">${vehicle.plate_number || "—"}</span></div>
      <div class="form-row"><span class="form-label">رقم الهيكل (VIN):</span><span class="form-value font-mono">${vehicle.vin_number || "—"}</span></div>
      <div class="form-row"><span class="form-label">نوع التبعية:</span><span class="form-value">${vehicle.affiliation_type === "external" ? `جهة خارجية (${vehicle.external_unit_name || "—"})` : `فصيل داخلي (${vehicle.faction_name || "—"})`}</span></div>
      <div class="form-row"><span class="form-label">السائق المكلّف:</span><span class="form-value">${vehicle.driver_name || "غير محدد"}</span></div>
      <div class="form-row"><span class="form-label">الرقم العسكري للسائق:</span><span class="form-value font-mono">${vehicle.driver_force_number || "—"}</span></div>
      <div class="form-row" style="grid-column: span 2;"><span class="form-label">السلاح والتجهيز:</span><span class="form-value">${vehicle.has_weapon ? `${vehicle.mounted_weapon_name || "سلاح مثبت"} (رقم: ${vehicle.mounted_weapon_serial || "—"})` : "بدون تسليح مثبت"}</span></div>
    </div>

    <div class="section-title">ثانياً: خط السير والتكليف العملياتي</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">نقطة الانطلاق:</span><span class="form-value">المقر الرئيسي / معسكر القوة</span></div>
      <div class="form-row"><span class="form-label">الوجهة والمهمة:</span><span class="form-value">مأمورية عملياتية وتأمين رسمي</span></div>
      <div class="form-row"><span class="form-label">تاريخ وتوقيت الانطلاق:</span><span class="form-value">${new Date().toLocaleDateString("ar-LY")}</span></div>
      <div class="form-row"><span class="form-label">مدة الإذن:</span><span class="form-value">24 ساعة من تاريخ وساعة الإصدار</span></div>
    </div>
  `;

  openPrintWindow({
    title: "أمر تحرك ومأمورية آلية عسكرية رسمية",
    subtitle: `إذن تحرك رسمي صادر للمركبة: ${vehicle.name} (لوحة: ${vehicle.plate_number || "—"})`,
    department: "شعبة النقليات والحركة",
    docType: "أمر تحرك وبطاقة تشغيل",
    documentNumber: tripNumber || `TRIP-${Date.now().toString().slice(-6)}`,
    orientation: "portrait",
    contentHtml,
  });
}

/**
 * Formats full Inventory or Armory stocktaking summary table into official printable document.
 */
export function printInventorySummaryInNewWindow({ items = [], domain = "inventory", filtersSummary = "" }) {
  const isArmory = domain === "armory";
  const docTitle = isArmory
    ? "كشف حصر وجرد مستودع التسليح والأسلحة والذخائر الرسمي"
    : "كشف حصر وجرد المستودع والمخازن العامة الرسمي";

  const department = isArmory ? "إدارة التسليح والذخائر" : "المستودع والمخازن العامة";
  const docType = isArmory ? "كشف حصر تسليحي" : "كشف جرد مستودع";

  let totalQty = 0;
  let availQty = 0;
  let assignQty = 0;
  let dmgQty = 0;

  items.forEach((it) => {
    totalQty += Number(it.total_quantity) || 0;
    availQty += Number(it.available_quantity) || 0;
    assignQty += Number(it.assigned_quantity) || 0;
    dmgQty += Number(it.damaged_quantity) || 0;
  });

  const filterBox = filtersSummary
    ? `<div class="filter-summary-box"><strong>معايير التصفية المطبقة:</strong> ${filtersSummary}</div>`
    : "";

  const statsHtml = `
    ${filterBox}
    <div class="form-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px; background: #f8fafc;">
      <div class="form-row"><span class="form-label">إجمالي الأصناف:</span><span class="form-value">${items.length} صنف</span></div>
      <div class="form-row"><span class="form-label">إجمالي الرصيد:</span><span class="form-value">${totalQty} قطعة</span></div>
      <div class="form-row"><span class="form-label">المتوفر بالمستودع:</span><span class="form-value" style="color: #16a34a;">${availQty}</span></div>
      <div class="form-row"><span class="form-label">المسلّم كعهدة:</span><span class="form-value" style="color: #2563eb;">${assignQty}</span></div>
    </div>
  `;

  const rowsHtml = items.length === 0
    ? `<tr><td colspan="8" style="text-align: center; padding: 18px; color: #64748b;">لا توجد أصناف مسجلة في هذا الكشف.</td></tr>`
    : items
        .map(
          (it, idx) => `
        <tr>
          <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
          <td style="font-weight: 700; color: #0f172a;">${it.name || "—"}</td>
          <td>${it.category_name || "عام"}</td>
          <td class="font-mono">${isArmory ? it.serial_number || it.caliber || "—" : it.item_code || "—"}</td>
          <td style="text-align: center; font-weight: 700; color: #16a34a;">${it.available_quantity ?? 0}</td>
          <td style="text-align: center; font-weight: 700; color: #2563eb;">${it.assigned_quantity ?? 0}</td>
          <td style="text-align: center; font-weight: 700; color: #dc2626;">${it.damaged_quantity ?? 0}</td>
          <td style="text-align: center; font-weight: 800;">${it.total_quantity ?? 0}</td>
        </tr>
      `
        )
        .join("");

  const tableHtml = `
    <div class="section-title">بيان الأصناف والكميات وحالة الأرصدة والعهد</div>
    <table class="gov-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align: center;">#</th>
          <th>اسم الصنف / القطعة</th>
          <th>التصنيف</th>
          <th>${isArmory ? "الرقم التسلسلي / العيار" : "كود الصنف"}</th>
          <th style="text-align: center;">المتوفر</th>
          <th style="text-align: center;">العهدة</th>
          <th style="text-align: center;">التالف</th>
          <th style="text-align: center;">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  openPrintWindow({
    title: docTitle,
    subtitle: `تاريخ الجرد: ${new Date().toLocaleDateString("ar-LY")} | إجمالي الأصناف المشمولة: ${items.length}`,
    department,
    docType,
    documentNumber: `INV-SUM-${Date.now().toString().slice(-6)}`,
    orientation: isArmory ? "portrait" : "landscape",
    contentHtml: statsHtml + tableHtml,
  });
}

/**
 * Formats full Vehicles fleet summary table into official printable document (Landscape).
 */
export function printVehiclesSummaryInNewWindow({ vehicles = [], filtersSummary = "" }) {
  const docTitle = "كشف حصر وجرد أسطول الآليات والمركبات الرسمي";

  const total = vehicles.length;
  const ready = vehicles.filter((v) => v.status === "ready").length;
  const external = vehicles.filter((v) => v.affiliation_type === "external" || Boolean(v.external_unit_name)).length;
  const withWeapon = vehicles.filter((v) => v.has_weapon).length;

  const filterBox = filtersSummary
    ? `<div class="filter-summary-box"><strong>معايير التصفية المطبقة:</strong> ${filtersSummary}</div>`
    : "";

  const statsHtml = `
    ${filterBox}
    <div class="form-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 16px; background: #f8fafc;">
      <div class="form-row"><span class="form-label">إجمالي الأسطول:</span><span class="form-value">${total} آلية</span></div>
      <div class="form-row"><span class="form-label">جاهزة للعمليات:</span><span class="form-value" style="color: #16a34a;">${ready}</span></div>
      <div class="form-row"><span class="form-label">تبعية خارجية:</span><span class="form-value" style="color: #7c3aed;">${external}</span></div>
      <div class="form-row"><span class="form-label">مركبات مسلحة:</span><span class="form-value" style="color: #d97706;">${withWeapon}</span></div>
    </div>
  `;

  const rowsHtml = vehicles.length === 0
    ? `<tr><td colspan="8" style="text-align: center; padding: 18px; color: #64748b;">لا توجد مركبات مسجلة في هذا الكشف.</td></tr>`
    : vehicles
        .map(
          (v, idx) => `
        <tr>
          <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
          <td style="font-weight: 700; color: #0f172a;">${v.name || "—"}</td>
          <td>${v.vehicle_type_display || v.vehicle_type || "—"}</td>
          <td class="font-mono">${v.vin_number || "—"}</td>
          <td style="font-weight: 700;">${v.plate_number || "—"}</td>
          <td>${v.affiliation_type === "external" ? v.external_unit_name || "جهة خارجية" : v.faction_name || "عام"}</td>
          <td>${v.driver_name || "المستودع الرئيسي"}</td>
          <td>${v.has_weapon ? v.mounted_weapon_name || "سلاح مثبت" : "بدون"}</td>
        </tr>
      `
        )
        .join("");

  const tableHtml = `
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
        ${rowsHtml}
      </tbody>
    </table>
  `;

  openPrintWindow({
    title: docTitle,
    subtitle: `تاريخ الحصر: ${new Date().toLocaleDateString("ar-LY")} | إجمالي المركبات: ${vehicles.length}`,
    department: "إدارة النقليات والآليات",
    docType: "كشف حصر أسطول الآليات",
    documentNumber: `VEH-SUM-${Date.now().toString().slice(-6)}`,
    orientation: "landscape",
    contentHtml: statsHtml + tableHtml,
  });
}

/**
 * Formats Audit Log records into official printable document (Landscape).
 */
export function printAuditLogsInNewWindow({ logs = [], filtersSummary = "" }) {
  const docTitle = "سجل التدقيق وتوثيق الأنشطة والعمليات الرسمي";

  const filterBox = filtersSummary
    ? `<div class="filter-summary-box"><strong>معايير التصفية المطبقة:</strong> ${filtersSummary}</div>`
    : "";

  const statsHtml = `
    ${filterBox}
    <div class="form-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 16px; background: #f8fafc;">
      <div class="form-row"><span class="form-label">إجمالي العمليات:</span><span class="form-value">${logs.length} عملية</span></div>
      <div class="form-row"><span class="form-label">تاريخ التقرير:</span><span class="form-value">${new Date().toLocaleDateString("ar-LY")}</span></div>
      <div class="form-row"><span class="form-label">مستوى التوثيق:</span><span class="form-value" style="color: #2563eb;">تدقيق شامل وموثق</span></div>
    </div>
  `;

  const rowsHtml = logs.length === 0
    ? `<tr><td colspan="7" style="text-align: center; padding: 18px; color: #64748b;">لا توجد سجلات تدقيق مطابقة لمعايير البحث والتصفية.</td></tr>`
    : logs
        .map(
          (log, idx) => `
        <tr>
          <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
          <td>${log.timestamp ? new Date(log.timestamp).toLocaleString("ar-LY") : "—"}</td>
          <td style="font-weight: 700; color: #0f172a;">${log.actor_name || log.actor_username || "مستخدم النظام"}</td>
          <td>${log.action_display || log.action || "—"}</td>
          <td>${log.target_type_display || log.target_type || "—"}</td>
          <td>${log.description || log.notes || "—"}</td>
          <td class="font-mono text-micro">${log.ip_address || "—"}</td>
        </tr>
      `
        )
        .join("");

  const tableHtml = `
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
        ${rowsHtml}
      </tbody>
    </table>
  `;

  openPrintWindow({
    title: docTitle,
    subtitle: `تقرير حصر التدقيق والأنشطة الرقمية | إجمالي السجلات: ${logs.length}`,
    department: "شعبة الرقابة والتدقيق الداخلي",
    docType: "تقرير تدقيق ومطابقة أنشطة",
    documentNumber: `AUDIT-${Date.now().toString().slice(-6)}`,
    orientation: "landscape",
    contentHtml: statsHtml + tableHtml,
  });
}

/**
 * Formats Members filtered roster into official printable document (Landscape).
 */
export function printMembersSummaryInNewWindow({ members = [], filtersSummary = "" }) {
  const docTitle = "كشف حصر وبيانات أفراد القوة الرسمية";

  const filterBox = filtersSummary
    ? `<div class="filter-summary-box"><strong>معايير التصفية المطبقة:</strong> ${filtersSummary}</div>`
    : "";

  const statsHtml = `
    ${filterBox}
    <div class="form-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 16px; background: #f8fafc;">
      <div class="form-row"><span class="form-label">إجمالي الأفراد:</span><span class="form-value">${members.length} فرد</span></div>
      <div class="form-row"><span class="form-label">تاريخ الحصر:</span><span class="form-value">${new Date().toLocaleDateString("ar-LY")}</span></div>
      <div class="form-row"><span class="form-label">حالة القيد:</span><span class="form-value" style="color: #16a34a;">كشف رسمي معتمد</span></div>
    </div>
  `;

  const rowsHtml = members.length === 0
    ? `<tr><td colspan="7" style="text-align: center; padding: 18px; color: #64748b;">لا توجد سجلات أفراد مطابقة لخيارات التصفية.</td></tr>`
    : members
        .map(
          (m, idx) => `
        <tr>
          <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
          <td class="font-mono" style="font-weight: 700;">${m.force_number || "—"}</td>
          <td style="font-weight: 700; color: #0f172a;">${m.full_name || "—"}</td>
          <td>${m.rank_name || "عضو"}</td>
          <td>${m.faction_name || "عام"}</td>
          <td class="font-mono">${m.national_number || "—"}</td>
          <td>${m.phone_number || "—"}</td>
        </tr>
      `
        )
        .join("");

  const tableHtml = `
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
        ${rowsHtml}
      </tbody>
    </table>
  `;

  openPrintWindow({
    title: docTitle,
    subtitle: `كشف حصر أفراد القوة والمنتسبين | إجمالي الأفراد: ${members.length}`,
    department: "شعبة شؤون الأفراد والضباط",
    docType: "كشف حصر قوة عسكرية",
    documentNumber: `MEM-SUM-${Date.now().toString().slice(-6)}`,
    orientation: "landscape",
    contentHtml: statsHtml + tableHtml,
  });
}
