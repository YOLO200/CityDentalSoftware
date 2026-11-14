import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PermissionGate } from "./PermissionGate";
import { usePermissions } from "./hooks";

vi.mock("./hooks", () => ({ usePermissions: vi.fn() }));

const mockPermissions = (granted: string[], isLoading = false) =>
  vi.mocked(usePermissions).mockReturnValue({
    hasPermission: (m: string, a: string) => granted.includes(`${m}:${a}`),
    canViewField: () => true,
    canEditField: () => false,
    userRoles: [],
    userClinics: [],
    isLoading,
    isSuper: false,
    reload: () => {},
  });

describe("PermissionGate", () => {
  beforeEach(() => vi.mocked(usePermissions).mockReset());

  it("renders children only when the permission is held, otherwise the fallback", () => {
    mockPermissions(["patients:create"]);
    const { rerender } = render(
      <PermissionGate module="patients" action="create" fallback={<span>denied</span>}>
        <button>Add Patient</button>
      </PermissionGate>,
    );
    expect(screen.getByRole("button", { name: "Add Patient" })).toBeInTheDocument();

    mockPermissions([]);
    rerender(
      <PermissionGate module="patients" action="create" fallback={<span>denied</span>}>
        <button>Add Patient</button>
      </PermissionGate>,
    );
    expect(screen.queryByRole("button", { name: "Add Patient" })).not.toBeInTheDocument();
    expect(screen.getByText("denied")).toBeInTheDocument();
  });

  it("renders nothing while permissions are loading, so protected UI never flashes", () => {
    mockPermissions(["patients:create"], true);
    const { container } = render(
      <PermissionGate module="patients" action="create" fallback={<span>denied</span>}>
        <button>Add Patient</button>
      </PermissionGate>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
