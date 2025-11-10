import { TurboModule, TurboModuleRegistry } from "react-native";

interface InitializeBridgeeSdkResponse {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
}

export interface Spec extends TurboModule {
  initializeBridgeeSDK(apiKey: string, secretKey: string): Promise<InitializeBridgeeSdkResponse>;
}

export default TurboModuleRegistry.get<Spec>("RNBridgeeAiSDK") as Spec | null;