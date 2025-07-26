import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import SimpleTest from "@/pages/simple-test";
import MusicHome from "@/pages/music-home";
import Books from "@/pages/books";
import Performance from "@/pages/performance";
import Subscription from "@/pages/subscription";
import Auth from "@/pages/auth";
import Admin from "@/pages/admin";
import PrivacyPolicy from "@/pages/privacy";
import SocialMarketing from "@/pages/social-marketing";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SimpleTest} />
      <Route path="/home" component={Home} />
      <Route path="/music" component={MusicHome} />
      <Route path="/books" component={Books} />
      <Route path="/performance" component={Performance} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/auth" component={Auth} />
      <Route path="/admin" component={Admin} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/social-marketing" component={SocialMarketing} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
