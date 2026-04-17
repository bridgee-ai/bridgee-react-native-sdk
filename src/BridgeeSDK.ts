import { NativeEventEmitter, NativeModules, Platform } from 'react-native';
import type { AnalyticsProvider } from './AnalyticsProvider';
import type { MatchBundle } from './MatchBundle';
import type { UTMData } from './UTMData';

type ConfigureOptions = {
  provider: AnalyticsProvider;
  tenantId: string;
  tenantKey: string;
  dryRun?: boolean;
};

const LINKING_ERROR =
  `The package '@bridgee-ai/react-native-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go (use a development build instead)';

const isTurboModuleEnabled = (global as unknown as { __turboModuleProxy?: unknown })
  .__turboModuleProxy != null;

const NativeBridgeeSdk = isTurboModuleEnabled
  ? require('./NativeBridgeeSdk').default
  : NativeModules.BridgeeSdk;

if (!NativeBridgeeSdk) {
  throw new Error(LINKING_ERROR);
}

const EVENT_LOG = 'BridgeeAnalytics.logEvent';
const EVENT_USER_PROPERTY = 'BridgeeAnalytics.setUserProperty';

class BridgeeSDKImpl {
  private provider: AnalyticsProvider | null = null;
  private emitter: NativeEventEmitter | null = null;
  private subscriptions: Array<{ remove: () => void }> = [];

  async configure(options: ConfigureOptions): Promise<void> {
    if (!options || !options.provider) {
      throw new Error('BridgeeSDK.configure: `provider` is required');
    }
    if (!options.tenantId || !options.tenantKey) {
      throw new Error('BridgeeSDK.configure: `tenantId` and `tenantKey` are required');
    }

    this.teardownSubscriptions();

    this.provider = options.provider;
    this.emitter = new NativeEventEmitter(NativeBridgeeSdk);

    this.subscriptions.push(
      this.emitter.addListener(EVENT_LOG, this.onNativeLogEvent),
      this.emitter.addListener(EVENT_USER_PROPERTY, this.onNativeSetUserProperty),
    );

    await NativeBridgeeSdk.configure(
      options.tenantId,
      options.tenantKey,
      options.dryRun ?? false,
    );
  }

  async firstOpen(matchBundle: MatchBundle): Promise<UTMData> {
    if (!this.provider) {
      throw new Error('BridgeeSDK.firstOpen called before configure()');
    }
    return NativeBridgeeSdk.firstOpen(matchBundle.toJSON());
  }

  private onNativeLogEvent = (payload: { name: string; params?: Record<string, unknown> }) => {
    if (!this.provider) return;
    try {
      this.provider.logEvent(payload.name, payload.params ?? {});
    } catch (_e) {
      // Provider errors must not crash the native bridge. Swallow silently.
    }
  };

  private onNativeSetUserProperty = (payload: { name: string; value: string | null }) => {
    if (!this.provider) return;
    try {
      this.provider.setUserProperty(payload.name, payload.value);
    } catch (_e) {
      // See above.
    }
  };

  private teardownSubscriptions() {
    this.subscriptions.forEach((s) => s.remove());
    this.subscriptions = [];
    this.emitter = null;
  }
}

export const BridgeeSDK = new BridgeeSDKImpl();
