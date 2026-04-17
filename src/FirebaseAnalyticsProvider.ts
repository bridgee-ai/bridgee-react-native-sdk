import type { AnalyticsProvider } from './AnalyticsProvider';

const MISSING_DEP_MESSAGE =
  "FirebaseAnalyticsProvider requires '@react-native-firebase/analytics' to be installed. " +
  "Run: yarn add @react-native-firebase/app @react-native-firebase/analytics";

function loadAnalytics(): () => {
  logEvent: (name: string, params?: Record<string, unknown>) => Promise<void> | void;
  setUserProperty: (name: string, value: string | null) => Promise<void> | void;
} {
  try {
    return require('@react-native-firebase/analytics').default;
  } catch (_e) {
    throw new Error(MISSING_DEP_MESSAGE);
  }
}

export const FirebaseAnalyticsProvider: AnalyticsProvider = {
  logEvent(name, params) {
    const analytics = loadAnalytics();
    void analytics().logEvent(name, params);
  },
  setUserProperty(name, value) {
    const analytics = loadAnalytics();
    void analytics().setUserProperty(name, value);
  },
};
