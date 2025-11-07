//
//  BridgeeFirebaseAnalyticsProvider.h
//

#import <Foundation/Foundation.h>
#import <BridgeeSDK/BridgeeSDK.h>
#import <FirebaseAnalytics/FirebaseAnalytics.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * AnalyticsProvider implementation that forwards events to Firebase Analytics.
 */
@interface BridgeeFirebaseAnalyticsProvider : NSObject <AnalyticsProvider>

- (instancetype)initWithAnalytics:(FIRAnalytics *)analytics;

@end

NS_ASSUME_NONNULL_END