import { cn } from "@/lib/utils";
import { ChevronsUpDown } from "lucide-react";

export const US_STATES = [
  { name: "Alabama", abbr: "AL" },
  { name: "Alaska", abbr: "AK" },
  { name: "Arizona", abbr: "AZ" },
  { name: "Arkansas", abbr: "AR" },
  { name: "California", abbr: "CA" },
  { name: "Colorado", abbr: "CO" },
  { name: "Connecticut", abbr: "CT" },
  { name: "Delaware", abbr: "DE" },
  { name: "Florida", abbr: "FL" },
  { name: "Georgia", abbr: "GA" },
  { name: "Hawaii", abbr: "HI" },
  { name: "Idaho", abbr: "ID" },
  { name: "Illinois", abbr: "IL" },
  { name: "Indiana", abbr: "IN" },
  { name: "Iowa", abbr: "IA" },
  { name: "Kansas", abbr: "KS" },
  { name: "Kentucky", abbr: "KY" },
  { name: "Louisiana", abbr: "LA" },
  { name: "Maine", abbr: "ME" },
  { name: "Maryland", abbr: "MD" },
  { name: "Massachusetts", abbr: "MA" },
  { name: "Michigan", abbr: "MI" },
  { name: "Minnesota", abbr: "MN" },
  { name: "Mississippi", abbr: "MS" },
  { name: "Missouri", abbr: "MO" },
  { name: "Montana", abbr: "MT" },
  { name: "Nebraska", abbr: "NE" },
  { name: "Nevada", abbr: "NV" },
  { name: "New Hampshire", abbr: "NH" },
  { name: "New Jersey", abbr: "NJ" },
  { name: "New Mexico", abbr: "NM" },
  { name: "New York", abbr: "NY" },
  { name: "North Carolina", abbr: "NC" },
  { name: "North Dakota", abbr: "ND" },
  { name: "Ohio", abbr: "OH" },
  { name: "Oklahoma", abbr: "OK" },
  { name: "Oregon", abbr: "OR" },
  { name: "Pennsylvania", abbr: "PA" },
  { name: "Rhode Island", abbr: "RI" },
  { name: "South Carolina", abbr: "SC" },
  { name: "South Dakota", abbr: "SD" },
  { name: "Tennessee", abbr: "TN" },
  { name: "Texas", abbr: "TX" },
  { name: "Utah", abbr: "UT" },
  { name: "Vermont", abbr: "VT" },
  { name: "Virginia", abbr: "VA" },
  { name: "Washington", abbr: "WA" },
  { name: "West Virginia", abbr: "WV" },
  { name: "Wisconsin", abbr: "WI" },
  { name: "Wyoming", abbr: "WY" },
] as const;

interface StateComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  returnFormat?: "abbr" | "name";
  disabled?: boolean;
  "data-testid"?: string;
}

export default function StateCombobox({
  value,
  onChange,
  placeholder = "Select state...",
  returnFormat = "abbr",
  disabled = false,
  "data-testid": testId,
}: StateComboboxProps) {
  const selectedState = US_STATES.find(
    (state) => state.abbr === value || state.name === value
  );

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue) {
      const state = US_STATES.find(s => s.abbr === selectedValue);
      if (state) {
        const returnValue = returnFormat === "abbr" ? state.abbr : state.name;
        onChange(returnValue);
      }
    }
  };

  return (
    <div className="relative w-full">
      <select
        value={selectedState?.abbr || ""}
        onChange={handleChange}
        disabled={disabled}
        aria-label="Select your state"
        data-testid={testId || "state-combobox-trigger"}
        className={cn(
          "w-full h-11 px-3 pr-10 rounded-md border border-input bg-background text-base",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "appearance-none cursor-pointer",
          !selectedState && "text-muted-foreground"
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {US_STATES.map((state) => (
          <option 
            key={state.abbr} 
            value={state.abbr}
            data-testid={`state-option-${state.abbr.toLowerCase()}`}
          >
            {state.name} ({state.abbr})
          </option>
        ))}
      </select>
      <ChevronsUpDown 
        className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" 
        aria-hidden="true"
      />
    </div>
  );
}
