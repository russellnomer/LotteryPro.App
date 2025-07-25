# Google AdSense Setup Guide for LotteryPro

## Step 1: Deploy Your Application

First, you need to deploy your application to get a permanent URL:

1. **Deploy on Replit:**
   - Click the "Deploy" button in your Replit workspace
   - Choose "Autoscale Deployments" for production
   - Your app will get a URL like: `https://your-app-name.your-username.repl.co`
   - Or use a custom domain if you have one

## Step 2: Google AdSense Account Setup

1. **Visit Google AdSense:**
   - Go to https://www.google.com/adsense/
   - Sign in with your Google account
   - Click "Get started"

2. **Add Your Website:**
   - Enter your deployed Replit URL (e.g., `https://lotterypro.russellnomer.repl.co`)
   - Select your country/territory
   - Choose whether this site belongs to you

3. **Connect Your Site to AdSense:**
   - Copy the AdSense code provided
   - Add it to your site (see Step 3 below)

## Step 3: Update Your Application Code

Replace the placeholder in `client/src/components/AdSpace.tsx`:

```typescript
data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with your actual Publisher ID
```

Your Publisher ID will look like: `ca-pub-1234567890123456`

## Step 4: Configure Ad Units

1. **In AdSense Dashboard:**
   - Go to "Ads" → "By ad unit"
   - Click "Create new ad unit"
   - Choose "Display ads"

2. **Create Different Ad Units for Different Sizes:**
   - **Header Banner:** 728x90 Leaderboard
   - **Sidebar Ads:** 300x250 Medium Rectangle  
   - **Content Ads:** 336x280 Large Rectangle
   - **Footer Banner:** 728x90 Leaderboard

3. **Copy Ad Unit IDs:**
   Each ad unit will have an ID like: `1234567890`

## Step 5: Update AdSpace Component

Update the `GoogleAdSense` component in `client/src/components/AdSpace.tsx`:

```typescript
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
  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-YOUR-PUBLISHER-ID" // Replace with your ID
        data-ad-slot={adSlot} // Use different slot IDs for each ad position
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive.toString()}
      />
    </div>
  );
}
```

## Step 6: Add AdSense Script to HTML

Add this script to `client/index.html` in the `<head>` section:

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR-PUBLISHER-ID"
     crossorigin="anonymous"></script>
```

## Step 7: Replace Placeholder Ads

Update your home page to use real AdSense units:

```typescript
// Replace AdSpace components with GoogleAdSense components
<GoogleAdSense adSlot="1234567890" className="max-w-full" /> // Header
<GoogleAdSense adSlot="0987654321" className="mb-6" />      // Sidebar
<GoogleAdSense adSlot="1122334455" className="mb-6" />      // Content
<GoogleAdSense adSlot="5544332211" className="max-w-full" /> // Footer
```

## Step 8: AdSense Approval Process

1. **Submit for Review:**
   - AdSense will review your site (can take 24-48 hours)
   - Ensure your site has quality content and follows AdSense policies

2. **Common Requirements:**
   - Privacy Policy (you'll need to add this)
   - Terms of Service
   - Contact information
   - Original, valuable content
   - Easy navigation

## Step 9: Add Required Pages

Create these additional pages for AdSense compliance:

- **Privacy Policy** (required)
- **Terms of Service** (recommended)
- **Contact Us** (recommended)

## Important Notes:

- **Domain Verification:** Your domain must be verified in AdSense
- **Traffic Requirements:** AdSense works better with consistent traffic
- **Content Policy:** Ensure your gambling/lottery content complies with AdSense policies
- **Payment Setup:** Configure payment methods in AdSense dashboard

## Testing:

1. Deploy your app with the AdSense code
2. Wait for approval (ads won't show until approved)
3. Use the tier switcher to test ad visibility for free vs paid users
4. Monitor AdSense dashboard for performance metrics

## Alternative Ad Networks:

If AdSense approval is challenging for lottery content, consider:
- Media.net
- PropellerAds
- AdThrive
- Custom sponsorship deals