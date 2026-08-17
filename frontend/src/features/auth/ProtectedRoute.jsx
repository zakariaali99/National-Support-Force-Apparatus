import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { NAV_GROUPS } from "../../components/layout/navConfig";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        جارِ التحميل...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export function PermissionRoute({ permission, children }) {
  const { hasPermission, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-8 text-center text-caption text-muted-foreground">جارِ التحقق من الصلاحيات...</div>;
  }

  if (permission && !hasPermission(permission)) {
    const firstPermitted = NAV_GROUPS.flatMap((g) => g.items).find(
      (item) => item.to !== "/" && (!item.permission || hasPermission(item.permission))
    );
    if (firstPermitted && firstPermitted.to !== location.pathname) {
      return <Navigate to={firstPermitted.to} replace />;
    }
    return (
      <div className="p-8 text-center space-y-3 rounded-[28px] bg-white dark:bg-[#1A2038] border border-slate-200/80 dark:border-white/10 m-6 shadow-sm">
        <h3 className="text-title font-bold text-slate-900 dark:text-white">غير مصرح بالوصول</h3>
        <p className="text-caption text-slate-500">ليس لديك الصلاحيات الكافية للوصول إلى هذا القسم من المنظومة.</p>
      </div>
    );
  }

  return children ? children : <Outlet />;
}
