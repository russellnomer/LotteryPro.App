import { useState, useEffect } from "react";

export default function DisclaimerModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAccepted = sessionStorage.getItem("disclaimer_accepted");
    if (!hasAccepted) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    sessionStorage.setItem("disclaimer_accepted", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="disclaimer-title"
      data-testid="disclaimer-modal"
    >
      <div 
        className="mx-4 max-w-lg rounded-lg p-6 text-white shadow-2xl"
        style={{ backgroundColor: "#007BFF" }}
      >
        <h2 
          id="disclaimer-title" 
          className="mb-4 text-center text-xl font-bold"
        >
          Important Notice
        </h2>
        <p className="mb-4 text-center leading-relaxed">
          This site is for entertainment only. Number picks are random and do not guarantee wins.
        </p>
        <p className="mb-4 text-center text-sm">
          <strong>Odds:</strong> Powerball: 1 in 292M | Mega Millions: 1 in 302M
        </p>
        <p className="mb-4 text-center text-sm">
          For real play, use licensed services like Jackpocket (18+ and state-legal only).
        </p>
        <p className="mb-6 text-center text-sm">
          Gambling responsibly? Call <strong>1-800-GAMBLER</strong>
        </p>
        <div className="flex justify-center">
          <button
            onClick={handleAccept}
            className="rounded-lg bg-white px-8 py-3 font-bold text-blue-600 shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white/50"
            data-testid="button-disclaimer-accept"
            autoFocus
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
