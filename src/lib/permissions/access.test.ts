import { describe, expect, it } from "vitest";
import {
  buildPermissionMap,
  checkFieldEdit,
  checkFieldView,
  checkPermission,
  mergeFieldPermissions,
} from "./access";

describe("module permissions", () => {
  it("grants only the module:action pairs a role holds, and skips orphaned rows", () => {
    const perms = buildPermissionMap([
      { permissions: { module: "patients", action: "view" } },
      { permissions: { module: "crm", action: "edit" } },
      { permissions: null }, // permission row deleted under the role
    ]);

    expect(checkPermission(perms, false, "patients", "view")).toBe(true);
    expect(checkPermission(perms, false, "crm", "edit")).toBe(true);
    expect(checkPermission(perms, false, "patients", "delete")).toBe(false);
    expect(checkPermission(perms, false, "settings", "view")).toBe(false);
  });

  it("lets a super admin through everything, even with no rows", () => {
    const perms = buildPermissionMap(null);
    expect(checkPermission(perms, true, "settings", "manage")).toBe(true);
    expect(checkPermission(perms, false, "settings", "manage")).toBe(false);
  });
});

describe("field permissions", () => {
  it("unions across roles: any role allowing a field allows it", () => {
    const fields = mergeFieldPermissions([
      { resource: "patients", field_name: "phone", can_view: false, can_edit: false }, // role A
      { resource: "patients", field_name: "phone", can_view: true, can_edit: false },  // role B
      { resource: "patients", field_name: "balance_due", can_view: true, can_edit: true },
    ]);

    expect(checkFieldView(fields, false, "patients", "phone")).toBe(true);
    expect(checkFieldEdit(fields, false, "patients", "phone")).toBe(false);
    expect(checkFieldEdit(fields, false, "patients", "balance_due")).toBe(true);
  });

  it("defaults an unlisted field to viewable but NOT editable", () => {
    const fields = mergeFieldPermissions([]);
    expect(checkFieldView(fields, false, "patients", "email")).toBe(true);
    expect(checkFieldEdit(fields, false, "patients", "email")).toBe(false);
    expect(checkFieldEdit(fields, true, "patients", "email")).toBe(true);
  });
});
