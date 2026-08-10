import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

export function useReportSections() {
  return useQuery({
    queryKey: ["report-sections"],
    queryFn: async () => (await api.get("reports/sections/")).data,
  });
}

/** Fetches the composed PDF as an authenticated blob and opens it in a new
 * tab — a plain <a href> can't send the JWT header (see PLAN.md's
 * "Print auth" note), so this is the only way to open a print/export
 * result while the deploy is still cross-origin dev / not yet
 * single-origin.
 */
export async function openAuthedPdf(url) {
  const { data } = await api.get(url, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(data);
  window.open(blobUrl, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}

export async function downloadAuthedFile(url, filename) {
  const { data } = await api.get(url, { responseType: "blob" });
  const blobUrl = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
}
