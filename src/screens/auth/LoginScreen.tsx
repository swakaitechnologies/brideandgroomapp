import React, { useState, useRef } from "react";
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
  Animated,
  View,
  Text,
  StatusBar,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { login } from "@/src/store/authSlice";
import { RootState, AppDispatch } from "@/src/store";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  LockKeyhole,
} from "lucide-react-native";
import { palette } from "@/src/theme/colors";
import { fonts } from "@/src/theme";
import LinearGradient from "react-native-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  // Animations
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleLogin = async () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Tabs" }],
      });
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      
      {/* Decorative Light Ambient Glow Blobs */}
      <View style={styles.ambientGlowTop} pointerEvents="none" />
      <View style={styles.ambientGlowBottom} pointerEvents="none" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Image
              source={require("../../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.taglineText}>EXCLUSIVITY & ELEGANCE IN MATCHMAKING</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSubtitle}>Sign in to access your elite matches</Text>

            {/* Email Address */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <View
                style={[
                  styles.inputRow,
                  emailFocused && styles.inputRowFocused,
                ]}
              >
                <Mail
                  size={16}
                  color={emailFocused ? palette.gold.main : "rgba(107, 90, 128, 0.4)"}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@domain.com"
                  placeholderTextColor="rgba(163, 155, 176, 0.6)"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <View style={styles.passwordHeader}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("ForgotPassword")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotText}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View
                style={[
                  styles.inputRow,
                  passwordFocused && styles.inputRowFocused,
                ]}
              >
                <Lock
                  size={16}
                  color={passwordFocused ? palette.gold.main : "rgba(107, 90, 128, 0.4)"}
                  style={styles.fieldIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="rgba(163, 155, 176, 0.6)"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  {showPassword ? (
                    <EyeOff size={16} color="rgba(107, 90, 128, 0.4)" />
                  ) : (
                    <Eye size={16} color="rgba(107, 90, 128, 0.4)" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Error Handling */}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>
                  {typeof error === "string" ? error : "Authentication failed. Check your credentials."}
                </Text>
              </View>
            )}

            {/* Sign In Button (Gold Gradient) */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.signInBtn, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[palette.gold.main, "#C59B27"]}
                  style={styles.signInGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <ActivityIndicator color={palette.purple.deep} size="small" />
                  ) : (
                    <>
                      <Text style={styles.signInText}>Sign In</Text>
                      <ArrowRight size={16} color={palette.purple.deep} style={{ marginLeft: 4 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Bottom Actions */}
          <View style={styles.bottomSection}>
            <View style={styles.signupPromptRow}>
              <Text style={styles.newHereText}>New to Bride & Groom? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Register")}
                activeOpacity={0.7}
              >
                <Text style={styles.createAccountText}>Create account</Text>
              </TouchableOpacity>
            </View>

            {/* Premium Trust Badges */}
            <View style={styles.trustBadgesRow}>
              <View style={styles.badgeItem}>
                <ShieldCheck size={14} color="rgba(107, 90, 128, 0.5)" />
                <Text style={styles.badgeText}>100% Verified Profiles</Text>
              </View>
              <View style={styles.badgeDivider} />
              <View style={styles.badgeItem}>
                <LockKeyhole size={14} color="rgba(107, 90, 128, 0.5)" />
                <Text style={styles.badgeText}>Secured Access</Text>
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
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 26,
    justifyContent: "center",
    paddingBottom: 40,
    paddingTop: Platform.OS === "ios" ? 60 : 80,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: height * 0.05,
  },
  logo: {
    width: width * 0.62,
    height: 60,
  },
  taglineText: {
    fontSize: 9,
    color: "rgba(107, 90, 128, 0.6)",
    letterSpacing: 2,
    ...fonts.semibold,
    textAlign: "center",
    marginTop: 15,
  },
  formSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: "rgba(237, 230, 245, 0.6)",
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.04,
    shadowRadius: 32,
    elevation: 4,
  },
  formTitle: {
    fontSize: 24,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  formSubtitle: {
    fontSize: 13,
    color: "rgba(122, 111, 139, 0.7)",
    marginBottom: 26,
    ...fonts.regular,
  },
  fieldWrap: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 11,
    ...fonts.semibold,
    color: "rgba(107, 90, 128, 0.6)",
    marginBottom: 6,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  forgotText: {
    fontSize: 11,
    color: palette.purple.deep,
    ...fonts.semibold,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF9FC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(237, 230, 245, 0.8)",
    paddingHorizontal: 16,
    height: 52,
  },
  inputRowFocused: {
    borderColor: palette.gold.main,
    backgroundColor: "#FFFFFF",
    shadowColor: palette.gold.main,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: palette.purple.deep,
    ...fonts.medium,
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingLeft: 8,
  },
  errorBox: {
    backgroundColor: "#FFF4F4",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFE0E0",
  },
  errorText: {
    color: palette.status.error,
    fontSize: 12,
    textAlign: "center",
    ...fonts.medium,
  },
  signInBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 6,
    shadowColor: palette.gold.main,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 4,
  },
  signInGradient: {
    height: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.5,
  },
  signInText: {
    color: palette.purple.deep,
    fontSize: 15,
    ...fonts.semibold,
  },
  bottomSection: {
    marginTop: 32,
    alignItems: "center",
  },
  signupPromptRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  newHereText: {
    fontSize: 13,
    color: "rgba(122, 111, 139, 0.7)",
    ...fonts.regular,
  },
  createAccountText: {
    fontSize: 13,
    color: palette.purple.deep,
    ...fonts.semibold,
  },
  trustBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  badgeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(196, 192, 206, 0.8)",
  },
  badgeText: {
    fontSize: 10,
    color: "rgba(122, 111, 139, 0.7)",
    ...fonts.medium,
  },
  ambientGlowTop: {
    position: "absolute",
    top: -200,
    right: -200,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "rgba(212, 175, 55, 0.04)",
  },
  ambientGlowBottom: {
    position: "absolute",
    bottom: -150,
    left: -150,
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: "rgba(46, 27, 68, 0.03)",
  },
});
