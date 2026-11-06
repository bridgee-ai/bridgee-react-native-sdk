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

export type DeferredLinkStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export type DeferredLinkOptions = {
  /** Explicit link from an app-owned continuation flow. Required on iOS; never inferred from IP. */
  blinklink?: string;
  /** App-owned durable storage (e.g. AsyncStorage). Use the same instance when acknowledging navigation. */
  storage?: DeferredLinkStorage;
  /** Organization-scoped Blinklink URL prefixes, ending in / (e.g. https://go.bridgee.app/tenda/). */
  blinklinkPrefixes: string[];
  /** Exact HTTPS origins of App Links claimed by this app. */
  appLinkOrigins: string[];
  /** Override only for a Bridgee-owned staging API. */
  resolverOrigin?: string;
};

export type DeferredDestination = {
  /** Organization-scoped published link identity, suitable for app-side content routing. */
  blinklink: string;
  /** HTTPS Android App Link configured on that published link. */
  appLink: string;
};

const DEFERRED_CONTENT_TYPE = 'application/vnd.bridgee.deferred+json';

function publicHttpsUrl(value: unknown): URL | null {
  if (typeof value !== 'string' || value.length > 2048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || !url.hostname) return null;
    return url;
  } catch {
    return null;
  }
}

const LINKING_ERROR =
  `The package '@bridgee-ai/react-native-sdk' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go (use a development build instead)';

const isTurboModuleEnabled = (globalThis as unknown as { __turboModuleProxy?: unknown })
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
  private tenantFirstOpenEvent = '';

  async configure(options: ConfigureOptions): Promise<void> {
    if (!options || !options.provider) {
      throw new Error('BridgeeSDK.configure: `provider` is required');
    }
    if (!options.tenantId || !options.tenantKey) {
      throw new Error('BridgeeSDK.configure: `tenantId` and `tenantKey` are required');
    }

    this.teardownSubscriptions();

    this.provider = null;
    this.tenantFirstOpenEvent = `${options.tenantId.replace(/-/g, '_')}_first_open`;
    this.emitter = new NativeEventEmitter(NativeBridgeeSdk);

    this.subscriptions.push(
      this.emitter.addListener(EVENT_LOG, this.onNativeLogEvent),
      this.emitter.addListener(EVENT_USER_PROPERTY, this.onNativeSetUserProperty),
    );

    try {
      await NativeBridgeeSdk.configure(
        options.tenantId,
        options.tenantKey,
        options.dryRun ?? false,
      );
      this.provider = options.provider;
    } catch (error) {
      this.teardownSubscriptions();
      this.tenantFirstOpenEvent = '';
      throw error;
    }
  }

  async firstOpen(matchBundle: MatchBundle): Promise<UTMData> {
    if (!this.provider) {
      throw new Error('BridgeeSDK.firstOpen called before configure()');
    }
    return NativeBridgeeSdk.firstOpen(matchBundle.toJSON());
  }

  /** Policy-aware entry; no native request or campaign delivery when consent is denied or Google owns attribution. */
  async firstOpenWithConsent(matchBundle: MatchBundle, policy: { consentGranted: boolean; preserveNativeGoogleAttribution: boolean }): Promise<UTMData> {
    if (policy?.consentGranted !== true) throw new Error('attribution_consent_required');
    if (typeof policy.preserveNativeGoogleAttribution !== 'boolean') throw new Error('native_google_policy_required');
    if (policy.preserveNativeGoogleAttribution) return { utm_source: '', utm_medium: '', utm_campaign: '' };
    return this.firstOpen(matchBundle);
  }

  /**
   * Resolve a Play Install Referrer Blinklink to this app's configured App Link.
   * Returns null when unavailable or when either origin is outside the app's allowlists.
   * The host app decides when and whether to navigate; this does not emit an install.
   */
  async getDeferredDestination(options: DeferredLinkOptions): Promise<DeferredDestination | null> {
    if (!options?.blinklinkPrefixes?.length || !options?.appLinkOrigins?.length) {
      throw new Error('BridgeeSDK.getDeferredDestination requires Blinklink prefixes and App Link origins');
    }
    const controller = new AbortController();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const resolve = async (): Promise<DeferredDestination | null> => {
        const candidate = options.blinklink ?? (Platform.OS === 'ios' ? null : await NativeBridgeeSdk.getDeferredLink());
        const link = publicHttpsUrl(candidate);
        if (!link || link.search || link.hash) return null;
        const withinOrganization = options.blinklinkPrefixes.some((value) => {
          const prefix = publicHttpsUrl(value);
          return prefix && prefix.pathname.endsWith('/') && !prefix.search && !prefix.hash &&
            link.origin === prefix.origin && link.pathname.startsWith(prefix.pathname);
        });
        if (!withinOrganization) return null;
        const key = this.deferredStorageKey(link.toString());
        if (options.storage && await options.storage.getItem(key) === 'consumed') return null;
        if (controller.signal.aborted) return null;

        const resolver = publicHttpsUrl(options.resolverOrigin ?? 'https://api.bridgee.ai');
        if (!resolver || resolver.pathname !== '/' || resolver.search || resolver.hash) return null;
        const endpoint = new URL('/deferred', resolver.toString());
        endpoint.searchParams.set('platform', Platform.OS === 'ios' ? 'ios' : 'android');
        endpoint.searchParams.set('link', link.toString());
        const response = await fetch(endpoint.toString(), {
          headers: { Accept: DEFERRED_CONTENT_TYPE }, signal: controller.signal,
          redirect: 'error', credentials: 'omit',
        });
        if (!response.ok || (response.url && response.url !== endpoint.toString()) ||
            response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !== DEFERRED_CONTENT_TYPE) return null;
        const payload: unknown = await response.json();
        if (controller.signal.aborted || typeof payload !== 'object' || !payload) return null;
        const result = payload as { link?: unknown; appLink?: unknown };
        const destination = publicHttpsUrl(result.appLink);
        if (result.link !== link.toString() || !destination || destination.toString() === link.toString()) return null;
        return options.appLinkOrigins.includes(destination.origin)
          ? { blinklink: link.toString(), appLink: destination.toString() } : null;
      };
      // Bound native referrer, storage, HTTP headers AND response body. Aborting alone
      // does not bound a native promise or a custom storage implementation.
      return await Promise.race([
        resolve(),
        new Promise<null>((done) => { timeout = setTimeout(() => { controller.abort(); done(null); }, 8000); }),
      ]);
    } catch {
      return null;
    } finally {
      if (timeout !== undefined) clearTimeout(timeout);
    }
  }

  /** Call only AFTER the app successfully routes to the destination. Failed/offline lookups stay retriable. */
  async acknowledgeDeferredDestination(destination: DeferredDestination, storage: DeferredLinkStorage): Promise<void> {
    const link = publicHttpsUrl(destination?.blinklink);
    if (!link || link.search || link.hash || !storage) throw new Error('invalid_deferred_acknowledgement');
    await storage.setItem(this.deferredStorageKey(link.toString()), 'consumed');
  }

  private deferredStorageKey(link: string): string {
    return `bridgee:deferred:v1:${encodeURIComponent(link)}`;
  }

  private onNativeLogEvent = (payload: { name: string; params?: Record<string, unknown> }) => {
    if (!this.provider) return;
    // Compatibilidade com versões nativas anteriores: first_open pertence ao Firebase.
    if (payload.name === 'first_open' || payload.name === this.tenantFirstOpenEvent) return;
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
