import axios from "axios";

import { tokenStorage } from "./tokenStorage";

export const api = axios.create({ baseURL: "/api/" });

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Coalesces concurrent 401s into a single refresh call instead of firing
// one refresh request per failed request.
let refreshPromise = null;

function broadcastUnauthorized() {
  tokenStorage.clear();
  window.dispatchEvent(new Event("nsfa:unauthorized"));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (response?.status === 403) {
      const rawDetail = String(response.data?.detail || response.data?.message || "");
      let arabicMsg = "عفواً، لا يمتلك حسابك الحالي الصلاحية الأمنية الكافية لإتمام هذا الإجراء أو الوصول إلى هذا القسم.";
      if (rawDetail && !rawDetail.includes("permission") && !rawDetail.includes("credentials") && !rawDetail.includes("Authentication")) {
        arabicMsg = rawDetail;
      }
      window.dispatchEvent(
        new CustomEvent("nsfa:forbidden", {
          detail: { message: arabicMsg },
        })
      );
      return Promise.reject(error);
    }

    if (response?.status !== 401) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStorage.getRefresh();
    if (!refreshToken || config?._retried) {
      broadcastUnauthorized();
      return Promise.reject(error);
    }

    config._retried = true;
    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post("/api/auth/token/refresh/", { refresh: refreshToken })
          .then(({ data }) => {
            tokenStorage.setTokens({ access: data.access });
            return data.access;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const newAccess = await refreshPromise;
      config.headers.Authorization = `Bearer ${newAccess}`;
      return api(config);
    } catch (refreshError) {
      broadcastUnauthorized();
      return Promise.reject(refreshError);
    }
  }
);
