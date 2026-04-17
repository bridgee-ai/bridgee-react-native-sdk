package ai.bridgee.reactnative;

import android.os.Bundle;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import ai.bridgee.android.sdk.AnalyticsProvider;

class RnAnalyticsProvider implements AnalyticsProvider {

  private static final String EVENT_LOG = "BridgeeAnalytics.logEvent";
  private static final String EVENT_USER_PROPERTY = "BridgeeAnalytics.setUserProperty";

  private final ReactApplicationContext reactContext;

  RnAnalyticsProvider(ReactApplicationContext reactContext) {
    this.reactContext = reactContext;
  }

  @Override
  public void logEvent(String name, Bundle params) {
    WritableMap payload = Arguments.createMap();
    payload.putString("name", name);
    payload.putMap("params", Arguments.fromBundle(params != null ? params : new Bundle()));
    emit(EVENT_LOG, payload);
  }

  @Override
  public void setUserProperty(String name, String value) {
    WritableMap payload = Arguments.createMap();
    payload.putString("name", name);
    if (value == null) {
      payload.putNull("value");
    } else {
      payload.putString("value", value);
    }
    emit(EVENT_USER_PROPERTY, payload);
  }

  private void emit(String eventName, WritableMap payload) {
    if (!reactContext.hasActiveReactInstance()) {
      return;
    }
    reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
        .emit(eventName, payload);
  }
}
