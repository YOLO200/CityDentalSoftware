import { Search, Bell, User, MapPin, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

const branches = ["Speedwell", "Virani Chowk", "Kothariya"];

export function Header() {
  const navigate = useNavigate();
  const [selectedBranch, setSelectedBranch] = useState("Speedwell");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex flex-1 items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground text-[#2563eb]">City Dental Software</h1>
        
        {/* Branch Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm hover:bg-secondary transition-colors"
          >
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-medium">{selectedBranch}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          
          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)}
              />
              
              {/* Dropdown Menu */}
              <div className="absolute left-0 top-full mt-2 w-48 rounded-xl border border-border bg-card shadow-lg z-20">
                {branches.map((branch) => (
                  <button
                    key={branch}
                    onClick={() => {
                      setSelectedBranch(branch);
                      setIsDropdownOpen(false);
                    }}
                    className={`
                      w-full px-4 py-2.5 text-left text-sm transition-colors
                      first:rounded-t-xl last:rounded-b-xl
                      ${selectedBranch === branch 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "hover:bg-secondary"
                      }
                    `}
                  >
                    {branch}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        <div className="relative w-96">
          
          
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-xl p-2 hover:bg-secondary">
          <Bell className="h-5 w-5 text-foreground" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive"></span>
        </button>
        <button 
          onClick={() => navigate("/profile")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="text-right">
            <p className="text-sm">Dr. Anand Jasani</p>
            <p className="text-xs text-muted-foreground">Doctor</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-5 w-5" />
          </div>
        </button>
      </div>
    </header>
  );
}