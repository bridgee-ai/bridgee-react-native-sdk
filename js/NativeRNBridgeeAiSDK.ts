import { TurboModule, TurboModuleRegistry } from "react-native";

export interface InitializeBridgeeSdkResponse {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
}

export interface Spec extends TurboModule {
  initializeBridgeeSDK(apiKey: string, secretKey: string): Promise<InitializeBridgeeSdkResponse>;
}

export const RNBridgeeAiSDK = TurboModuleRegistry.get<Spec>("RNBridgeeAiSDK") as Spec | null;