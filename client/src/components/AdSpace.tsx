import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface AdSpaceProps {
  size: "banner" | "square" | "rectangle" | "leaderboard";
  position?: string;
  className?: string;
}

export default function AdSpace({ size, position = "", className = "" }: AdSpaceProps) {
  const sizeConfig = {
    banner: { width: "728px", height: "90px", label: "728x90 Banner" },
    square: { width: "300px", height: "250px", label: "300x250 Square" },
    rectangle: { width: "336px", height: "280px", label: "336x280 Rectangle" },
    leaderboard: { width: "970px", height: "90px", label: "970x90 Leaderboard" }
  };

  const config = sizeConfig[size];

  return (
    <Card 
      className={`border-dashed border-2 border-gray-300 bg-gray-50 dark:bg-gray-800 dark:border-gray-600 ${className}`}
      style={{ width: config.width, height: config.height, maxWidth: "100%" }}
    >
      <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-4">
        <ExternalLink className="h-8 w-8 mb-2" />
        <div className="text-sm font-medium text-center">
          Advertisement Space
        </div>
        <div className="text-xs text-center mt-1">
          {config.label} {position && `- ${position}`}
        </div>
        <div className="text-xs text-center mt-2 text-gray-400">
          Google AdSense • Sponsored Content
        </div>
      </div>
    </Card>
  );
}

// Component for integrating Google AdSense
export function GoogleAdSense({ 
  adSlot, 
  adFormat = "auto", 
  fullWidthResponsive = true,
  className = ""
}: {
  adSlot: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  className?: string;
}) {
  // In development, show placeholder instead of real ads to prevent errors
  const isDevelopment = import.meta.env.DEV || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname.includes('replit.dev');

  if (isDevelopment) {
    return (
      <div className={className}>
        <div className="border-2 border-dashed border-blue-300 bg-blue-50 p-4 rounded text-center">
          <div className="text-blue-600 text-sm font-medium">AdSense Placeholder</div>
          <div className="text-blue-500 text-xs mt-1">Slot: {adSlot}</div>
          <div className="text-blue-500 text-xs">Real ads will show in production</div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={(window as any).ADSENSE_PUBLISHER_ID || "ca-pub-XXXXXXXXXXXXXXXX"}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
}

// Component for custom banner ads
export function CustomBannerAd({ 
  imageUrl, 
  linkUrl, 
  altText, 
  size = "banner",
  className = ""
}: {
  imageUrl: string;
  linkUrl: string;
  altText: string;
  size?: "banner" | "square" | "rectangle" | "leaderboard";
  className?: string;
}) {
  const sizeConfig = {
    banner: "w-full max-w-[728px] h-[90px]",
    square: "w-[300px] h-[250px]",
    rectangle: "w-[336px] h-[280px]",
    leaderboard: "w-full max-w-[970px] h-[90px]"
  };

  return (
    <div className={`${className} flex justify-center`}>
      <a 
        href={linkUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block hover:opacity-90 transition-opacity"
      >
        <img 
          src={imageUrl}
          alt={altText}
          className={`${sizeConfig[size]} object-cover rounded`}
        />
        <div className="text-xs text-gray-400 text-center mt-1">Advertisement</div>
      </a>
    </div>
  );
}