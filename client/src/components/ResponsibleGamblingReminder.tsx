import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Clock, Phone, Coffee } from "lucide-react";

interface ResponsibleGamblingReminderProps {
  spinCount: number;
  onDismiss: () => void;
}

export default function ResponsibleGamblingReminder({ spinCount, onDismiss }: ResponsibleGamblingReminderProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (spinCount > 0 && spinCount % 5 === 0) {
      setOpen(true);
    }
  }, [spinCount]);

  const handleClose = () => {
    setOpen(false);
    onDismiss();
  };

  const handleTakeBreak = () => {
    setOpen(false);
    window.open("https://www.ncpgambling.org", "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <Clock className="w-5 h-5" />
            Time for a Break?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You've been playing for a while. Remember, this is for entertainment only. 
            No system can guarantee lottery wins.
          </p>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-blue-600 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Need to talk? Call <strong>1-800-GAMBLER</strong> (24/7, confidential)
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleTakeBreak}
              variant="outline"
              className="flex-1"
              data-testid="button-take-break"
            >
              <Coffee className="w-4 h-4 mr-2" />
              Take a Break
            </Button>
            <Button
              onClick={handleClose}
              className="flex-1"
              data-testid="button-continue-playing"
            >
              Continue
            </Button>
          </div>
          
          <p className="text-xs text-center text-gray-500">
            Reminder every 5 activities | <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="underline">Get Help</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
