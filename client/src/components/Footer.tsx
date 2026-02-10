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
                <Link href="/privacy" className="hover:text-white flex items-center gap-1" data-testid="link-footer-privacy">
                  <Shield className="w-3 h-3" aria-hidden="true" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white flex items-center gap-1" data-testid="link-footer-terms">
                  <FileText className="w-3 h-3" aria-hidden="true" /> Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/accessibility" className="hover:text-white flex items-center gap-1" data-testid="link-footer-accessibility">
                  <Accessibility className="w-3 h-3" aria-hidden="true" /> Accessibility
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
            <h4 className="font-semibold text-white mb-3">Support & Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://russellnomermusic.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> RussellNomerMusic.com
                </a>
              </li>
              <li>
                <Link href="/support" className="hover:text-white" data-testid="link-footer-support">
                  Contact Support
                </Link>
              </li>
              <li>
                <Link href="/privacy#dsar" className="hover:text-white" data-testid="link-footer-dsar">
                  Data Requests (DSAR)
                </Link>
              </li>
              <li className="text-gray-400">
                Legal: legal [at] russellnomer.com
              </li>
            </ul>
            <p className="text-xs text-gray-500 mt-3">
              GDPR/CCPA Compliant | 30-day data retention
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-gray-500">
              © 2025 LotteryPro by Russell Nomer. All rights reserved. 18+ Only.
            </p>
            <p className="text-xs text-gray-500 text-center max-w-2xl">
              LotteryPro is a statistical analysis tool for informational purposes only. We are not a gambling operator and do not accept wagers. You must be 18+ to use this tool and participate in lottery games. Play Responsibly.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
