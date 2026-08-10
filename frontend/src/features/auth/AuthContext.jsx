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
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();

    // Raised by the axios interceptor (lib/api.js) when a refresh attempt
    // fails — the session is dead, drop the user out immediately rather
    // than waiting for the next request to notice.
    const onUnauthorized = () => setUser(null);
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
    setUser(null);
    if (refresh) {
      // Best-effort — the user is logged out client-side regardless of
      // whether the blacklist call succeeds.
      api.post("auth/logout/", { refresh }).catch(() => {});
    }
  }, []);

  const hasPermission = useCallback(
    (codename) => Boolean(user?.is_superuser || user?.permissions?.includes(codename)),
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
