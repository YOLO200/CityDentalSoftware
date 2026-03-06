import { X } from "lucide-react";
import { useState } from "react";

interface MultiSelectProps {
  label?: string;
  placeholder?: string;
  required?: boolean;
  value: string[];
  onChange: (value: string[]) => void;
  suggestions?: string[];
}

export function MultiSelect({ 
  label, 
  placeholder = "Type and press Enter", 
  required, 
  value, 
  onChange,
  suggestions = []
}: MultiSelectProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const addSuggestion = (suggestion: string) => {
    if (!value.includes(suggestion)) {
      onChange([...value, suggestion]);
    }
    setInputValue("");
    setShowSuggestions(false);
  };

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(inputValue.toLowerCase()) && !value.includes(s)
  );

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="min-h-[44px] rounded-xl border border-border bg-input-background px-3 py-2 flex flex-wrap gap-2 items-center focus-within:ring-2 focus-within:ring-ring">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs text-primary"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-primary/20 rounded-full transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(inputValue.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={value.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[120px] bg-transparent text-sm outline-none"
          />
        </div>
        
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-xl border border-border bg-card shadow-lg max-h-48 overflow-auto">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addSuggestion(suggestion)}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-secondary transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
