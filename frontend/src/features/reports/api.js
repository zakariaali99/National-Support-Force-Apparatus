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

/** Fetches the composed PDF as an authenticated blob and opens it in a new
 * tab — keeps the JWT out of the window URL, browser history, and server logs.
 */
export async function openAuthedPdf(url) {
  const { data } = await api.get(url, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
  const newWindow = window.open(blobUrl, "_blank");
  if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
    showToast("تعذر فتح المستند — يرجى السماح بالنوافذ المنبثقة", "error");
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
}

export async function downloadAuthedFile(url, filename) {
  const { data } = await api.get(url, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
}
