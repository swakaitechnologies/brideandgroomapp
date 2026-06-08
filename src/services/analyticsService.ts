import AsyncStorage from '@react-native-async-storage/async-storage';

// Try importing firebase analytics dynamically or catch failure if not configured
let firebaseAnalytics: any = null;
try {
  // Gracefully require react-native-firebase analytics
  const analytics = require('@react-native-firebase/analytics').default;
  if (analytics) {
    firebaseAnalytics = analytics;
  }
} catch (e) {
  console.log('[ANALYTICS] Native Firebase Analytics modules not fully initialized. Falling back to console.');
}

/**
 * Checks if the user gave consent for usage analytics tracking under DPDP guidelines.
 */
export async function getAnalyticsConsent(): Promise<boolean> {
  try {
    const consent = await AsyncStorage.getItem('consent_analytics');
    if (consent !== null) {
      return consent === 'true';
    }
  } catch (error) {
    console.error('[ANALYTICS] Error reading consent from storage:', error);
  }
  return false; // Default to false (safe opt-in DPDP compliance policy)
}

/**
 * Updates consent state in local storage (called from AccountSettingScreen or RegisterScreen)
 */
export async function setAnalyticsConsent(consented: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem('consent_analytics', consented ? 'true' : 'false');
  } catch (error) {
    console.error('[ANALYTICS] Error saving consent to storage:', error);
  }
}

export const TrackService = {
  /**
   * Tracks a screen navigation view
   */
  async trackScreen(screenName: string, screenClass?: string) {
    const hasConsent = await getAnalyticsConsent();
    if (!hasConsent) {
      console.log(`[ANALYTICS BLOCKED] ScreenView '${screenName}' suppressed (No Consent).`);
      return;
    }

    console.log(`[ANALYTICS DISPATCHED] ScreenView: '${screenName}'`);
    if (firebaseAnalytics) {
      try {
        await firebaseAnalytics().logScreenView({
          screen_name: screenName,
          screen_class: screenClass || screenName,
        });
      } catch (err: any) {
        console.warn('[ANALYTICS ERROR] Failed to log screen view to Firebase:', err.message);
      }
    }
  },

  /**
   * Tracks custom events and user actions
   */
  async trackEvent(eventName: string, params: Record<string, any> = {}) {
    const hasConsent = await getAnalyticsConsent();
    if (!hasConsent) {
      console.log(`[ANALYTICS BLOCKED] Event '${eventName}' suppressed (No Consent).`);
      return;
    }

    console.log(`[ANALYTICS DISPATCHED] Event: '${eventName}' with params:`, params);
    if (firebaseAnalytics) {
      try {
        await firebaseAnalytics().logEvent(eventName, params);
      } catch (err: any) {
        console.warn('[ANALYTICS ERROR] Failed to log event to Firebase:', err.message);
      }
    }
  }
};
