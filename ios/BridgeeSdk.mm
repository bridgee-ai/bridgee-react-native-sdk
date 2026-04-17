#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(BridgeeSdk, RCTEventEmitter)

RCT_EXTERN_METHOD(configure:(NSString *)tenantId
                  tenantKey:(NSString *)tenantKey
                  dryRun:(BOOL)dryRun
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(firstOpen:(NSDictionary *)matchBundleMap
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
