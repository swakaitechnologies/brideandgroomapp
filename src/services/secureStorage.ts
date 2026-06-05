import EncryptedStorage from 'react-native-encrypted-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules } from 'react-native';

// Check if the native module for EncryptedStorage is actually linked and loaded.
const isNativeModuleAvailable = !!(NativeModules && NativeModules.RNEncryptedStorage);
const isProduction = typeof __DEV__ !== 'undefined' ? !__DEV__ : true;

if (!isNativeModuleAvailable) {
  if (isProduction) {
    console.error("[SecureStorage Error]: react-native-encrypted-storage native module is missing in production!");
  } else {
    console.warn(
      "[SecureStorage Warning]: react-native-encrypted-storage native module is NOT available! " +
      "Falling back to AsyncStorage. Please rebuild your mobile binary (e.g., run `npm run android` or `npm run ios`) " +
      "to link the native module correctly."
    );
  }
}

export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (isNativeModuleAvailable) {
        return await EncryptedStorage.getItem(key);
      }
      if (isProduction) {
        throw new Error("Security Error: EncryptedStorage is not available in production environment!");
      }
    } catch (error) {
      if (isProduction) {
        throw error;
      }
      console.warn("SecureStorage getItem error, falling back to AsyncStorage:", error);
    }
    
    // Fallback to AsyncStorage (development only)
    try {
      return await AsyncStorage.getItem(key);
    } catch (fallbackError) {
      console.warn("AsyncStorage fallback getItem error:", fallbackError);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (isNativeModuleAvailable) {
        await EncryptedStorage.setItem(key, value);
        return;
      }
      if (isProduction) {
        throw new Error("Security Error: EncryptedStorage is not available in production environment!");
      }
    } catch (error) {
      if (isProduction) {
        throw error;
      }
      console.warn("SecureStorage setItem error, falling back to AsyncStorage:", error);
    }

    // Fallback to AsyncStorage (development only)
    try {
      await AsyncStorage.setItem(key, value);
    } catch (fallbackError) {
      console.warn("AsyncStorage fallback setItem error:", fallbackError);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (isNativeModuleAvailable) {
        await EncryptedStorage.removeItem(key);
        return;
      }
      if (isProduction) {
        throw new Error("Security Error: EncryptedStorage is not available in production environment!");
      }
    } catch (error) {
      if (isProduction) {
        throw error;
      }
      console.warn("SecureStorage removeItem error, falling back to AsyncStorage:", error);
    }

    // Fallback to AsyncStorage (development only)
    try {
      await AsyncStorage.removeItem(key);
    } catch (fallbackError) {
      console.warn("AsyncStorage fallback removeItem error:", fallbackError);
    }
  }
};

