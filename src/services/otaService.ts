import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, NativeModules, Platform } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { API_BASE_URL } from './api';

const NATIVE_VERSION = '0.0.1'; // Static native app binary version
const BUNDLE_VERSION_KEY = 'ota_bundle_version';
export const DEFAULT_BUNDLE_VERSION = '1.1.0';

export interface OtaCheckResponse {
  success: boolean;
  updateAvailable: boolean;
  version?: string;
  bundleUrl?: string;
  releaseNotes?: string;
}

/**
 * Get current OTA bundle version of the app from AsyncStorage.
 */
export async function getCurrentBundleVersion(): Promise<string> {
  try {
    const version = await AsyncStorage.getItem(BUNDLE_VERSION_KEY);
    return version || DEFAULT_BUNDLE_VERSION;
  } catch (error) {
    console.warn('[OTA] Error reading bundle version:', error);
    return DEFAULT_BUNDLE_VERSION;
  }
}

/**
 * Check for updates, download bundle if available, and prompt restart.
 */
export async function checkForOtaUpdates() {
  if (Platform.OS !== 'android') return; // OTA currently targeted for Android

  try {
    // Sync stored version with the executing bundle's hardcoded version first
    await AsyncStorage.setItem(BUNDLE_VERSION_KEY, DEFAULT_BUNDLE_VERSION);

    const currentBundleVersion = await getCurrentBundleVersion();
    console.log(`[OTA] Checking for updates. Native: ${NATIVE_VERSION}, Bundle: ${currentBundleVersion}`);

    const response = await fetch(
      `${API_BASE_URL}/ota/check?nativeVersion=${NATIVE_VERSION}&bundleVersion=${currentBundleVersion}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Mobile-App': 'true',
        },
      }
    );

    const result: OtaCheckResponse = await response.json();
    if (!result.success || !result.updateAvailable || !result.bundleUrl || !result.version) {
      console.log('[OTA] App is up to date.');
      return;
    }

    console.log(`[OTA] New update available: ${result.version}. Preparing download...`);
    await downloadAndApplyUpdate(result.bundleUrl, result.version, result.releaseNotes || '');
  } catch (error) {
    console.warn('[OTA] Check update failed:', error);
  }
}

/**
 * Download the JS bundle and prompt the user to apply the update.
 */
async function downloadAndApplyUpdate(bundleUrl: string, newVersion: string, releaseNotes: string) {
  const otaDir = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/ota`;
  const targetPath = `${otaDir}/index.android.bundle`;

  try {
    // Ensure the ota subdirectory exists
    const dirExists = await ReactNativeBlobUtil.fs.isDir(otaDir);
    if (!dirExists) {
      await ReactNativeBlobUtil.fs.mkdir(otaDir);
    }

    console.log(`[OTA] Downloading bundle to: ${targetPath}`);

    // Download file
    const res = await ReactNativeBlobUtil.config({
      path: targetPath,
      overwrite: true,
    }).fetch('GET', bundleUrl);

    const status = res.info().status;
    if (status !== 200) {
      throw new Error(`FCM server returned status code ${status}`);
    }

    console.log(`[OTA] Download completed. Saved version: ${newVersion}`);

    // Save version in storage
    await AsyncStorage.setItem(BUNDLE_VERSION_KEY, newVersion);

    // Prompt user to reload
    Alert.alert(
      'Update Ready',
      `A new version of the app (${newVersion}) is ready to install.\n\nRelease notes:\n${releaseNotes || 'Bug fixes and improvements'}`,
      [
        {
          text: 'Later',
          style: 'cancel',
        },
        {
          text: 'Update Now',
          onPress: () => {
            console.log('[OTA] Reloading app to apply update...');
            if (NativeModules.PushNotificationModule && typeof NativeModules.PushNotificationModule.reloadApp === 'function') {
              NativeModules.PushNotificationModule.reloadApp();
            } else {
              console.warn('[OTA] PushNotificationModule.reloadApp is not available.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  } catch (error: any) {
    console.warn('[OTA] Download or apply update failed:', error.message);
    // Cleanup partial file if error occurs
    try {
      const fileExists = await ReactNativeBlobUtil.fs.exists(targetPath);
      if (fileExists) {
        await ReactNativeBlobUtil.fs.unlink(targetPath);
      }
    } catch (cleanupError) {
      // Ignored
    }
  }
}
