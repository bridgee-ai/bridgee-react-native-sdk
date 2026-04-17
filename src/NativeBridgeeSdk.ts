import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  configure(tenantId: string, tenantKey: string, dryRun: boolean): Promise<void>;
  firstOpen(matchBundle: { [key: string]: string }): Promise<{
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
  }>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('BridgeeSdk');
