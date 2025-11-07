import { TurboModule, TurboModuleRegistry } from "react-native";

interface InitializeBridgeeSdkResponse {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
}

export interface Spec extends TurboModule {
  initializeBridgeeSDK(apiKey: string, secretKey: string): Promise<InitializeBridgeeSdkResponse>;
}

export default TurboModuleRegistry.get<Spec>("RNBridgeeAiSDK") as Spec | null;