import Foundation
import React
import BridgeeAiSDK

@objc(BridgeeSdk)
public class BridgeeSdk: RCTEventEmitter {

  private static let eventLog = "BridgeeAnalytics.logEvent"
  private static let eventUserProperty = "BridgeeAnalytics.setUserProperty"

  private var provider: RnAnalyticsProvider?
  private var hasListeners = false

  public override static func requiresMainQueueSetup() -> Bool {
    return false
  }

  public override func supportedEvents() -> [String]! {
    return [BridgeeSdk.eventLog, BridgeeSdk.eventUserProperty]
  }

  public override func startObserving() {
    hasListeners = true
  }

  public override func stopObserving() {
    hasListeners = false
  }

  @objc
  func configure(_ tenantId: String,
                 tenantKey: String,
                 dryRun: Bool,
                 resolve: @escaping RCTPromiseResolveBlock,
                 reject: @escaping RCTPromiseRejectBlock) {
    let provider = RnAnalyticsProvider(owner: self)
    self.provider = provider

    BridgeeSDK.shared.configure(
      provider: provider,
      tenantId: tenantId,
      tenantKey: tenantKey,
      dryRun: dryRun
    )
    resolve(nil)
  }

  @objc
  func firstOpen(_ matchBundleMap: NSDictionary,
                 resolve: @escaping RCTPromiseResolveBlock,
                 reject: @escaping RCTPromiseRejectBlock) {
    let bundle = MatchBundle()
    for (rawKey, rawValue) in matchBundleMap {
      guard let key = rawKey as? String, let value = rawValue as? String else { continue }
      switch key {
      case "email":
        bundle.set(email: value)
      case "phone":
        bundle.set(phone: value)
      case "name":
        bundle.set(name: value)
      case "gclid":
        bundle.set(gclid: value)
      default:
        bundle.setCustom(key: key, value: value)
      }
    }

    BridgeeSDK.shared.firstOpen(with: bundle) { utmData, errorMessage in
      if let message = errorMessage {
        reject("BRIDGEE_FIRST_OPEN_ERROR", message, nil)
        return
      }
      let result: [String: String] = [
        "utm_source": utmData?.utm_source ?? "",
        "utm_medium": utmData?.utm_medium ?? "",
        "utm_campaign": utmData?.utm_campaign ?? "",
      ]
      resolve(result)
    }
  }

  func emitLogEvent(name: String, parameters: [String: Any]?) {
    guard hasListeners else { return }
    sendEvent(
      withName: BridgeeSdk.eventLog,
      body: ["name": name, "params": parameters ?? [:]]
    )
  }

  func emitSetUserProperty(name: String, value: String?) {
    guard hasListeners else { return }
    sendEvent(
      withName: BridgeeSdk.eventUserProperty,
      body: ["name": name, "value": value as Any]
    )
  }
}
