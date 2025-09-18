package com.rnbridgeeaisdk;

import ai.bridgee.android.sdk.BridgeeSDK;
import ai.bridgee.android.sdk.AnalyticsProvider;
import ai.bridgee.android.sdk.MatchBundle;
import com.google.firebase.FirebaseApp;
import com.google.firebase.analytics.FirebaseAnalytics;
import android.content.SharedPreferences;
import android.content.Context;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import com.rnbridgeeaisdk.NativeRNBridgeeAiSDKSpec;
import com.rnbridgeeaisdk.BridgeeFirebaseAnalyticsProvider;

public class BridgeeAiModule extends NativeRNBridgeeAiSDKSpec {

    private static final String TAG = "BridgeeAiModule";
    public static String NAME = "RNBridgeeAiSDK";
    public static final String FIRST_LAUNCH_KEY = "bridgee_first_launch";

    private FirebaseAnalytics firebaseAnalytics;
    public BridgeeSDK bridgeeSdk;

    BridgeeAiModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    @NonNull
    public String getName() {
        return NAME;
    }

    private void initializeFirebaseAnalytics() {
        try {
            // Verifica todas as instâncias do Firebase disponíveis
            List<FirebaseApp> apps = FirebaseApp.getApps(getReactApplicationContext());
            Log.d(TAG, "Firebase Apps encontrados: " + apps.size());
            
            for (FirebaseApp app : apps) {
                Log.d(TAG, "Firebase App: " + app.getName());
                Log.d(TAG, "Firebase Project ID: " + app.getOptions().getProjectId());
                Log.d(TAG, "Firebase App ID: " + app.getOptions().getApplicationId());
            }
            
            // Pega a instância padrão
            FirebaseApp defaultApp = FirebaseApp.getInstance();
            Log.d(TAG, "Default App Project ID: " + defaultApp.getOptions().getProjectId());
            
            // Inicializa o Analytics
            this.firebaseAnalytics = FirebaseAnalytics.getInstance(getReactApplicationContext());
            Log.d(TAG, "Firebase Analytics inicializado com sucesso");
            
        } catch (IllegalStateException e) {
            Log.e(TAG, "Erro ao inicializar Firebase: " + e.getMessage());
            throw new IllegalStateException(
                "Firebase não está inicializado no aplicativo. " +
                "Certifique-se de que o google-services.json está configurado corretamente.", e
            );
        }
    }

    @Override
    public void initializeBridgeeSDK(String logEvent,String apiKey, String secretKey, Promise promise) {
      try {
        if (this.firebaseAnalytics == null) {
            initializeFirebaseAnalytics();
        }

        BridgeeFirebaseAnalyticsProvider analyticsProvider = new BridgeeFirebaseAnalyticsProvider(firebaseAnalytics);
        // Initialize Bridgee SDK with Firebase Analytics instance
        bridgeeSdk = BridgeeSDK.getInstance(getReactApplicationContext(), analyticsProvider, apiKey, secretKey, false);

        // Check if this is the first app launch
        if (isFirstLaunch()) {
            Bundle params = new Bundle();
            params.putString("source", "react_native");

            MatchBundle matchBundle = new MatchBundle();

            // Execute first_open event
            bridgeeSdk.logEvent(logEvent, params, matchBundle);

            // Mark that first launch has been completed
            markFirstLaunchCompleted();
            promise.resolve("Bridgee SDK initialized and first launch event logged");
        } else {
            promise.reject("BridgeeSDK", "Not the first launch");
        }
      } catch (Exception e) {
        promise.reject("BridgeeSDK", "Error initializing Bridgee SDK: " + e.getMessage());
      }
    }

    private boolean isFirstLaunch() {
      SharedPreferences prefs = getReactApplicationContext().getSharedPreferences("bridgee_prefs", Context.MODE_PRIVATE);
      return !prefs.getBoolean(FIRST_LAUNCH_KEY, false);
    }
    
    private void markFirstLaunchCompleted() {
      SharedPreferences prefs = getReactApplicationContext().getSharedPreferences("bridgee_prefs", Context.MODE_PRIVATE);
      SharedPreferences.Editor editor = prefs.edit();
      editor.putBoolean(FIRST_LAUNCH_KEY, true);
      editor.apply();
    }
}