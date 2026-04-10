import { createContext, useContext, useState } from "react";

export const branches = ["Speedwell", "Virani Chowk", "Kothariya"];

interface BranchContextValue {
  selectedBranch: string;
  setSelectedBranch: (branch: string) => void;
}

const BranchContext = createContext<BranchContextValue>({
  selectedBranch: branches[0],
  setSelectedBranch: () => {},
});

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState(branches[0]);
  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  return useContext(BranchContext);
}
