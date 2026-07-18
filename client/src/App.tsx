import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
import Navigation from "@/components/Navigation";
import CookieConsent from "@/components/CookieConsent";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import DisclaimerModal from "@/components/DisclaimerModal";
import AgeGateModal from "@/components/AgeGateModal";
import Footer from "@/components/Footer";
import Accessibility from "@/pages/accessibility";
import Home from "@/pages/home";
import SimpleTest from "@/pages/simple-test";
import MusicHome from "@/pages/music-home";
import Books from "@/pages/books";
import Performance from "@/pages/performance";
import Auth from "@/pages/auth";
import Admin from "@/pages/admin";
import PrivacyPolicy from "@/pages/privacy";
import TermsOfService from "@/pages/terms";
import Support from "@/pages/support";
import SocialMarketing from "@/pages/social-marketing";
import Pools from "@/pages/pools";
import ScratchOffs from "@/pages/scratch-offs";
import Pricing from "@/pages/pricing";
import CheckoutSuccess from "@/pages/checkout-success";
import { BlogIndex, BlogPost } from "@/pages/blog";
import { PowerballHotNumbers, MegaMillionsHotNumbers } from "@/pages/hot-numbers";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/home" component={Home} />
          <Route path="/test" component={SimpleTest} />
          <Route path="/music" component={MusicHome} />
          <Route path="/books" component={Books} />
          <Route path="/performance" component={Performance} />
          <Route path="/subscription"><Redirect to="/pricing" /></Route>
          <Route path="/auth" component={Auth} />
          <Route path="/admin" component={Admin} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/support" component={Support} />
          <Route path="/social-marketing" component={SocialMarketing} />
          <Route path="/pools" component={Pools} />
          <Route path="/scratch-offs" component={ScratchOffs} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/checkout-success" component={CheckoutSuccess} />
          <Route path="/blog" component={BlogIndex} />
          <Route path="/blog/:slug" component={BlogPost} />
          <Route path="/powerball/hot-numbers" component={PowerballHotNumbers} />
          <Route path="/megamillions/hot-numbers" component={MegaMillionsHotNumbers} />
          <Route path="/accessibility" component={Accessibility} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AgeGateModal />
          <DisclaimerModal />
          <Toaster />
          <Router />
          <CookieConsent />
          <PWAInstallPrompt />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
