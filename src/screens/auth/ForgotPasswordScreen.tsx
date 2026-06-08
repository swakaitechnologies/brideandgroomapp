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
  View,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Mail,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Heart,
  LockKeyhole,
} from 'lucide-react-native';
import { palette } from '@/src/theme/colors';
import { fonts } from '@/src/theme';
import LinearGradient from 'react-native-linear-gradient';
import { API_BASE_URL } from '../../services/api';

const { width, height } = Dimensions.get('window');

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
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
    <View style={styles.root}>
      {/* Decorative Background Hearts */}
      <View style={styles.bgHeart1} pointerEvents="none" collapsable={false}>
        <Heart size={140} color="#FF4D4D" />
      </View>
      <View style={styles.bgHeart2} pointerEvents="none" collapsable={false}>
        <Heart size={80} color="#FF4D4D" />
      </View>
      <View style={styles.bgHeart3} pointerEvents="none" collapsable={false}>
        <Heart size={100} color="#FF4D4D" />
      </View>
      <View style={styles.bgHeart4} pointerEvents="none" collapsable={false}>
        <Heart size={60} color="#FF4D4D" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Image
              source={require('../../../assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.taglineRow}>
              <View style={styles.taglineLine} />
              <Heart size={14} color={palette.purple.deep} fill={palette.purple.deep} />
              <View style={styles.taglineLine} />
            </View>
            <Text style={styles.taglineText}>EXCLUSIVITY & ELEGANCE IN MATCHMAKING</Text>
          </View>

          {/* Form / Card Section */}
          <View style={styles.formSection}>
            {!isSent ? (
              <>
                <Text style={styles.formTitle}>Forgot Password?</Text>
                <Text style={styles.formSubtitle}>
                  Enter your email and we'll send you a link to reset your access.
                </Text>

                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {/* Email input field wrapper */}
                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                  <View
                    collapsable={false}
                    style={[
                      styles.inputRow,
                      emailFocused && styles.inputRowFocused,
                    ]}
                  >
                    <Mail
                      size={18}
                      color={emailFocused ? palette.purple.deep : palette.purple.muted}
                      style={styles.fieldIcon}
                    />
                    <TextInput
                      collapsable={false}
                      style={styles.textInput}
                      placeholder="name@domain.com"
                      placeholderTextColor="#A39BB0"
                      value={email}
                      onChangeText={(val) => {
                        setEmail(val);
                        setError(null);
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />
                  </View>
                </View>

                {/* Send Button */}
                <TouchableOpacity
                  style={[styles.actionBtn, isLoading && styles.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[palette.purple.deep, '#34005B']}
                    style={styles.gradientBtn}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.actionBtnText}>Send Reset Link</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.successContainer}>
                <View style={styles.successIconWrapper}>
                  <CheckCircle2 size={36} color="#2E7D32" />
                </View>
                <Text style={styles.successTitle}>Check Email</Text>
                <Text style={styles.successSubtitle}>
                  We've sent a recovery link to{' '}
                  <Text style={styles.successEmailBold}>{email}</Text>. Click the link in your email to restore access.
                </Text>
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => {
                    setIsSent(false);
                    setEmail('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.outlineBtnText}>Use Another Email</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Back to Login */}
            <View style={styles.footerLinks}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <ArrowLeft
                  size={16}
                  color={palette.purple.deep}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.backButtonText}>BACK TO LOGIN</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Trust Badges */}
          <View style={styles.bottomSection}>
            <View style={styles.trustBadgesRow}>
              <View style={styles.badgeItem}>
                <ShieldCheck size={14} color="#7A6F8B" />
                <Text style={styles.badgeText}>100% Verified Profiles</Text>
              </View>
              <View style={styles.badgeDivider} />
              <View style={styles.badgeItem}>
                <LockKeyhole size={14} color="#7A6F8B" />
                <Text style={styles.badgeText}>Highly Secured</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8F5FC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: 'center',
    paddingBottom: 40,
    paddingTop: Platform.OS === 'ios' ? 40 : 60,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: height * 0.04,
  },
  logo: {
    width: width * 0.65,
    height: 70,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  taglineLine: {
    width: 32,
    height: 1,
    backgroundColor: palette.purple.muted,
    opacity: 0.4,
    marginHorizontal: 10,
  },
  taglineText: {
    fontSize: 10,
    color: '#6B5A80',
    letterSpacing: 1.5,
    ...fonts.semibold,
    textAlign: 'center',
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 26,
    paddingVertical: 32,
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 36,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(237, 230, 245, 0.6)',
  },
  formTitle: {
    fontSize: 24,
    ...fonts.bold,
    color: palette.purple.deep,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 14,
    color: '#7A6F8B',
    marginBottom: 28,
    ...fonts.regular,
  },
  fieldWrap: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 11,
    ...fonts.semibold,
    color: '#7A6F8B',
    letterSpacing: 1,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFDFD',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDE6F5',
    paddingHorizontal: 16,
    height: 56,
  },
  inputRowFocused: {
    borderColor: palette.purple.deep,
    backgroundColor: '#FFFFFF',
  },
  fieldIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: palette.purple.deep,
    ...fonts.medium,
    paddingVertical: 0,
  },
  errorBox: {
    backgroundColor: '#FFF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#FFE6E6',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 13,
    textAlign: 'center',
    ...fonts.medium,
  },
  actionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  gradientBtn: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    ...fonts.semibold,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconWrapper: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    ...fonts.bold,
    color: palette.purple.deep,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#7A6F8B',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
    ...fonts.regular,
  },
  successEmailBold: {
    color: palette.purple.deep,
    ...fonts.semibold,
  },
  outlineBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#EDE6F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    backgroundColor: '#FFFFFF',
  },
  outlineBtnText: {
    color: palette.purple.deep,
    fontSize: 15,
    ...fonts.semibold,
  },
  footerLinks: {
    marginTop: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F0FA',
    paddingTop: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 12,
    ...fonts.semibold,
    color: palette.purple.deep,
    letterSpacing: 0.5,
  },
  bottomSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  trustBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeDivider: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C4C0CE',
  },
  badgeText: {
    fontSize: 11,
    color: '#7A6F8B',
    ...fonts.medium,
  },
  bgHeart1: {
    position: 'absolute',
    top: -20,
    left: -40,
    transform: [{ rotate: '-15deg' }],
    opacity: 0.15,
  },
  bgHeart2: {
    position: 'absolute',
    top: height * 0.25,
    right: -20,
    transform: [{ rotate: '25deg' }],
    opacity: 0.12,
  },
  bgHeart3: {
    position: 'absolute',
    bottom: height * 0.15,
    left: -30,
    transform: [{ rotate: '15deg' }],
    opacity: 0.1,
  },
  bgHeart4: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    transform: [{ rotate: '-20deg' }],
    opacity: 0.15,
  },
});
