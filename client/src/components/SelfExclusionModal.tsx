import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Ban, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SelfExclusionModalProps {
  trigger?: React.ReactNode;
}

export default function SelfExclusionModal({ trigger }: SelfExclusionModalProps) {
  const [open, setOpen] = useState(false);
  const [duration, setDuration] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const { toast } = useToast();

  const handleSelfExclude = () => {
    if (!duration || !confirmed) return;
    
    const durationDays: Record<string, number> = {
      "24h": 1,
      "7d": 7,
      "30d": 30,
      "90d": 90,
      "1y": 365
    };
    
    const days = durationDays[duration];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    
    localStorage.setItem("self_excluded", JSON.stringify({
      excluded: true,
      duration,
      expiresAt: expiresAt.toISOString(),
      startedAt: new Date().toISOString()
    }));
    
    document.cookie = `self_excluded=true; max-age=${days * 24 * 60 * 60}; path=/; SameSite=Lax`;
    
    toast({
      title: "Self-Exclusion Activated",
      description: `You have been excluded for ${duration}. Take care of yourself.`,
    });
    
    setOpen(false);
    window.location.href = "https://www.ncpgambling.org";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
            <Ban className="w-4 h-4 mr-2" />
            Self-Exclusion
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Self-Exclusion Tool
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            If you feel you need a break from this platform, you can temporarily block your own access. 
            This action cannot be undone until the period expires.
          </p>
          
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Phone className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-800 dark:text-amber-300">
                <p className="font-semibold mb-1">Need help now?</p>
                <p>Call <strong>1-800-GAMBLER</strong> (24/7)</p>
                <p>Visit <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="underline">ncpgambling.org</a></p>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Exclusion Period</label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger data-testid="select-exclusion-duration">
                <SelectValue placeholder="Select duration..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
                <SelectItem value="1y">1 Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="confirm-exclusion"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1"
              data-testid="checkbox-confirm-exclusion"
            />
            <label htmlFor="confirm-exclusion" className="text-xs text-gray-600">
              I understand this action will block my access to LotteryPro for the selected period 
              and cannot be reversed early.
            </label>
          </div>
          
          <Button
            onClick={handleSelfExclude}
            disabled={!duration || !confirmed}
            className="w-full bg-red-600 hover:bg-red-700"
            data-testid="button-activate-exclusion"
          >
            <Ban className="w-4 h-4 mr-2" />
            Activate Self-Exclusion
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
