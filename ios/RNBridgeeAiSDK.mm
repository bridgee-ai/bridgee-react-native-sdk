#import "RNBridgeeAiSDK.h"
#import <BridgeeSDK/BridgeeSDK-Swift.h>
#import <FirebaseAnalytics/FirebaseAnalytics.h>
#import "Firebase.h"

/**
 * AnalyticsProvider implementation that forwards events to Firebase Analytics.
 */
@interface BridgeeFirebaseAnalyticsProvider : NSObject <AnalyticsProvider>

@property (nonatomic, strong) FIRAnalytics *analytics;
- (void)logEvent:(NSString *)name params:(NSDictionary<NSString *, id> *)params;
- (void)setUserProperty:(NSString *)name value:(NSString *)value;

@end

@implementation BridgeeFirebaseAnalyticsProvider
- (void)logEvent:(NSString *)name params:(NSDictionary<NSString *, id> *)params {
    [FIRAnalytics logEventWithName:name parameters:params];
}

- (void)setUserProperty:(NSString *)name value:(NSString *)value {
    [FIRAnalytics setUserPropertyString:value forName:name];
}

- (void)logEventWithName:(NSString * _Nonnull)name parameters:(NSDictionary<NSString *,id> * _Nullable)parameters {
    [FIRAnalytics logEventWithName:name parameters:parameters];
}

- (void)setUserPropertyWithName:(NSString * _Nonnull)name value:(NSString * _Nullable)value {
    [FIRAnalytics setUserPropertyString:value forName:name];
}

@end

@implementation RNBridgeeAiSDK

RCT_EXPORT_MODULE()

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:(const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeRNBridgeeAiSDKSpecJSI>(params);
}

static NSString *const TAG = @"BridgeeAiModule";
static NSString *const FIRST_LAUNCH_KEY = @"bridgee_first_launch";

- (void)initializeBridgeeSDK:(NSString *)apiKey
                   secretKey:(NSString *)secretKey
                     resolve:(RCTPromiseResolveBlock)resolve
                      reject:(RCTPromiseRejectBlock)reject {
    @try {
        // Verifica se é a primeira abertura do app
        if ([self isFirstLaunch]) {
            if([FIRApp defaultApp] == nil){
                [FIRApp configure];
            }
            
            BridgeeFirebaseAnalyticsProvider *firebaseAnalyticsProvider = [[BridgeeFirebaseAnalyticsProvider alloc] init];
            
            [[BridgeeSDK shared] configureWithProvider:firebaseAnalyticsProvider tenantId:apiKey tenantKey:secretKey dryRun:false];
            
            // Cria um MatchBundle vazio (equivalente ao Android)
            MatchBundle *matchBundle = [[MatchBundle alloc] init];
            
            // Chama firstOpen do SDK
            [[BridgeeSDK shared] firstOpenWith:matchBundle completion:^(UTMData *response, NSString *error) {
                if (response == nil) {
                    reject(@"BridgeeSDK",
                          [NSString stringWithFormat:@"Error during firstOpen: %@", error],
                           nil);
                } else {
                    [self markFirstLaunchCompleted];

                    NSDictionary *responseDictionary = @{@"utm_medium": response.utm_medium, @"utm_source": response.utm_source, @"utm_campaign": response.utm_campaign};

                    // Retorna a resposta do SDK (deve conter utmSource, utmMedium, utmCampaign)
                    resolve(responseDictionary);
                }
            }];
        } else {
            reject(@"BridgeeSDK", @"Not the first launch", nil);
        }
    } @catch (NSException *exception) {
        reject(@"BridgeeSDK", 
              [NSString stringWithFormat:@"Error initializing Bridgee SDK: %@", exception.reason], 
              nil);
    }
}

- (BOOL)isFirstLaunch {
    return ![[NSUserDefaults standardUserDefaults] boolForKey:FIRST_LAUNCH_KEY];
}

- (void)markFirstLaunchCompleted {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setBool:YES forKey:FIRST_LAUNCH_KEY];
    [defaults synchronize];
}

@end
