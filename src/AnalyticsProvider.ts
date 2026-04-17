export interface AnalyticsProvider {
  logEvent(name: string, params: Record<string, unknown>): void;
  setUserProperty(name: string, value: string | null): void;
}
