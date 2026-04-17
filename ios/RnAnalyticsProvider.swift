import Foundation
import BridgeeAiSDK

final class RnAnalyticsProvider: NSObject, AnalyticsProvider {
  private weak var owner: BridgeeSdk?

  init(owner: BridgeeSdk) {
    self.owner = owner
  }

  func setUserProperty(name: String, value: String?) {
    owner?.emitSetUserProperty(name: name, value: value)
  }

  func logEvent(name: String, parameters: [String: Any]?) {
    owner?.emitLogEvent(name: name, parameters: parameters)
  }
}
