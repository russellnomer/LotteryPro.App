import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Phone, Heart } from "lucide-react";

interface SessionTimeReminderProps {
  spinCount: number;
  threshold?: number;
}

export default function SessionTimeReminder({ spinCount, threshold = 5 }: SessionTimeReminderProps) {
  const [showReminder, setShowReminder] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    console.log(`[SessionReminder] spinCount=${spinCount}, threshold=${threshold}, dismissed=${dismissed}`);
    
    if (spinCount > 0 && spinCount % threshold === 0 && !dismissed) {
      console.log('[SessionReminder] Triggering break reminder!');
      setShowReminder(true);
    }
  }, [spinCount, threshold, dismissed]);

  const handleContinue = () => {
    setShowReminder(false);
    setDismissed(false);
  };

  const handleTakeBreak = () => {
    setShowReminder(false);
    setDismissed(true);
    sessionStorage.setItem("break_reminder_dismissed", "true");
  };

  return (
    <Dialog open={showReminder} onOpenChange={setShowReminder}>
      <DialogContent className="sm:max-w-md" aria-labelledby="reminder-title" aria-describedby="reminder-description">
        <DialogHeader>
          <DialogTitle id="reminder-title" className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" aria-hidden="true" />
            Time for a Break?
          </DialogTitle>
          <DialogDescription id="reminder-description">
            You've completed {spinCount} spins. Consider taking a short break to stay refreshed.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <Heart className="inline h-4 w-4 mr-1" aria-hidden="true" />
              Gambling should be fun, not stressful. If you're feeling overwhelmed, 
              it's okay to step away.
            </p>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>
                Need help? Call <a href="tel:1-800-522-4700" className="font-bold underline">1-800-GAMBLER</a> (1-800-522-4700)
              </span>
            </p>
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleTakeBreak} data-testid="button-take-break">
            Take a Break
          </Button>
          <Button onClick={handleContinue} data-testid="button-continue-playing">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
