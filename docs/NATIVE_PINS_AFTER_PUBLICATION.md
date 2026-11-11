# Native pins after publication (not applied)

Current candidate pins intentionally remain Android 2.3.0 and CocoaPods ~>1.1.
Only after approved Android 3.0.0 and iOS 2.0.0 artifacts are publicly available:

1. Change android/build.gradle: ai.bridgee:bridgee-android-sdk:2.3.0 to ai.bridgee:bridgee-android-sdk:3.0.0.
2. Change BridgeeReactNativeSdk.podspec: BridgeeAiSDK, ~>1.1 to BridgeeAiSDK, 2.0.0 (exact release).
3. Rebuild and pack RN0.2.0; validate the exact tarball, clean consumer, native hosts and resolved lockfiles.
4. Complete customer routing/device/store and Firebase/GA4 acceptance before rollout.

Do not change old published versions or existing customer lockfiles automatically. No pin change, registry publication or tag is performed by this document.

Prepared patch: `patches/native-pins-after-publication.patch`. It is intentionally not applied. Verify both native registry artifacts before applying it.
