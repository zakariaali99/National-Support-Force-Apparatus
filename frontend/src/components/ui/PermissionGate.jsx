import { useAuth } from "../../features/auth/AuthContext";

/** Render-prop wrapper over hasPermission(). Keeps permission checks in one
 *  place instead of inline `hasPermission(...) && ...` sprinkled through pages,
 *  so a rewrite can't silently drop a gate.
 */
export function PermissionGate({ permission, children, fallback = null }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(permission)) return fallback;
  return children;
}