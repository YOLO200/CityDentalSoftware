/**
 * Pure access-control rules, kept apart from PermissionProvider so they can be
 * unit-tested without Supabase. The provider loads rows; these decide.
 */

export type PermissionMap = Record<string, boolean>;
export type FieldMap = Record<string, { can_view: boolean; can_edit: boolean }>;

/** role_permissions rows (already filtered to allowed=true) → "module:action" set. */
export function buildPermissionMap(
  rows: { permissions: { module: string; action: string } | null }[] | null,
): PermissionMap {
  const map: PermissionMap = {};
  for (const rp of rows ?? []) {
    if (rp.permissions) map[`${rp.permissions.module}:${rp.permissions.action}`] = true;
  }
  return map;
}

/**
 * field_permissions rows across all of a user's roles → one entry per field.
 * Union: if any role may view (or edit) a field, the user may.
 */
export function mergeFieldPermissions(
  rows: { resource: string; field_name: string; can_view: boolean; can_edit: boolean }[] | null,
): FieldMap {
  const map: FieldMap = {};
  for (const fp of rows ?? []) {
    const key = `${fp.resource}:${fp.field_name}`;
    map[key] ??= { can_view: false, can_edit: false };
    if (fp.can_view) map[key].can_view = true;
    if (fp.can_edit) map[key].can_edit = true;
  }
  return map;
}

export function checkPermission(perms: PermissionMap, isSuper: boolean, module: string, action: string): boolean {
  if (isSuper) return true;
  return !!perms[`${module}:${action}`];
}

/** Viewing defaults to ALLOWED when no restriction row exists for the field. */
export function checkFieldView(fields: FieldMap, isSuper: boolean, resource: string, field: string): boolean {
  if (isSuper) return true;
  return fields[`${resource}:${field}`]?.can_view ?? true;
}

/** Editing defaults to DENIED when no row exists — the opposite of viewing. */
export function checkFieldEdit(fields: FieldMap, isSuper: boolean, resource: string, field: string): boolean {
  if (isSuper) return true;
  return fields[`${resource}:${field}`]?.can_edit ?? false;
}
