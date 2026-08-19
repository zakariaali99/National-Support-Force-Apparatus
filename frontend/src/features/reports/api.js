import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { tokenStorage } from "../../lib/tokenStorage";
import { printAuthedHtml } from "../../lib/printUtils";

export function useReportSections() {
  return useQuery({
    queryKey: ["report-sections"],
    queryFn: async () => (await api.get("reports/sections/")).data,
  });
}

function appendAuthToken(url) {
  const token = tokenStorage.getAccess();
  if (!token) return url;
  const separator = url.includes("?") ? "&" : "?";
  if (url.includes("token=")) return url;
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

export { printAuthedHtml };

/** Fetches the composed PDF as an authenticated blob and opens it in a new
 * tab — also passes JWT query parameter for robust cross-origin opening.
 */
export async function openAuthedPdf(url) {
  const authedUrl = appendAuthToken(url);
  const { data } = await api.get(authedUrl, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
  const newWindow = window.open(blobUrl, "_blank");
  if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
    // Popup was blocked — fallback to direct authenticated window navigation
    window.open(`/api/${authedUrl.replace(/^\/?api\//, "")}`, "_blank");
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
}

export async function downloadAuthedFile(url, filename) {
  const authedUrl = appendAuthToken(url);
  const { data } = await api.get(authedUrl, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(new Blob([data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
}
