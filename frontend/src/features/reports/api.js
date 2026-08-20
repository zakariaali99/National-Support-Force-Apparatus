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
  const isExcel = filename.endsWith(".xlsx") || filename.endsWith(".csv");
  if (!isExcel) {
    // For PDF and print documents, trigger the high-fidelity unified print engine immediately
    printAuthedHtml(url);
    return;
  }

  try {
    const cleanUrl = url.replace(/^\/?api\//, "");
    const res = await api.get(cleanUrl, { responseType: "blob" });
    const contentType = res.headers["content-type"] || "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const blobUrl = URL.createObjectURL(new Blob([res.data], { type: contentType }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
  } catch (err) {
    console.error("Download error:", err);
    showToast("تعذر تنزيل الملف — حاول مرة أخرى", "error");
  }
}
