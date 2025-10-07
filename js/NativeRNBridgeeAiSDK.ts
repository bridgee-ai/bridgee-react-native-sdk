import { TurboModule, TurboModuleRegistry } from "react-native";

export interface Spec extends TurboModule {
  initializeBridgeeSDK(apiKey: string, secretKey: string): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>("RNBridgeeAiSDK") as Spec | null;