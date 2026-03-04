import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, LogIn, UserPlus, KeyRound } from "lucide-react";
import { US_STATES } from "./StateCombobox";

const STORAGE_KEY = "age_verified_v2";
const COOKIE_NAME = "agv";
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

function setVerifiedCookie() {
  document.cookie = `${COOKIE_NAME}=1; max-age=${ONE_YEAR_SECONDS}; path=/; SameSite=Lax`;
}

function hasVerifiedCookie(): boolean {
  return document.cookie.split(";").some(c => c.trim().startsWith(`${COOKIE_NAME}=`));
}

function hasVerifiedStorage(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data?.verified) return false;
    // Check expiry (1 year)
    const ts = new Date(data.timestamp);
    const ageMs = Date.now() - ts.getTime();
    return ageMs < ONE_YEAR_SECONDS * 1000;
  } catch {
    return false;
  }
}

function isLoggedIn(): boolean {
  // Check for session token in localStorage (the app stores it there on login)
  try {
    const token = localStorage.getItem("sessionToken") || localStorage.getItem("session_token");
    if (token) return true;
    // Also check old-style age_verified that may have state (written by v1)
    const old = localStorage.getItem("age_verified");
    if (old) return false; // old key exists but user not necessarily logged in
    return false;
  } catch {
    return false;
  }
}

function setVerified(state: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    verified: true,
    state,
    timestamp: new Date().toISOString(),
  }));
  setVerifiedCookie();
  // Also refresh old key so legacy checks pass
  localStorage.setItem("age_verified", JSON.stringify({ verified: true, state, timestamp: new Date().toISOString() }));
  document.cookie = `age_verified=true; max-age=${ONE_YEAR_SECONDS}; path=/; SameSite=Lax`;
}

export default function AgeGateModal() {
  const [isVisible, setIsVisible] = useState(false); // start hidden, reveal only if needed
  const [selectedState, setSelectedState] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check self-exclusion first
    const selfExcluded = localStorage.getItem("self_excluded");
    if (selfExcluded) {
      try {
        const exclusionData = JSON.parse(selfExcluded);
        if (new Date(exclusionData.expiresAt) > new Date()) {
          window.location.href = "https://www.ncpgambling.org";
          return;
        } else {
          localStorage.removeItem("self_excluded");
        }
      } catch {
        localStorage.removeItem("self_excluded");
      }
    }

    // If logged in via session token, no need to show the gate
    if (isLoggedIn()) {
      setIsVisible(false);
      return;
    }

    // Accept EITHER localStorage OR cookie — one is enough
    const alreadyVerified = hasVerifiedStorage() || hasVerifiedCookie();
    if (alreadyVerified) {
      // Refresh both so they stay in sync going forward
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("age_verified");
      try {
        const data = raw ? JSON.parse(raw) : {};
        setVerified(data.state || "");
      } catch {
        setVerifiedCookie();
      }
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, []);

  const handleVerify = () => {
    if (!selectedState) {
      setError("Please select your state");
      return;
    }
    setVerified(selectedState);
    setIsVisible(false);
  };

  const handleDecline = () => {
    window.location.href = "https://www.google.com";
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90"
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
          LotteryPro is a statistical analysis tool for informational purposes only. We are not a gambling operator and do not accept wagers. You must be 18+ to use this tool and participate in lottery games.
        </p>

        <div className="mb-4">
          <label htmlFor="state-select" className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Select Your State
          </label>
          <select
            id="state-select"
            value={selectedState}
            onChange={(e) => { setSelectedState(e.target.value); setError(""); }}
            data-testid="age-gate-state-select"
            className="w-full h-12 px-3 rounded-md border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-base dark:text-white"
          >
            <option value="">Select your state...</option>
            {US_STATES.map((state) => (
              <option key={state.abbr} value={state.name}>
                {state.name} ({state.abbr})
              </option>
            ))}
          </select>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <div className="flex items-start gap-2 mb-4">
          <input
            type="checkbox"
            id="age-confirm-checkbox"
            checked={ageConfirmed}
            onChange={(e) => setAgeConfirmed(e.target.checked)}
            className="mt-1"
            aria-describedby="age-confirm-description"
            data-testid="checkbox-age-confirm"
          />
          <label htmlFor="age-confirm-checkbox" className="text-sm text-gray-700 dark:text-gray-300" id="age-confirm-description">
            I confirm I am <strong>18 years or older</strong> and agree to the{" "}
            <a href="/terms" className="underline text-blue-600">Terms of Service</a> and{" "}
            <a href="/privacy" className="underline text-blue-600">Privacy Policy</a>.
          </label>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
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
            disabled={!selectedState || !ageConfirmed}
            aria-label="Verify age and continue to site"
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

        {/* Login/Register/Reset Options */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-3">
            Have an account? Login to access your benefits!
          </p>
          <div className="flex gap-2 mb-2">
            <a
              href="/auth"
              className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              data-testid="link-login-from-agegate"
            >
              <LogIn className="w-4 h-4 mr-1" />
              Login
            </a>
            <a
              href="/auth?register=true"
              className="flex-1 flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              data-testid="link-register-from-agegate"
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Sign Up
            </a>
          </div>
          <a
            href="/auth?forgot=true"
            className="flex items-center justify-center w-full px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            data-testid="link-forgot-password-from-agegate"
          >
            <KeyRound className="w-3 h-3 mr-1" />
            Forgot Password?
          </a>
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
