import {
  createContext, useContext, useEffect, useState, useCallback, type ReactNode,
} from "react";
import { supabase } from "../supabase";
import type { Module, Action } from "./types";

interface PermissionsCtx {
  hasPermission:  (module: Module | string, action: Action | string) => boolean;
  canViewField:   (resource: string, field: string) => boolean;
  canEditField:   (resource: string, field: string) => boolean;
  userRoles:      string[];
  userClinics:    string[];
  isLoading:      boolean;
  isSuper:        boolean;
  reload:         () => void;
}

const Ctx = createContext<PermissionsCtx>({
  hasPermission: () => false,
  canViewField:  () => true,
  canEditField:  () => false,
  userRoles:     [],
  userClinics:   [],
  isLoading:     true,
  isSuper:       false,
  reload:        () => {},
});

export function PermissionProvider({ children }: { children: ReactNode }) {
  const [perms,      setPerms]      = useState<Record<string, boolean>>({});
  const [fields,     setFields]     = useState<Record<string, { can_view: boolean; can_edit: boolean }>>({});
  const [userRoles,  setUserRoles]  = useState<string[]>([]);
  const [userClinics,setUserClinics]= useState<string[]>([]);
  const [isLoading,  setIsLoading]  = useState(true);
  const [isSuper,    setIsSuper]    = useState(false);
  const [tick,       setTick]       = useState(0);

  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) { setIsLoading(false); return; }

      // User roles
      const { data: urRows } = await supabase
        .from("user_roles")
        .select("role_id, roles(name)")
        .eq("user_id", user.id);

      const roleNames: string[] = (urRows ?? [])
        .map((r: any) => r.roles?.name)
        .filter(Boolean);
      if (!cancelled) { setUserRoles(roleNames); setIsSuper(roleNames.includes("Super Admin")); }

      // User clinics
      const { data: ucRows } = await supabase
        .from("user_clinics")
        .select("clinic_id")
        .eq("user_id", user.id);
      if (!cancelled) setUserClinics((ucRows ?? []).map((r: any) => r.clinic_id));

      const roleIds = (urRows ?? []).map((r: any) => r.role_id).filter(Boolean);
      if (!roleIds.length) { setIsLoading(false); return; }

      // Module-action permissions
      const { data: rpRows } = await supabase
        .from("role_permissions")
        .select("allowed, permissions(module, action)")
        .in("role_id", roleIds)
        .eq("allowed", true);

      const permMap: Record<string, boolean> = {};
      (rpRows ?? []).forEach((rp: any) => {
        if (rp.permissions)
          permMap[`${rp.permissions.module}:${rp.permissions.action}`] = true;
      });
      if (!cancelled) setPerms(permMap);

      // Field-level permissions (union across roles)
      const { data: fpRows } = await supabase
        .from("field_permissions")
        .select("resource, field_name, can_view, can_edit")
        .in("role_id", roleIds);

      const fieldMap: Record<string, { can_view: boolean; can_edit: boolean }> = {};
      (fpRows ?? []).forEach((fp: any) => {
        const key = `${fp.resource}:${fp.field_name}`;
        if (!fieldMap[key]) fieldMap[key] = { can_view: false, can_edit: false };
        if (fp.can_view) fieldMap[key].can_view = true;
        if (fp.can_edit) fieldMap[key].can_edit = true;
      });
      if (!cancelled) setFields(fieldMap);

      if (!cancelled) setIsLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [tick]);

  const hasPermission = useCallback((module: string, action: string) => {
    if (isSuper) return true;
    return !!perms[`${module}:${action}`];
  }, [perms, isSuper]);

  const canViewField = useCallback((resource: string, field: string) => {
    if (isSuper) return true;
    // Default allow if no restriction row exists
    return fields[`${resource}:${field}`]?.can_view ?? true;
  }, [fields, isSuper]);

  const canEditField = useCallback((resource: string, field: string) => {
    if (isSuper) return true;
    return fields[`${resource}:${field}`]?.can_edit ?? false;
  }, [fields, isSuper]);

  return (
    <Ctx.Provider value={{ hasPermission, canViewField, canEditField, userRoles, userClinics, isLoading, isSuper, reload }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePermissions() {
  return useContext(Ctx);
}
