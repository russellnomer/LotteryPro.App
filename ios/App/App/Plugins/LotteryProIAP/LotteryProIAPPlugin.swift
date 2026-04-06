import Capacitor
import StoreKit

/// LotteryProIAP — Capacitor plugin wrapping StoreKit 2.
///
/// Registered via registerPlugin("LotteryProIAP") in the JavaScript layer.
/// Handles subscription product loading, purchasing, and restoring for
/// the LotteryPro iOS app.
///
/// Product IDs:
///   com.lotterypro.app.premium.monthly
///   com.lotterypro.app.premium.annual
@objc(LotteryProIAPPlugin)
public class LotteryProIAPPlugin: CAPPlugin {

    private var productIds: [String] = []

    // MARK: - setup

    @objc func setup(_ call: CAPPluginCall) {
        guard let ids = call.getArray("productIds") as? [String] else {
            call.reject("productIds array is required")
            return
        }
        self.productIds = ids
        call.resolve()
    }

    // MARK: - getProducts

    @objc func getProducts(_ call: CAPPluginCall) {
        guard let ids = call.getArray("productIds") as? [String] else {
            call.reject("productIds array is required")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: ids)
                let productList = products.map { p -> [String: Any] in
                    return [
                        "productId": p.id,
                        "title": p.displayName,
                        "description": p.description,
                        "price": p.displayPrice,
                        "priceAmount": NSDecimalNumber(decimal: p.price).doubleValue,
                        "currency": p.priceFormatStyle.currencyCode ?? "USD",
                    ]
                }
                call.resolve(["products": productList])
            } catch {
                call.reject("Failed to fetch products: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - purchaseProduct

    @objc func purchaseProduct(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("productId is required")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Product not found: \(productId)")
                    return
                }

                let result = try await product.purchase()

                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let tx):
                        let txData: [String: Any] = [
                            "productId": tx.productID,
                            "transactionId": String(tx.id),
                            "jwsRepresentation": tx.jwsRepresentation,
                        ]
                        // Finish the transaction after handing off to the server
                        await tx.finish()
                        call.resolve(["transaction": txData])

                    case .unverified(_, let error):
                        call.reject("Unverified transaction: \(error.localizedDescription)")
                    }

                case .userCancelled:
                    call.reject("Payment cancelled by user", "PAYMENT_CANCELLED")

                case .pending:
                    call.reject("Payment pending parental approval")

                @unknown default:
                    call.reject("Unknown purchase result")
                }
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - restorePurchases

    /// Syncs with the App Store first (handles new-device restore), then
    /// collects all current entitlements and returns their JWS tokens.
    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            // Explicit App Store sync — required for reliable restore on a new device
            // or after re-installing the app. This triggers a sign-in prompt if needed.
            do {
                try await AppStore.sync()
            } catch {
                // Non-fatal: user may have cancelled the sign-in. Continue anyway.
                print("[LotteryProIAP] AppStore.sync() warning: \(error.localizedDescription)")
            }

            var transactions: [[String: Any]] = []

            // Iterate verified current entitlements (non-expired subscriptions)
            for await result in Transaction.currentEntitlements {
                switch result {
                case .verified(let tx):
                    transactions.append([
                        "productId": tx.productID,
                        "transactionId": String(tx.id),
                        "jwsRepresentation": tx.jwsRepresentation,
                    ])
                case .unverified:
                    break
                }
            }

            call.resolve(["transactions": transactions])
        }
    }
}
