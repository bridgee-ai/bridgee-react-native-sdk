package ai.bridgee.reactnative;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableMapKeySetIterator;
import com.facebook.react.bridge.WritableMap;
import ai.bridgee.android.sdk.BridgeeSDK;
import ai.bridgee.android.sdk.MatchBundle;
import ai.bridgee.android.sdk.MatchResponse;
import ai.bridgee.android.sdk.ResponseCallback;

public class BridgeeSdkModule extends ReactContextBaseJavaModule {

  public static final String NAME = "BridgeeSdk";

  private final ReactApplicationContext reactContext;
  private BridgeeSDK sdk;

  public BridgeeSdkModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @NonNull
  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void configure(String tenantId, String tenantKey, boolean dryRun, Promise promise) {
    try {
      RnAnalyticsProvider provider = new RnAnalyticsProvider(reactContext);
      sdk = BridgeeSDK.getInstance(reactContext.getApplicationContext(), provider, tenantId, tenantKey, dryRun);
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject("BRIDGEE_CONFIGURE_ERROR", e.getMessage(), e);
    }
  }

  @ReactMethod
  public void firstOpen(ReadableMap matchBundleMap, Promise promise) {
    if (sdk == null) {
      promise.reject("BRIDGEE_NOT_CONFIGURED", "configure() must be called before firstOpen()");
      return;
    }

    try {
      MatchBundle matchBundle = new MatchBundle();
      ReadableMapKeySetIterator it = matchBundleMap.keySetIterator();
      while (it.hasNextKey()) {
        String key = it.nextKey();
        String value = matchBundleMap.getString(key);
        if (value != null) {
          matchBundle.withCustomParam(key, value);
        }
      }

      sdk.firstOpen(matchBundle, new ResponseCallback<MatchResponse>() {
        @Override
        public void ok(MatchResponse response) {
          WritableMap result = Arguments.createMap();
          result.putString("utm_source", nullToEmpty(response.getUtmSource()));
          result.putString("utm_medium", nullToEmpty(response.getUtmMedium()));
          result.putString("utm_campaign", nullToEmpty(response.getUtmCampaign()));
          promise.resolve(result);
        }

        @Override
        public void error(Exception e) {
          promise.reject("BRIDGEE_FIRST_OPEN_ERROR", e.getMessage(), e);
        }
      });
    } catch (Exception e) {
      promise.reject("BRIDGEE_FIRST_OPEN_ERROR", e.getMessage(), e);
    }
  }

  @ReactMethod
  public void addListener(String eventName) {
    // Required for NativeEventEmitter; no-op on Android.
  }

  @ReactMethod
  public void removeListeners(int count) {
    // Required for NativeEventEmitter; no-op on Android.
  }

  private static String nullToEmpty(String v) {
    return v == null ? "" : v;
  }
}
