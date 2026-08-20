import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { printAuthedHtml } from "../../lib/printUtils";
import { showToast } from "../../components/ui/Toast";

export function useReportSections() {
  return useQuery({
    queryKey: ["report-sections"],
    queryFn: async () => (await api.get("reports/sections/")).data,
  });
}

export { printAuthedHtml };

/** Opens the document in an authenticated new tab for native browser printing & PDF saving. */
export async function openAuthedPdf(url) {
  const cleanUrl = url.replace(/^\/?api\//, "");
  const separator = cleanUrl.includes("?") ? "&" : "?";
  const htmlUrl = cleanUrl.includes("html=") ? cleanUrl : `${cleanUrl}${separator}html=1`;
  printAuthedHtml(htmlUrl);
}

export async function downloadAuthedFile(url, filename) {
  try {
    const cleanUrl = url.replace(/^\/?api\//, "");
    const res = await api.get(cleanUrl, { responseType: "blob" });
    const contentType = res.headers["content-type"] || "";

    // If server returned HTML (due to fallback or html flag), open print preview window
    if (contentType.includes("text/html") || (res.data && res.data.type === "text/html")) {
      const text = await res.data.text();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(text);
        printWindow.document.close();
      }
      return;
    }

    const isExcel = filename.endsWith(".xlsx") || filename.endsWith(".csv");
    const blobType = contentType || (isExcel ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "application/pdf");
    const blobUrl = URL.createObjectURL(new Blob([res.data], { type: blobType }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
  } catch (err) {
    console.warn("downloadAuthedFile falling back:", err);
    if (!filename.endsWith(".xlsx") && !filename.endsWith(".csv")) {
      printAuthedHtml(url);
    } else {
      showToast("تعذر تنزيل الملف — حاول مرة أخرى", "error");
    }
  }
}
