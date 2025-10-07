package com.rnbridgeeaisdk;

import android.os.Bundle;
import ai.bridgee.android.sdk.AnalyticsProvider;
import com.google.firebase.analytics.FirebaseAnalytics;

import android.content.Context;

/**
 * AnalyticsProvider implementation that forwards events to Firebase Analytics.
 */
public class BridgeeFirebaseAnalyticsProvider implements AnalyticsProvider {

  public FirebaseAnalytics analytics;

  BridgeeFirebaseAnalyticsProvider(FirebaseAnalytics analytics) {
    this.analytics = analytics;
  }

  @Override
  public void logEvent(String name, Bundle params) {
    analytics.logEvent(name, params);
  }

  @Override
  public void setUserProperty(String name, String value){
    analytics.setUserProperty(name, value);
  };
}
