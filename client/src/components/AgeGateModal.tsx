import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Shield } from "lucide-react";

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

export default function AgeGateModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const ageVerified = localStorage.getItem("age_verified");
    const selfExcluded = localStorage.getItem("self_excluded");
    
    if (selfExcluded) {
      const exclusionData = JSON.parse(selfExcluded);
      const expiryDate = new Date(exclusionData.expiresAt);
      if (expiryDate > new Date()) {
        return;
      } else {
        localStorage.removeItem("self_excluded");
      }
    }
    
    if (!ageVerified) {
      setIsVisible(true);
    }
  }, []);

  const handleVerify = () => {
    if (!selectedState) {
      setError("Please select your state");
      return;
    }
    
    localStorage.setItem("age_verified", JSON.stringify({
      verified: true,
      state: selectedState,
      timestamp: new Date().toISOString()
    }));
    setIsVisible(false);
  };

  const handleDecline = () => {
    window.location.href = "https://www.google.com";
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      data-testid="age-gate-modal"
    >
      <div className="mx-4 max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-800">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
            <Shield className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>
        
        <h2 
          id="age-gate-title" 
          className="text-xl font-bold text-center mb-2 text-gray-900 dark:text-white"
        >
          Age Verification Required
        </h2>
        
        <p className="text-center text-gray-600 dark:text-gray-300 mb-4 text-sm">
          You must be 18 years or older to access this site. This is an entertainment platform for lottery education only.
        </p>
        
        <div className="mb-4">
          <label htmlFor="state-select" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Select Your State
          </label>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger id="state-select" data-testid="select-state">
              <SelectValue placeholder="Choose your state..." />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {US_STATES.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Gambling Problem? Call <strong>1-800-GAMBLER</strong> or visit{" "}
              <a 
                href="https://www.ncpgambling.org" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline"
              >
                ncpgambling.org
              </a>
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <Button
            onClick={handleVerify}
            className="w-full"
            disabled={!selectedState}
            data-testid="button-verify-age"
          >
            I am 18+ and agree to the Terms
          </Button>
          <Button
            variant="outline"
            onClick={handleDecline}
            className="w-full"
            data-testid="button-decline-age"
          >
            I am under 18 - Exit
          </Button>
        </div>
        
        <p className="text-xs text-center text-gray-500 mt-4">
          By clicking verify, you confirm you are 18+ and agree to our{" "}
          <a href="/terms" className="underline">Terms</a> and{" "}
          <a href="/privacy" className="underline">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
