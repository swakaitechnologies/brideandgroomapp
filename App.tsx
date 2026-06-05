import React, { useState, useEffect } from 'react';
import { StatusBar, useColorScheme, View, ActivityIndicator, StyleSheet, Text as RNText } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from './src/services/secureStorage';
import OfflineOverlay from './src/components/OfflineOverlay';
import Toast, { ToastConfig } from 'react-native-toast-message';
import { ShieldCheck, Zap, Info, AlertTriangle } from 'lucide-react-native';

export const navigationRef = createNavigationContainerRef();


// Screens
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import TabsScreen from './src/screens/main/TabsScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import VerifyEmailScreen from './src/screens/auth/VerifyEmailScreen';
import OnboardingScreen from './src/screens/core/OnboardingScreen';
import SafetyScreen from './src/screens/core/SafetyScreen';
import ProfileDetailScreen from './src/screens/profile/ProfileDetailScreen';
import MyPhotosScreen from './src/screens/profile/MyPhotosScreen';
import KYCVerificationScreen from './src/screens/profile/KYCVerificationScreen';
import EditProfileScreen from './src/screens/profile/EditProfileScreen';
import PartnerPreferenceScreen from './src/screens/profile/PartnerPreferenceScreen';
import ContactFilterScreen from './src/screens/profile/ContactFilterScreen';
import AccountSettingScreen from './src/screens/profile/AccountSettingScreen';
import HelpSupportScreen from './src/screens/profile/HelpSupportScreen';
import CheckoutScreen from './src/screens/checkout/CheckoutScreen';
import ModalScreen from './src/screens/core/ModalScreen';
import NotFoundScreen from './src/screens/core/NotFoundScreen';
import ChatDetailScreen from './src/screens/main/ChatDetailScreen';
import NotificationsScreen from './src/screens/main/NotificationsScreen';
import TermsConditionsScreen from './src/screens/core/TermsConditionsScreen';
import PrivacyPolicyScreen from './src/screens/core/PrivacyPolicyScreen';
import RefundPolicyScreen from './src/screens/core/RefundPolicyScreen';
import SplashScreen from './src/screens/core/SplashScreen';
import IncomingCallScreen from './src/screens/main/IncomingCallScreen';
import VideoCallScreen from './src/screens/main/VideoCallScreen';
import SearchProfilesScreen from './src/screens/main/SearchProfilesScreen';

const Stack = createNativeStackNavigator();

console.log('[APP] App.tsx file loaded and evaluated!');

const linking = {
  prefixes: ['brideandgroom://', 'https://brideandgroom.co.in', 'http://brideandgroom.co.in'],
  config: {
    screens: {
      ProfileDetail: 'profile/:id',
    },
  },
};

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndOnboarding = async () => {
      const startTime = Date.now();
      let targetRoute = 'Welcome';
      try {
        const onboardingDone = await AsyncStorage.getItem('onboardingDone');
        if (onboardingDone !== 'true') {
          targetRoute = 'Onboarding';
        } else {
          const token = await secureStorage.getItem('token');
          if (token) {
            targetRoute = 'Tabs';
          } else {
            targetRoute = 'Welcome';
          }
        }
      } catch (e) {
        targetRoute = 'Welcome';
      }

      // Ensure the splash screen shows for at least 1.0 second (1000ms)
      const elapsedTime = Date.now() - startTime;
      const delay = Math.max(0, 1000 - elapsedTime);

      setTimeout(() => {
        setInitialRoute(targetRoute);
        // Show Toast about current version
        Toast.show({
          type: 'info',
          text1: 'Bride & Groom Matchmaking',
          text2: 'Running latest version: 1.1.0',
          position: 'top',
          visibilityTime: 4000,
        });
      }, delay);
    };
    checkAuthAndOnboarding();
  }, []);

  if (initialRoute === null) {
    return <SplashScreen />;
  }

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <OfflineOverlay />
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <NavigationContainer ref={navigationRef} linking={linking}>
          <Stack.Navigator 
            initialRouteName={initialRoute}
            screenOptions={{
              headerShown: false,
            }}
          >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Tabs" component={TabsScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
            <Stack.Screen name="Safety" component={SafetyScreen} />
            <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} />
            <Stack.Screen name="MyPhotos" component={MyPhotosScreen} />
            <Stack.Screen name="KYCVerification" component={KYCVerificationScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="PartnerPreference" component={PartnerPreferenceScreen} />
            <Stack.Screen name="ContactFilter" component={ContactFilterScreen} />
            <Stack.Screen name="AccountSetting" component={AccountSettingScreen} />
            <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} />
            <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="IncomingCall" component={IncomingCallScreen} />
            <Stack.Screen name="VideoCall" component={VideoCallScreen} />
            <Stack.Screen name="SearchProfiles" component={SearchProfilesScreen} />
            <Stack.Screen name="Modal" component={ModalScreen} />
            <Stack.Screen name="NotFound" component={NotFoundScreen} />
            <Stack.Screen name="TermsConditions" component={TermsConditionsScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
            <Stack.Screen name="RefundPolicy" component={RefundPolicyScreen} />
          </Stack.Navigator>
        </NavigationContainer>
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </Provider>
  );
}

const toastConfig: ToastConfig = {
  success: ({ text1, text2 }: any) => (
    <View style={[styles.toastBase, styles.toastSuccess]}>
      <View style={styles.toastIconContainer}>
        <ShieldCheck size={20} color="#4CAF50" />
      </View>
      <View style={styles.toastContent}>
        {text1 ? <RNText style={styles.toastTitle}>{text1}</RNText> : null}
        {text2 ? <RNText style={styles.toastSub}>{text2}</RNText> : null}
      </View>
    </View>
  ),
  error: ({ text1, text2 }: any) => (
    <View style={[styles.toastBase, styles.toastError]}>
      <View style={styles.toastIconContainer}>
        <Zap size={20} color="#FF3B30" />
      </View>
      <View style={styles.toastContent}>
        {text1 ? <RNText style={styles.toastTitle}>{text1}</RNText> : null}
        {text2 ? <RNText style={styles.toastSub}>{text2}</RNText> : null}
      </View>
    </View>
  ),
  info: ({ text1, text2 }: any) => (
    <View style={[styles.toastBase, styles.toastInfo]}>
      <View style={styles.toastIconContainer}>
        <Info size={20} color="#3B1E54" />
      </View>
      <View style={styles.toastContent}>
        {text1 ? <RNText style={styles.toastTitle}>{text1}</RNText> : null}
        {text2 ? <RNText style={styles.toastSub}>{text2}</RNText> : null}
      </View>
    </View>
  ),
  warning: ({ text1, text2 }: any) => (
    <View style={[styles.toastBase, styles.toastWarning]}>
      <View style={styles.toastIconContainer}>
        <AlertTriangle size={20} color="#FF9500" />
      </View>
      <View style={styles.toastContent}>
        {text1 ? <RNText style={styles.toastTitle}>{text1}</RNText> : null}
        {text2 ? <RNText style={styles.toastSub}>{text2}</RNText> : null}
      </View>
    </View>
  )
};

const styles = StyleSheet.create({
  toastBase: {
    flexDirection: 'row',
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  toastSuccess: {
    borderLeftWidth: 5,
    borderLeftColor: '#4CAF50',
  },
  toastError: {
    borderLeftWidth: 5,
    borderLeftColor: '#FF3B30',
  },
  toastInfo: {
    borderLeftWidth: 5,
    borderLeftColor: '#3B1E54',
  },
  toastWarning: {
    borderLeftWidth: 5,
    borderLeftColor: '#FF9500',
  },
  toastIconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  toastSub: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
});

export default App;

