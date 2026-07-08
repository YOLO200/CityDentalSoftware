/**
 * Permission gate components.
 *
 * Usage examples:
 *
 *   // Hide entire button if no permission
 *   <PermissionGate module="patients" action="create">
 *     <button>Add Patient</button>
 *   </PermissionGate>
 *
 *   // Mask a sensitive field
 *   <FieldGate resource="patients" field="view_mobile">
 *     {(canView) => canView ? patient.phone : "••••••••••"}
 *   </FieldGate>
 *
 *   // Protect a route (wrap inside your router element)
 *   <PermissionRoute module="settings" action="view" />
 */

import { Navigate } from "react-router";
import { usePermissions } from "./hooks";
import type { Module, Action } from "./types";

// ── PermissionGate ─────────────────────────────────────────────
// Renders children only when the current user has the given permission.
// When `fallback` is provided it renders that instead.
export function PermissionGate({
  module, action, children, fallback = null,
}: {
  module:   Module | string;
  action:   Action | string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { hasPermission, isLoading } = usePermissions();
  if (isLoading) return null;
  return hasPermission(module, action) ? <>{children}</> : <>{fallback}</>;
}

// ── FieldGate ──────────────────────────────────────────────────
// Render prop gate for field-level visibility.
// Children is a function that receives { canView, canEdit }.
export function FieldGate({
  resource, field, children,
}: {
  resource: string;
  field:    string;
  children: (caps: { canView: boolean; canEdit: boolean }) => React.ReactNode;
}) {
  const { canViewField, canEditField, isLoading } = usePermissions();
  if (isLoading) return null;
  return <>{children({ canView: canViewField(resource, field), canEdit: canEditField(resource, field) })}</>;
}

// ── MaskedField ────────────────────────────────────────────────
// Simpler helper: shows value when user can view, "••••••" when not.
export function MaskedField({
  resource, field, value, mask = "••••••••••",
}: {
  resource: string;
  field:    string;
  value:    React.ReactNode;
  mask?:    string;
}) {
  const { canViewField } = usePermissions();
  return <>{canViewField(resource, field) ? value : <span className="text-gray-400 font-mono text-xs">{mask}</span>}</>;
}

// ── PermissionRoute ────────────────────────────────────────────
// Drop this element inside a React Router route to gate the entire page.
export function PermissionRoute({
  module, action, redirectTo = "/",
}: {
  module:     Module | string;
  action:     Action | string;
  redirectTo?: string;
}) {
  const { hasPermission, isLoading } = usePermissions();
  if (isLoading) return <div className="flex items-center justify-center h-full text-sm text-gray-400">Loading…</div>;
  if (!hasPermission(module, action)) return <Navigate to={redirectTo} replace />;
  return null;
}

// ── DisabledWrap ───────────────────────────────────────────────
// Wraps a button and disables + greys it out when permission is absent.
export function DisabledWrap({
  module, action, children,
}: {
  module:   Module | string;
  action:   Action | string;
  children: React.ReactElement;
}) {
  const { hasPermission } = usePermissions();
  if (!hasPermission(module, action)) {
    return (
      <span className="cursor-not-allowed opacity-40" title="You don't have permission for this action">
        {/* Clone child and force disabled */}
        {(() => {
          const el = children as React.ReactElement<{ disabled?: boolean; className?: string }>;
          return { ...el, props: { ...el.props, disabled: true } };
        })()}
      </span>
    );
  }
  return children;
}
