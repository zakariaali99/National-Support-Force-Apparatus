// Deliberately plain localStorage rather than httpOnly cookies — this is
// an internal admin tool (not consumer-facing), and single-origin cookie
// auth is a documented future deploy step (see the Phase 1 plan) rather
// than a Phase 1 requirement. Centralized here so the interceptor in
// api.js and AuthContext never touch localStorage directly.
const ACCESS_KEY = "nsfa.accessToken";
const REFRESH_KEY = "nsfa.refreshToken";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setTokens: ({ access, refresh }) => {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
