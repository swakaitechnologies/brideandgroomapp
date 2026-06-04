import { NativeModules, Platform, DeviceEventEmitter } from 'react-native';
import { saveFcmToken } from './api';
import { showToast } from '../utils/toast';

const { PushNotificationModule } = NativeModules;

console.log('[PUSH] Native PushNotificationModule:', PushNotificationModule);

/**
 * Request notification permissions from the user.
 * Fetch the FCM token and register it on the backend.
 */
export async function setupPushNotifications() {
  if (Platform.OS !== 'android') {
    console.log('[PUSH] Push notifications setup is currently only implemented for Android.');
    return;
  }

  if (!PushNotificationModule) {
    console.warn('[PUSH] PushNotificationModule is not available in NativeModules.');
    return;
  }

  try {
    // Create the default notification channel for Android 8.0+
    await PushNotificationModule.createNotificationChannel(
      'default',
      'Default',
      'Used for general app alerts, messages, and matches.'
    );
    console.log('[PUSH] Default notification channel registered.');

    const hasPermission = await PushNotificationModule.hasPermission();
    if (hasPermission) {
      console.log('[PUSH] Notification permissions already granted.');
      await registerFcmToken();
    } else {
      console.log('[PUSH] Requesting notification permission...');
      const granted = await PushNotificationModule.requestPermission();
      if (granted) {
        console.log('[PUSH] Notification permission granted after request.');
        await registerFcmToken();
      } else {
        console.log('[PUSH] Notification permission denied.');
      }
    }
  } catch (error: any) {
    console.warn('[PUSH] Failed to setup push notifications:', error.message);
  }
}

/**
 * Fetch token and upload to backend
 */
async function registerFcmToken() {
  if (!PushNotificationModule) return;
  try {
    const token = await PushNotificationModule.getToken();
    if (token) {
      console.log('[PUSH] Retrieved FCM Token successfully:', token);
      await saveFcmToken(token);
      console.log('[PUSH] Registered FCM Token on backend.');
    } else {
      console.warn('[PUSH] FCM Token is null or empty.');
    }
  } catch (error: any) {
    console.warn('[PUSH] Error fetching/saving FCM Token:', error.message);
  }
}

/**
 * Monitor token refreshes and re-upload if updated
 */
export function listenToTokenRefresh() {
  if (Platform.OS !== 'android' || !PushNotificationModule) {
    return () => {};
  }

  try {
    const subscription = DeviceEventEmitter.addListener('onTokenRefresh', async (token: string) => {
      console.log('[PUSH] FCM Token refreshed. Re-registering:', token);
      try {
        await saveFcmToken(token);
      } catch (err: any) {
        console.warn('[PUSH] Failed to register refreshed token:', err.message);
      }
    });

    return () => {
      subscription.remove();
    };
  } catch (error: any) {
    console.warn('[PUSH] Token refresh listener error:', error.message);
    return () => {};
  }
}

/**
 * Set up listeners for notification taps (when app is in background or quit state)
 */
export function setupNotificationListeners(navigationRef: any) {
  if (Platform.OS !== 'android' || !PushNotificationModule) {
    return () => {};
  }

  try {
    // Handle foreground received notifications
    const fgSubscription = DeviceEventEmitter.addListener('onNotificationReceived', (remoteMessage: any) => {
      console.log('[PUSH] Foreground notification received event:', remoteMessage);
      if (remoteMessage.notification) {
        showToast(remoteMessage.notification.body, remoteMessage.notification.title);
      } else if (remoteMessage.data && remoteMessage.data.message) {
        showToast(remoteMessage.data.message, remoteMessage.data.title || "Notification");
      }
    });

    // Handle notification click when app is running (foreground or background listener)
    const subscription = DeviceEventEmitter.addListener('onNotificationOpenedApp', (remoteMessage: any) => {
      console.log('[PUSH] App opened from background state by notification event:', remoteMessage);
      handleNotificationNavigation(remoteMessage, navigationRef);
    });

    // Check if the app was opened from a completely closed (quit) state
    PushNotificationModule.getInitialNotification()
      .then((remoteMessage: any) => {
        if (remoteMessage) {
          console.log('[PUSH] App opened from quit state by notification:', remoteMessage);
          // Small timeout to let navigation mount
          setTimeout(() => {
            handleNotificationNavigation(remoteMessage, navigationRef);
          }, 1500);
        }
      })
      .catch((err: any) => {
        console.warn('[PUSH] getInitialNotification error:', err.message);
      });

    return () => {
      subscription.remove();
      fgSubscription.remove();
    };
  } catch (error: any) {
    console.warn('[PUSH] Error setting up notification listeners:', error.message);
    return () => {};
  }
}

/**
 * Router utility to navigate to the correct screen when a user clicks a notification
 */
function handleNotificationNavigation(remoteMessage: any, navigationRef: any) {
  if (!remoteMessage || !remoteMessage.data || !navigationRef) return;

  const { type, relatedId } = remoteMessage.data;
  console.log(`[PUSH] Navigating for notification type: ${type}, relatedId: ${relatedId}`);

  try {
    switch (type) {
      case 'chat':
      case 'message':
        if (relatedId) {
          navigationRef.navigate('ChatDetail', { chatId: relatedId });
        } else {
          navigationRef.navigate('Tabs', { screen: 'Chats' });
        }
        break;
      case 'interest':
      case 'interest_accept':
      case 'photo_request':
      case 'photo_approve':
      case 'contact_request':
      case 'contact_accept':
      case 'contact_reveal':
        navigationRef.navigate('Notifications');
        break;
      case 'kyc':
        navigationRef.navigate('KYCVerification');
        break;
      case 'feedback':
        navigationRef.navigate('HelpSupport');
        break;
      default:
        navigationRef.navigate('Notifications');
        break;
    }
  } catch (err: any) {
    console.warn('[PUSH] Navigation handler error:', err.message);
  }
}
