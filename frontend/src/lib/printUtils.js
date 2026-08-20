import { api } from "./api";
import { showToast } from "../components/ui/Toast";

/**
 * Opens an authenticated print endpoint in a new window/tab for native browser
 * printing. The HTML is fetched with the Authorization header and rendered via
 * a blob URL — the JWT never appears in the window URL, browser history, or
 * server logs.
 */
export function printAuthedHtml(url) {
  // Open window synchronously in the user interaction event loop to bypass popup blockers
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(`
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
    `);
  }

  const cleanUrl = url.replace(/^\/?api\//, "");
  const separator = cleanUrl.includes("?") ? "&" : "?";
  const htmlUrl = cleanUrl.includes("html=") ? cleanUrl : `${cleanUrl}${separator}html=1`;

  api
    .get(htmlUrl, { responseType: "text" })
    .then(({ data }) => {
      if (printWindow && !printWindow.closed) {
        printWindow.document.open();
        printWindow.document.write(data);
        printWindow.document.close();
      } else {
        const blobUrl = URL.createObjectURL(new Blob([data], { type: "text/html;charset=utf-8" }));
        window.open(blobUrl, "_blank");
      }
    })
    .catch((err) => {
      if (printWindow && !printWindow.closed) {
        printWindow.close();
      }
      console.error("Print error:", err);
      showToast("تعذر فتح كشف الطباعة — حاول مرة أخرى", "error");
    });
}

/**
 * Unified Government Print Engine
 * Official Header: دولة ليبيا — الجهاز الوطني للقوى المساندة / الوحدة القتالية الرابعة
 * Consistent Metadata: (الإدارة التابعة على اليمين، الرقم المرجعي على اليسار تحت خط فاصل)
 * Consistent Footer: (تاريخ الطباعة، توقيت الإصدار، منظومة الإدارة الإلكترونية)
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
      width: ${isLandscape ? "297mm" : "210mm"};
      min-height: ${isLandscape ? "210mm" : "297mm"};
      margin: 24px auto;
      background: #ffffff;
      padding: ${isLandscape ? "14mm 16mm" : "18mm 18mm"};
      box-shadow: 0 0 20px rgba(0,0,0,0.08);
      border-radius: 4px;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .doc-content-wrapper {
      flex: 1 0 auto;
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
      padding: 10px 16px;
      text-align: center;
      margin-bottom: 16px;
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

    /* Consistent Bottom Footer */
    .gov-print-footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      color: #64748b;
      flex-shrink: 0;
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
        padding: ${isLandscape ? "6mm 8mm" : "8mm 10mm"};
        box-shadow: none;
        width: 100%;
        min-height: auto;
        display: block;
      }
      .gov-print-footer {
        position: fixed;
        bottom: 0;
        left: 10mm;
        right: 10mm;
        margin-top: 0;
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
    <!-- Header Container -->
    <div class="gov-header-container">
      <div class="gov-header-top">
        <div class="gov-title-group">
          <h1>دولة ليبيا</h1>
          <h2>الجهاز الوطني للقوى المساندة / الوحدة القتالية الرابعة</h2>
        </div>
        <img class="gov-logo" src="/static/nasf-seal.jpg" alt="شعار الجهاز" onerror="this.src='/src/assets/brand/nasf-seal.jpg'" />
      </div>
      <div class="gov-header-line"></div>
      <div class="gov-header-metadata">
        <span>الإدارة التابعة: ${department}</span>
        <span>الرقم المرجعي للمستند: ${docNum}</span>
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

    <!-- Consistent Footer -->
    <div class="gov-print-footer">
      <span>تاريخ الطباعة: ${currentDate}</span>
      <span>توقيت الإصدار: ${currentTime}</span>
      <span>الجهاز الوطني للقوى المساندة - منظومة الإدارة الإلكترونية</span>
    </div>
  </div>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();
}

/**
 * Formats Asset Card into official printable document.
 */
export function printAssetCardInNewWindow({ item = {}, domain = "inventory", type, history = [] }) {
  const isArmory = domain === "armory" || type === "weapon" || Boolean(item.serial_number || item.caliber);
  const docTitle = isArmory
    ? `بطاقة صنف سلاح وتجهيز تسليحي: ${item.name || "صنف تسليحي"}`
    : `بطاقة صنف ومواصفات مستودعية: ${item.name || "صنف مستودعي"}`;

  const department = isArmory ? "إدارة التسليح والذخائر" : "المستودع والمخازن العامة";
  const docType = isArmory ? "بطاقة صنف تسليحي" : "بطاقة صنف مخزني";

  const historyRowsHtml = Array.isArray(history) && history.length > 0
    ? `
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
        ${history.slice(0, 15).map((h, idx) => `
          <tr>
            <td style="text-align: center; font-weight: 700;">${idx + 1}</td>
            <td>${h.created_at ? new Date(h.created_at).toLocaleDateString("ar-LY") : h.date || "—"}</td>
            <td style="font-weight: 700;">${h.action_display || h.action_type || h.action || "حركة مستودعية"}</td>
            <td style="text-align: center; font-weight: 700;">${h.quantity ?? 1}</td>
            <td>${h.member_name || h.performed_by_name || "—"}</td>
            <td>${h.notes || h.description || "—"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
    `
    : "";

  const contentHtml = `
    <div class="section-title">المواصفات الفنية والبيانات الأساسية</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">اسم الصنف:</span><span class="form-value">${item.name || "—"}</span></div>
      <div class="form-row"><span class="form-label">التصنيف:</span><span class="form-value">${item.category_name || "عام"}</span></div>
      <div class="form-row"><span class="form-label">${isArmory ? "العيار / المواصفة:" : "كود الصنف:"}</span><span class="form-value">${item.caliber || item.item_code || "—"}</span></div>
      <div class="form-row"><span class="form-label">الرقم التسلسلي:</span><span class="form-value font-mono">${item.serial_number || "غير محدد"}</span></div>
      <div class="form-row"><span class="form-label">بلد الصنع / المصنع:</span><span class="form-value">${item.manufacturer || "—"}</span></div>
      <div class="form-row"><span class="form-label">موقع التخزين / الجناح:</span><span class="form-value">${item.storage_location || "المستودع الرئيسي"}</span></div>
    </div>

    <div class="section-title">الأرصدة الحالية وحالة العهدة والتخزين</div>
    <div class="form-grid" style="grid-template-columns: repeat(4, 1fr);">
      <div class="form-row"><span class="form-label">إجمالي الرصيد:</span><span class="form-value font-mono" style="font-size: 14px; font-weight: 800;">${item.total_quantity ?? 0}</span></div>
      <div class="form-row"><span class="form-label">المتاح بالمخزن:</span><span class="form-value font-mono" style="font-size: 14px; color: #16a34a; font-weight: 800;">${item.available_quantity ?? 0}</span></div>
      <div class="form-row"><span class="form-label">المسلّم بعهدة:</span><span class="form-value font-mono" style="font-size: 14px; color: #2563eb; font-weight: 800;">${item.assigned_quantity ?? 0}</span></div>
      <div class="form-row"><span class="form-label">التالف / المعطل:</span><span class="form-value font-mono" style="font-size: 14px; color: #dc2626; font-weight: 800;">${item.damaged_quantity ?? 0}</span></div>
    </div>

    ${
      item.notes
        ? `
      <div class="section-title">الملاحظات والتعليمات الفنية</div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; font-size: 12px; color: #334155; margin-bottom: 16px;">
        ${item.notes}
      </div>
    `
        : ""
    }

    ${historyRowsHtml}
  `;

  openPrintWindow({
    title: docTitle,
    subtitle: `كود الصنف: ${item.serial_number || item.item_code || "NASF-ITEM"} | الحالة العامة: ممتاز وجاهز للصرف`,
    department,
    docType,
    documentNumber: `CARD-${(item.id || Date.now().toString().slice(-5)).toString().padStart(5, "0")}`,
    orientation: "portrait",
    contentHtml,
  });
}

/**
 * Formats Custody Handover Voucher into official printable document.
 */
export function printCustodyVoucherInNewWindow({ custody, custodyRecord, item = {}, member = {}, action = "صرف عهدة", notes, voucherNumber }) {
  const rec = custodyRecord || custody || {};
  const isArmory = Boolean(item.serial_number || item.caliber || rec.serial_number);
  const docTitle = `محضر ${action} رسمي معتمد`;
  const department = isArmory ? "إدارة التسليح والذخائر" : "إدارة المستودعات والعهد العامة";
  const docType = "محضر تسليم واستلام عهدة";

  const memberName = member?.full_name || rec.member_name || rec.recipient_name || "—";
  const forceNumber = member?.force_number || rec.force_number || rec.recipient_force_number || "—";
  const rankName = member?.rank_name || rec.rank_name || rec.recipient_rank || "عضو";
  const factionName = member?.faction_name || rec.faction_name || rec.recipient_faction || "عام";
  const nationalNumber = member?.national_number || rec.national_number || "—";
  const phone = member?.phone_number || rec.phone || rec.phone_number || "—";

  const itemName = item?.name || rec.item_name || "—";
  const itemQty = rec.quantity || custody?.quantity || 1;
  const itemCodeOrSerial = isArmory
    ? (item.serial_number || rec.serial_number || item.caliber || "—")
    : (item.item_code || rec.item_code || "—");

  const effectiveNotes = notes || rec.notes || custody?.notes || item?.notes || "";

  const contentHtml = `
    <div class="section-title">بيانات المستلم / صاحب العهدة</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">اسم المستلم:</span><span class="form-value">${memberName}</span></div>
      <div class="form-row"><span class="form-label">الرقم العسكري:</span><span class="form-value font-mono">${forceNumber}</span></div>
      <div class="form-row"><span class="form-label">الرتبة العسكرية:</span><span class="form-value">${rankName}</span></div>
      <div class="form-row"><span class="form-label">الإدارة / الفصيل:</span><span class="form-value">${factionName}</span></div>
      <div class="form-row"><span class="form-label">الرقم الوطني:</span><span class="form-value font-mono">${nationalNumber}</span></div>
      <div class="form-row"><span class="form-label">رقم الهاتف:</span><span class="form-value font-mono">${phone}</span></div>
    </div>

    <div class="section-title">بيانات الصنف أو السلاح المسلّم</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">الصنف المسلّم:</span><span class="form-value">${itemName}</span></div>
      <div class="form-row"><span class="form-label">الكمية المسلّمة:</span><span class="form-value font-mono" style="font-weight: 800;">${itemQty} قطعة</span></div>
      <div class="form-row"><span class="form-label">${isArmory ? "الرقم التسلسلي (Serial):" : "كود القطعة:"}</span><span class="form-value font-mono">${itemCodeOrSerial}</span></div>
      <div class="form-row"><span class="form-label">الحالة عند التسليم:</span><span class="form-value" style="color: #16a34a;">ممتازة وجاهزة للاستخدام</span></div>
    </div>

    ${effectiveNotes ? `
    <div class="section-title">ملاحظات وبيان التكليف والصرف</div>
    <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 12px 16px; border-radius: 8px; font-size: 11.5px; line-height: 1.6; color: #1e293b; margin-bottom: 16px;">
      <strong style="color: #0a2540;">ملاحظات الصرف والتكليف: </strong>${effectiveNotes}
    </div>
    ` : ""}

    <div class="section-title">إقرار وتعهد الاستلام</div>
    <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 14px 18px; border-radius: 8px; font-size: 11.5px; line-height: 1.7; color: #1e293b; margin-bottom: 20px;">
      أقر أنا المذكور بياناتي أعلاه بأنني قد استلمت العهدة الموضحة تفاصيلها بهذا المحضر، وهي بحالة فنية ممتازة وصالحة للاستعمال، وأتعهد بالمحافظة التامة عليها واستخدامها وفق الأوامر والتعليمات العسكرية المعمول بها، وتحمل المسؤولية القانونية والإدارية الكاملة في حال فقدانها أو إتلافها أو إهمالها.
    </div>
  `;

  openPrintWindow({
    title: docTitle,
    subtitle: `رقم إذن الصرف: ${voucherNumber || rec.id || "VCH-001"} | تاريخ التسليم: ${new Date().toLocaleDateString("ar-LY")}`,
    department,
    docType,
    documentNumber: voucherNumber || `VOUCHER-${(rec.id || Date.now().toString().slice(-5))}`,
    orientation: "portrait",
    contentHtml,
  });
}

/**
 * Formats Vehicle Trip Ticket into official printable document.
 */
export function printTripTicketInNewWindow({ vehicle = {}, trip = {}, tripNumber, notes }) {
  const docTitle = "أمر تحرك ومهمة مركبة آلية رسمي";
  const department = "إدارة النقليات والآليات";
  const docType = "أمر تحرك رسمي";
  const vName = vehicle.name || "الآلية والمركبة";
  const tNum = tripNumber || trip.id || `TRIP-${Date.now().toString().slice(-5)}`;
  const effectiveNotes = notes || trip.notes || vehicle.notes || "";

  const contentHtml = `
    <div class="section-title">بيانات الآلية والمركبة</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">المركبة والطراز:</span><span class="form-value">${vName}</span></div>
      <div class="form-row"><span class="form-label">رقم اللوحة:</span><span class="form-value font-mono">${vehicle.plate_number || "بدون لوحة"}</span></div>
      <div class="form-row"><span class="form-label">رقم الهيكل (VIN):</span><span class="form-value font-mono">${vehicle.vin_number || "—"}</span></div>
      <div class="form-row"><span class="form-label">التبعية:</span><span class="form-value">${vehicle.affiliation_type === "external" ? vehicle.external_unit_name || "جهة خارجية" : vehicle.faction_name || "عام"}</span></div>
      <div class="form-row"><span class="form-label">قراءة العداد الحالية:</span><span class="form-value font-mono">${vehicle.odometer_reading ? `${vehicle.odometer_reading} كم` : "—"}</span></div>
      <div class="form-row"><span class="form-label">التسليح المثبت:</span><span class="form-value">${vehicle.has_weapon ? vehicle.mounted_weapon_name : "غير مسلحة"}</span></div>
    </div>

    <div class="section-title">بيانات السائق المكلف والمهمة</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">السائق المكلف:</span><span class="form-value">${vehicle.driver_name || trip.driver_name || vehicle.assigned_driver_name || "—"}</span></div>
      <div class="form-row"><span class="form-label">وجهة التحرك:</span><span class="form-value">${trip.destination || vehicle.destination || "وفق خط السير المعتمد"}</span></div>
      <div class="form-row"><span class="form-label">تاريخ ووقت التحرك:</span><span class="form-value">${trip.departure_time || new Date().toLocaleString("ar-LY")}</span></div>
      <div class="form-row"><span class="form-label">الغرض من التحرك:</span><span class="form-value">${trip.purpose || vehicle.purpose || "مهمة إدارية / عملياتية رسمية"}</span></div>
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
          <td style="font-weight: 700; color: #1e40af;">${trip.destination || vehicle.destination || "وفق خط السير المعتمد"}</td>
          <td style="text-align: center; font-family: monospace; font-weight: 700;">${trip.start_odometer || vehicle.odometer_reading || "0"} كم</td>
          <td style="text-align: center; font-family: monospace; font-weight: 700; color: #047857;">${trip.return_odometer ? `${trip.return_odometer} كم` : "..................... كم"}</td>
          <td style="text-align: center; font-family: monospace;">${trip.departure_time || "........ : ........"}</td>
          <td style="text-align: center; font-family: monospace; font-weight: 700; color: #047857;">${trip.return_time || "........ : ........"}</td>
        </tr>
      </tbody>
    </table>

    ${effectiveNotes ? `
    <div class="section-title">ملاحظات ومأمورية التحرك والتكليف</div>
    <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 12px 16px; border-radius: 8px; font-size: 11.5px; line-height: 1.6; color: #1e293b; margin-bottom: 16px;">
      <strong style="color: #0a2540;">ملاحظات التكليف والمأمورية: </strong>${effectiveNotes}
    </div>
    ` : ""}

    <div class="section-title">تعليمات السير والانضباط</div>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 16px; border-radius: 8px; font-size: 11.5px; color: #475569; margin-bottom: 16px;">
      يُحظر استخدام المركبة في غير الأغراض المحددة بأمر التحرك، ويلتزم السائق بقواعد المرور والسرعات المحددة وفحص السوائل والإطارات قبل الانطلاق.
    </div>
  `;

  openPrintWindow({
    title: docTitle,
    subtitle: `رقم أمر التحرك: ${tNum} | المركبة: ${vName}`,
    department,
    docType,
    documentNumber: tNum,
    orientation: "portrait",
    contentHtml,
  });
}

export const printVehicleTripVoucherInNewWindow = printTripTicketInNewWindow;

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

  const filterBox = filtersSummary
    ? `<div class="filter-summary-box"><strong>معايير التصفية المطبقة:</strong> ${filtersSummary}</div>`
    : "";

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
    contentHtml: filterBox + tableHtml,
  });
}

/**
 * Formats full Vehicles fleet summary table into official printable document (Landscape).
 */
export function printVehiclesSummaryInNewWindow({ vehicles = [], filtersSummary = "" }) {
  const docTitle = "كشف حصر وجرد أسطول الآليات والمركبات الرسمي";

  const filterBox = filtersSummary
    ? `<div class="filter-summary-box"><strong>معايير التصفية المطبقة:</strong> ${filtersSummary}</div>`
    : "";

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
    contentHtml: filterBox + tableHtml,
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
    contentHtml: filterBox + tableHtml,
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
    contentHtml: filterBox + tableHtml,
  });
}

/**
 * Formats Individual Member Profile into official printable document (Portrait).
 */
export function printMemberProfileInNewWindow({ member = {} }) {
  const docTitle = `استمارة وبيانات قيد فرد: ${member.full_name || "عضو"}`;
  const department = member.faction_name ? `إدارة / ${member.faction_name}` : "شعبة شؤون الأفراد والضباط";
  const docType = "استمارة قيد وبيانات فرد";
  const forceNumber = member.force_number || "—";
  const photoSrc = member.photo_url || member.photo || member.photo_thumb_url;

  const photoHtml = photoSrc
    ? `<img src="${photoSrc}" alt="صورة الفرد" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='<span style=\\'font-size: 10px; color: #94a3b8; font-weight: bold;\\'>صورة شخصية</span>'" />`
    : `<div style="display: flex; align-items: center; justify-content: center; height: 100%; font-size: 11px; font-weight: 700; color: #94a3b8; text-align: center; line-height: 1.4;">صورة الفرد<br>(غير متوفرة)</div>`;

  const topCardHtml = `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 14px 18px; margin-bottom: 18px;">
      <div style="width: 95px; height: 120px; border: 1.5px solid #0a2540; border-radius: 6px; background: #ffffff; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        ${photoHtml}
      </div>
      <div style="flex: 1;">
        <h2 style="font-size: 17px; font-weight: 800; color: #0a2540; margin: 0 0 10px 0;">${member.full_name || "—"}</h2>
        <div class="form-grid" style="padding: 0; background: transparent; border: none; margin-bottom: 0; gap: 6px 14px;">
          <div class="form-row"><span class="form-label" style="min-width: 90px;">الرقم الحربي:</span><span class="form-value font-mono" style="font-weight: 800; color: #0a2540;">${forceNumber}</span></div>
          <div class="form-row"><span class="form-label" style="min-width: 90px;">الرتبة العسكرية:</span><span class="form-value" style="font-weight: 700; color: #2563eb;">${member.rank_name || "—"}</span></div>
          <div class="form-row"><span class="form-label" style="min-width: 90px;">الإدارة التابع لها:</span><span class="form-value">${member.faction_name || "—"}</span></div>
          <div class="form-row"><span class="form-label" style="min-width: 90px;">حالة الخدمة:</span><span class="form-value" style="color: #16a34a; font-weight: 700;">${member.service_status === "active" ? "نشط / بالخدمة" : member.service_status || "نشط"}</span></div>
        </div>
      </div>
    </div>
  `;

  const personalDataHtml = `
    <div class="section-title">البيانات الشخصية والسكنية</div>
    <div class="form-grid">
      <div class="form-row"><span class="form-label">الرقم الوطني:</span><span class="form-value font-mono">${member.national_number || "—"}</span></div>
      <div class="form-row"><span class="form-label">رقم الهوية:</span><span class="form-value font-mono">${member.id_card_number || "—"}</span></div>
      <div class="form-row"><span class="form-label">رقم جواز السفر:</span><span class="form-value font-mono">${member.passport_number || "—"}</span></div>
      <div class="form-row"><span class="form-label">اسم الأم:</span><span class="form-value">${member.mother_name || "—"}</span></div>
      <div class="form-row"><span class="form-label">تاريخ الميلاد:</span><span class="form-value font-mono">${member.date_of_birth || "—"}</span></div>
      <div class="form-row"><span class="form-label">مكان الميلاد:</span><span class="form-value">${member.place_of_birth || "—"}</span></div>
      <div class="form-row"><span class="form-label">فصيلة الدم:</span><span class="form-value font-mono" style="font-weight: 800; color: #dc2626;">${member.blood_type || "—"}</span></div>
      <div class="form-row"><span class="form-label">رقم الهاتف:</span><span class="form-value font-mono">${member.phone || member.phone_number || "—"}</span></div>
      <div class="form-row"><span class="form-label">تاريخ الالتحاق:</span><span class="form-value font-mono">${member.join_date || "—"}</span></div>
      <div class="form-row"><span class="form-label">السكن الحالي:</span><span class="form-value">${member.current_residence || "—"}</span></div>
      <div class="form-row"><span class="form-label">أقرب نقطة دالة:</span><span class="form-value">${member.nearest_landmark || "—"}</span></div>
      <div class="form-row"><span class="form-label">حالة الاعتماد:</span><span class="form-value" style="font-weight: 700;">${member.approval_status === "approved" ? "معتمد" : member.approval_status || "معتمد"}</span></div>
    </div>
  `;

  const pledgesHtml = `
    <div class="section-title">التعهدات والالتزامات المسجلة</div>
    <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px 16px; border-radius: 8px; font-size: 11.5px; line-height: 1.7; color: #334155; margin-bottom: 16px;">
      ${member.pledges ? member.pledges.replace(/\n/g, "<br>") : "لا توجد تعهدات خاصة مسجلة، ويلتزم الفرد بالواجبات واللوائح العسكرية المعمول بها بالجهاز."}
    </div>
  `;

  openPrintWindow({
    title: docTitle,
    subtitle: `الرقم الحربي: ${forceNumber} | الرتبة: ${member.rank_name || "—"} | الإدارة: ${member.faction_name || "—"}`,
    department,
    docType,
    documentNumber: forceNumber,
    orientation: "portrait",
    contentHtml: topCardHtml + personalDataHtml + pledgesHtml,
  });
}
