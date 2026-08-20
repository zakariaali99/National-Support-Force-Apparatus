import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { api } from "../../lib/api";
import { tokenStorage } from "../../lib/tokenStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const { data } = await api.get("auth/me/");
    setUser(data);
    try {
      localStorage.setItem("nsfa_current_user", JSON.stringify(data));
    } catch {}
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!tokenStorage.getAccess()) {
        setIsLoading(false);
        return;
      }
      try {
        await fetchMe();
      } catch {
        tokenStorage.clear();
        try {
          localStorage.removeItem("nsfa_current_user");
        } catch {}
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();

    // Raised by the axios interceptor (lib/api.js) when a refresh attempt
    // fails — the session is dead, drop the user out immediately rather
    // than waiting for the next request to notice.
    const onUnauthorized = () => {
      setUser(null);
      try {
        localStorage.removeItem("nsfa_current_user");
      } catch {}
    };
    window.addEventListener("nsfa:unauthorized", onUnauthorized);
    return () => {
      cancelled = true;
      window.removeEventListener("nsfa:unauthorized", onUnauthorized);
    };
  }, [fetchMe]);

  const login = useCallback(
    async (username, password) => {
      const { data } = await api.post("auth/login/", { username, password });
      tokenStorage.setTokens(data);
      await fetchMe();
    },
    [fetchMe]
  );

  const logout = useCallback(async () => {
    const refresh = tokenStorage.getRefresh();
    tokenStorage.clear();
    try {
      localStorage.removeItem("nsfa_current_user");
    } catch {}
    setUser(null);
    if (refresh) {
      // Best-effort — the user is logged out client-side regardless of
      // whether the blacklist call succeeds.
      api.post("auth/logout/", { refresh }).catch(() => {});
    }
  }, []);

  const hasPermission = useCallback(
    (codename) => {
      if (!user) return false;
      if (user.is_superuser) return true;
      if (Array.isArray(codename)) {
        return codename.some((cn) => user.permissions?.includes(cn));
      }
      return Boolean(user.permissions?.includes(codename));
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
      hasPermission,
    }),
    [user, isLoading, login, logout, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
