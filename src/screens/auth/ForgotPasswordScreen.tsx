import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Mail,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { API_BASE_URL } from '../../services/api';
import LinearGradient from 'react-native-linear-gradient';
import { fonts } from "@/src/theme";

const { width } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleSubmit = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/forgot-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Mobile-App': 'true',
          },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json() as any;

      if (!response.ok) {
        setError(data.message || 'Failed to send reset link');
        return;
      }

      setIsSent(true);
    } catch (err: any) {
      setError(
        err.message || 'Network request failed. Please check your connection.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Background Decorative Gradients */}
          <LinearGradient
            colors={[palette.purple.deep, '#2D1B44']}
            style={styles.bgGradientTop}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={['#2D1B44', palette.purple.deep]}
            style={styles.bgGradientBottom}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.header}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.formCard}>
            {!isSent ? (
              <>
                <View style={styles.titleContainer}>
                  <Text style={styles.cardTitle}>
                    Forgot <Text style={styles.cardTitleItalic}>Password?</Text>
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    Enter your email and we'll send you a divine link to reset
                    your access.
                  </Text>
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <Mail
                    size={20}
                    color={palette.purple.deep}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. grace@example.com"
                    placeholderTextColor={palette.neutral.grey}
                    value={email}
                    onChangeText={val => {
                      setEmail(val);
                      setError(null);
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    isLoading && styles.buttonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={palette.purple.deep} />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      SEND RESET LINK
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successContainer}>
                <View style={styles.successIconWrapper}>
                  <CheckCircle2 size={42} color="#2E7D32" />
                </View>
                <Text style={styles.successTitle}>
                  Check <Text style={styles.successTitleItalic}>Email</Text>
                </Text>
                <Text style={styles.successSubtitle}>
                  We've sent a divine link to{' '}
                  <Text style={styles.successEmailBold}>{email}</Text>. Click
                  the link to restore your sanctuary.
                </Text>
                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={() => {
                    setIsSent(false);
                    setEmail('');
                  }}
                >
                  <Text style={styles.outlineButtonText}>
                    USE ANOTHER EMAIL
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.footerLinks}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.backButton}
              >
                <ArrowLeft
                  size={16}
                  color={palette.purple.deep}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.backButtonText}>BACK TO MEMBER LOGIN</Text>
              </TouchableOpacity>

              <View style={styles.secureBadge}>
                <ShieldCheck
                  size={14}
                  color={palette.purple.muted}
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.secureBadgeText}>
                  SECURE RECOVERY PROTOCOL
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.footerCopy}>&copy; 2026 BRIDE&GROOM LEGACY</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.purple.light,
  },
  container: {
    flex: 1,
    backgroundColor: palette.purple.light,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 25,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'transparent',
  },
  logo: {
    width: width * 0.7,
    height: 100,
  },
  bgGradientTop: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 1,
  },
  bgGradientBottom: {
    position: 'absolute',
    bottom: -150,
    right: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 1,
  },
  formCard: {
    backgroundColor: palette.neutral.white,
    borderRadius: 25,
    padding: 25,
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: 'transparent',
  },
  cardTitle: {
    fontSize: 26,
    ...fonts.semibold,
    color: palette.purple.deep,
    textAlign: 'center',
  },
  cardTitleItalic: {
    color: palette.gold.main,
    fontStyle: 'italic',
  },
  cardSubtitle: {
    fontSize: 14,
    color: palette.purple.muted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  label: {
    fontSize: 10,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFBFF',
    borderWidth: 1,
    borderColor: palette.purple.border,
    borderRadius: 15,
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 55,
    fontSize: 15,
    color: palette.purple.deep,
  },
  primaryButton: {
    backgroundColor: palette.gold.main,
    height: 55,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: palette.gold.main,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryButtonText: {
    color: palette.purple.deep,
    fontSize: 12,
    ...fonts.semibold,
    letterSpacing: 1.5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  errorContainer: {
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: palette.status.error,
    fontSize: 13,
    textAlign: 'center',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 26,
    ...fonts.semibold,
    color: palette.purple.deep,
    textAlign: 'center',
  },
  successTitleItalic: {
    color: '#2E7D32',
    fontStyle: 'italic',
  },
  successSubtitle: {
    fontSize: 14,
    color: palette.purple.muted,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  successEmailBold: {
    color: palette.purple.deep,
    ...fonts.semibold,
  },
  outlineButton: {
    width: '100%',
    height: 55,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: palette.purple.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
    backgroundColor: palette.neutral.white,
  },
  outlineButtonText: {
    color: palette.purple.deep,
    fontSize: 12,
    ...fonts.semibold,
    letterSpacing: 1.5,
  },
  footerLinks: {
    marginTop: 30,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F0FA',
    paddingTop: 20,
    backgroundColor: 'transparent',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 11,
    ...fonts.semibold,
    color: palette.purple.deep,
    letterSpacing: 1,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  secureBadgeText: {
    fontSize: 9,
    ...fonts.semibold,
    color: palette.purple.muted,
    letterSpacing: 1.5,
  },
  footerCopy: {
    textAlign: 'center',
    color: '#A590C0',
    fontSize: 10,
    ...fonts.semibold,
    letterSpacing: 3,
    marginTop: 30,
  },
});
