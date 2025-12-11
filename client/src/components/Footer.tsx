import { Link } from "wouter";
import { Phone, Shield, FileText, Accessibility, Ban, ExternalLink } from "lucide-react";
import SelfExclusionModal from "./SelfExclusionModal";

export default function Footer() {
  const handleDoNotSell = () => {
    document.cookie = "ccpa_opt_out=true; max-age=31536000; path=/; SameSite=Lax";
    localStorage.setItem("ccpa_opt_out", JSON.stringify({
      optedOut: true,
      timestamp: new Date().toISOString()
    }));
    alert("Your opt-out preference has been saved. We will not sell your personal information.");
  };

  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-white mb-3">LotteryPro</h3>
            <p className="text-sm text-gray-400">
              Educational lottery analysis platform by Russell Nomer. For entertainment purposes only.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              As an Amazon Associate, I earn from qualifying purchases.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-3">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy">
                  <a className="hover:text-white flex items-center gap-1" data-testid="link-footer-privacy">
                    <Shield className="w-3 h-3" /> Privacy Policy
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="hover:text-white flex items-center gap-1" data-testid="link-footer-terms">
                    <FileText className="w-3 h-3" /> Terms of Service
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/accessibility">
                  <a className="hover:text-white flex items-center gap-1" data-testid="link-footer-accessibility">
                    <Accessibility className="w-3 h-3" /> Accessibility
                  </a>
                </Link>
              </li>
              <li>
                <button 
                  onClick={handleDoNotSell}
                  className="hover:text-white flex items-center gap-1 text-left"
                  data-testid="button-do-not-sell"
                >
                  <Ban className="w-3 h-3" /> Do Not Sell My Info
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-3">Responsible Gaming</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://www.ncpgambling.org" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> NCPG Resources
                </a>
              </li>
              <li>
                <a 
                  href="tel:1-800-522-4700"
                  className="hover:text-white flex items-center gap-1"
                >
                  <Phone className="w-3 h-3" /> 1-800-GAMBLER
                </a>
              </li>
              <li>
                <SelfExclusionModal 
                  trigger={
                    <button className="hover:text-white flex items-center gap-1 text-left text-sm">
                      <Ban className="w-3 h-3" /> Self-Exclusion Tool
                    </button>
                  }
                />
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/support">
                  <a className="hover:text-white">Contact Support</a>
                </Link>
              </li>
              <li>
                <Link href="/privacy#dsar">
                  <a className="hover:text-white">Data Requests (DSAR)</a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              © 2025 LotteryPro by Russell Nomer. All rights reserved. 18+ Only.
            </p>
            <p className="text-xs text-gray-500 text-center">
              Entertainment only. No guaranteed wins. Odds: Powerball 1:292M | Mega Millions 1:302M
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
