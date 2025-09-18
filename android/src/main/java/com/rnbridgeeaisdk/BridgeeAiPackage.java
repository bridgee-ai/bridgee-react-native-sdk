package com.rnbridgeeaisdk;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.react.BaseReactPackage;

import java.util.Collections;
import java.util.List;
import java.util.HashMap;
import java.util.Map;

public class BridgeeAiPackage extends BaseReactPackage {

  @Nullable
  @Override
  public NativeModule getModule(String name, ReactApplicationContext reactContext) {
    if (name.equals(BridgeeAiModule.NAME)) {
      return new BridgeeAiModule(reactContext);
    } else {
      return null;
    }
  }

  @Override
  public ReactModuleInfoProvider getReactModuleInfoProvider() {
    return () -> {
      final Map<String, ReactModuleInfo> moduleInfos = new HashMap<>();
      moduleInfos.put(
        BridgeeAiModule.NAME,
        new ReactModuleInfo(
          BridgeeAiModule.NAME,
          BridgeeAiModule.NAME,
          false, // canOverrideExistingModule
          false, // needsEagerInit
          false, // isCxxModule
          true // isTurboModule
      ));
      return moduleInfos;
    };
  }
}