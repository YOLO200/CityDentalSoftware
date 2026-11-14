import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { BranchProvider, pickBranch, useBranch, type Branch } from "./BranchContext";
import { supabase } from "../../lib/supabase";

vi.mock("../../lib/supabase", () => ({ supabase: { rpc: vi.fn() } }));
vi.mock("./AuthContext", () => ({ useAuth: () => ({ user: { id: "user-1" } }) }));

const A: Branch = { id: "a", name: "Andheri" };
const S: Branch = { id: "s", name: "Speedwell Premium Division" };
const Z: Branch = { id: "z", name: "Zaveri Bazaar" };

describe("pickBranch", () => {
  it("prefers the stored choice, then Speedwell, then the first branch", () => {
    expect(pickBranch([A, S, Z], "z")).toBe(Z);
    expect(pickBranch([A, S, Z], null)).toBe(S);
    expect(pickBranch([A, S, Z], "revoked-id")).toBe(S);
    expect(pickBranch([A, Z], null)).toBe(A);
    expect(pickBranch([], "z")).toBeNull();
  });
});

function Probe() {
  const { branches, selectedBranch, isLoading, setSelectedBranch } = useBranch();
  return (
    <div>
      <span data-testid="state">{isLoading ? "loading" : "ready"}</span>
      <span data-testid="branches">{branches.map((b) => b.id).join(",")}</span>
      <span data-testid="selected">{selectedBranch?.id ?? "none"}</span>
      <button onClick={() => setSelectedBranch(A)}>pick A</button>
    </div>
  );
}

describe("BranchProvider", () => {
  beforeEach(() => vi.mocked(supabase.rpc).mockReset());

  it("drops a cached branch the server no longer grants, and remembers the user's pick", async () => {
    // Last session cached Zaveri as selected; access to it has since been revoked.
    localStorage.setItem("dentosys.branchList:user-1", JSON.stringify([A, Z]));
    localStorage.setItem("dentosys.selectedBranchId:user-1", "z");
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [A, S], error: null } as never);

    render(<BranchProvider><Probe /></BranchProvider>);

    // First paint comes from the cache, without waiting on the network.
    expect(screen.getByTestId("selected")).toHaveTextContent("z");

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("ready"));
    expect(supabase.rpc).toHaveBeenCalledWith("my_branches");
    expect(screen.getByTestId("branches")).toHaveTextContent("a,s");
    // Zaveri is gone; with no valid stored choice the Speedwell default wins.
    expect(screen.getByTestId("selected")).toHaveTextContent("s");
    expect(JSON.parse(localStorage.getItem("dentosys.branchList:user-1")!)).toEqual([A, S]);

    act(() => screen.getByRole("button", { name: "pick A" }).click());
    expect(screen.getByTestId("selected")).toHaveTextContent("a");
    expect(localStorage.getItem("dentosys.selectedBranchId:user-1")).toBe("a");
  });
});
