# LotteryPro iOS Build Guide

Complete steps to build, test on TestFlight, and submit to the App Store.
Run these on your Mac in the project directory (cloned from Replit or GitHub).

---

## Prerequisites

- macOS with Xcode 15+ installed (free from App Store)
- Node.js 18+ (`node -v` to verify)
- CocoaPods: `sudo gem install cocoapods` (or via Homebrew: `brew install cocoapods`)
- Apple Developer account with App Store Connect access
- The project cloned locally

---

## Step 1 — Build the web app

```bash
npm install
npm run build
```

This produces the Vite output in `dist/public/`. Always build before syncing to iOS.

---

## Step 2 — Add the iOS platform (first time only)

```bash
npx cap add ios
```

This creates the `ios/` folder with a full Xcode project.
You only run this once. After that, use `npx cap sync` to update it.

---

## Step 3 — Generate app icons and splash screens

With the iOS project now in place:

```bash
npx capacitor-assets generate --ios
```

This reads `assets/icon.png` (1024×1024 PNG) and `assets/splash.png` (2732×2732 PNG)
and generates all required iOS icon sizes into the Xcode project automatically.

> Note: `assets/icon.png` and `assets/splash.png` are already committed to the repo.

---

## Step 4 — Sync Capacitor

```bash
npx cap sync
```

This copies `dist/public/` into the iOS project and installs native plugins.

---

## Step 5 — Open Xcode

```bash
npx cap open ios
```

---

## Step 6 — Configure Xcode signing

1. Click on the `App` project in the Xcode navigator.
2. Under **Signing & Capabilities → Team**, select your Apple Developer team.
3. Confirm the **Bundle Identifier** is `com.lotterypro.app`.
4. Xcode will automatically manage provisioning if "Automatically manage signing" is checked.

---

## Step 7 — Add StoreKit capability

1. In Xcode, select the `App` target.
2. Go to **Signing & Capabilities → + Capability → In-App Purchase**.
3. Save. This adds StoreKit to the entitlements file.

---

## Step 8 — Add StoreKit 2 client code

Add this Swift file to your Xcode project at `ios/App/App/IAPManager.swift`:

```swift
import StoreKit

@MainActor
class IAPManager: ObservableObject {
    static let shared = IAPManager()

    let productIds = [
        "com.lotterypro.app.premium.monthly",
        "com.lotterypro.app.premium.annual"
    ]

    @Published var products: [Product] = []
    @Published var purchasedProductIDs: Set<String> = []

    func loadProducts() async {
        do {
            products = try await Product.products(for: productIds)
        } catch {
            print("[IAP] Failed to load products: \(error)")
        }
    }

    func purchase(_ product: Product) async throws {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            switch verification {
            case .verified(let transaction):
                await verifyWithServer(transaction: transaction)
                await transaction.finish()
            case .unverified:
                print("[IAP] Transaction unverified")
            }
        case .pending, .userCancelled:
            break
        @unknown default:
            break
        }
    }

    private func verifyWithServer(transaction: Transaction) async {
        guard let jws = transaction.jwsRepresentation else { return }
        guard let url = URL(string: "https://lotterypro.app/api/apple/verify-iap") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        // Include your session cookie for authentication
        request.httpShouldHandleCookies = true

        let body = ["signedTransactionInfo": jws]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            if let httpResponse = response as? HTTPURLResponse {
                print("[IAP] Server verification status: \(httpResponse.statusCode)")
                if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    print("[IAP] Server response: \(json)")
                }
            }
        } catch {
            print("[IAP] Server verification failed: \(error)")
        }
    }

    func restorePurchases() async {
        // StoreKit 2: check currentEntitlements for all active subscriptions
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                await verifyWithServer(transaction: transaction)
                await transaction.finish()
            }
        }
    }
}
```

---

## Step 9 — Build for TestFlight

1. In Xcode, select **Product → Destination → Any iOS Device**.
2. Select **Product → Archive**.
3. When the Organizer opens, click **Distribute App → TestFlight & App Store**.
4. Follow the prompts. Xcode uploads the build to App Store Connect.
5. In App Store Connect, go to **TestFlight** and add yourself as an internal tester.
6. Install TestFlight on your iPhone, accept the invitation, and install the build.

---

## Step 10 — Test IAP in Sandbox

1. In App Store Connect, go to **Users & Access → Sandbox → Testers** and create a sandbox test account (use a fake email).
2. On your iPhone, sign out of your real Apple ID in Settings.
3. In TestFlight, open LotteryPro and try to subscribe.
4. When prompted, sign in with the sandbox tester account.
5. The subscription should complete without charging real money.
6. Check your server logs at `https://lotterypro.app/api/apple/notifications` for the Apple notification.

---

## Step 11 — Switch to production before App Store submission

In Replit Secrets, change:
```
APPLE_ENVIRONMENT = Production
```

Then redeploy the web app before submitting to App Store Review.

---

## Step 12 — Submit to App Store Review

1. In App Store Connect, fill in all required fields (description, keywords, screenshots).
2. Set **Privacy Policy URL**: `https://lotterypro.app/privacy`
3. Set **Support URL**: `https://lotterypro.app`
4. Under **Age Rating**, answer the questionnaire (gambling content = 17+).
5. Click **Submit for Review**.

Review typically takes 24-48 hours. Apple will ask clarifying questions if anything is unclear — check your developer email.

---

## Apple App Store Server Notifications Setup

1. In App Store Connect → Your App → App Information → App Store Server Notifications.
2. Set the **Production Server URL** to: `https://lotterypro.app/api/apple/notifications`
3. Set the **Sandbox Server URL** to the same URL (it handles both).
4. Click **Send Test Notification** to verify it reaches your server.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npx cap add ios` fails | Install CocoaPods: `sudo gem install cocoapods` |
| Icon not appearing in Xcode | Re-run `npx capacitor-assets generate --ios` after `npx cap add ios` |
| StoreKit products not loading | Bundle ID in Xcode must match `com.lotterypro.app` exactly |
| Server verification returning 401 | User must be logged in to the web app; session cookie must be sent |
| Apple notification URL not working | Ensure `https://lotterypro.app/api/apple/notifications` is publicly reachable |
