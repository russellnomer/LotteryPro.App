#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// CAP_PLUGIN registers the Swift class with Capacitor's plugin registry.
// The name "LotteryProIAP" must match registerPlugin("LotteryProIAP") in JS.
CAP_PLUGIN(LotteryProIAPPlugin, "LotteryProIAP",
    CAP_PLUGIN_METHOD(setup, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getProducts, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(purchaseProduct, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(restorePurchases, CAPPluginReturnPromise);
)
