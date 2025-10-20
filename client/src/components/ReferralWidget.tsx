import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Copy, Gift, Users, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function ReferralWidget() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: codeData } = useQuery({
    queryKey: ['/api/referral/my-code'],
  });

  const { data: statsData } = useQuery({
    queryKey: ['/api/referral/stats'],
  });

  const referralCode = codeData?.code?.referralCode;
  const referralLink = referralCode ? `${window.location.origin}/?ref=${referralCode}` : '';
  const stats = statsData?.stats || { totalReferrals: 0, completedReferrals: 0, totalRewards: 0 };

  const copyToClipboard = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnSocial = (platform: string) => {
    const text = encodeURIComponent(`Join me on Russell Nomer's LotteryPro and get 3 free number generations! ${referralLink}`);
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`,
    };
    
    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  if (!referralCode) {
    return null; // Only show for logged-in users
  }

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-purple-600" />
          <CardTitle>Refer & Earn Free Picks!</CardTitle>
        </div>
        <CardDescription>
          Share your link and get 3 free number generations for each friend who joins
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={referralLink}
            readOnly
            className="font-mono text-sm"
            data-testid="input-referral-link"
          />
          <Button
            onClick={copyToClipboard}
            variant="outline"
            size="icon"
            data-testid="button-copy-referral"
          >
            {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => shareOnSocial('twitter')}
            variant="outline"
            size="sm"
            className="flex-1"
            data-testid="button-share-twitter"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Twitter
          </Button>
          <Button
            onClick={() => shareOnSocial('facebook')}
            variant="outline"
            size="sm"
            className="flex-1"
            data-testid="button-share-facebook"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Facebook
          </Button>
          <Button
            onClick={() => shareOnSocial('linkedin')}
            variant="outline"
            size="sm"
            className="flex-1"
            data-testid="button-share-linkedin"
          >
            <Share2 className="h-4 w-4 mr-2" />
            LinkedIn
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
            <div className="text-xs text-muted-foreground">Total Referrals</div>
          </div>
          <div className="text-center">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-2xl font-bold">{stats.completedReferrals}</div>
            <div className="text-xs text-muted-foreground">Converted</div>
          </div>
          <div className="text-center">
            <Gift className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <div className="text-2xl font-bold">{stats.totalRewards}</div>
            <div className="text-xs text-muted-foreground">Free Picks Earned</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
