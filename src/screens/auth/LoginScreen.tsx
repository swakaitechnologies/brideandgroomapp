import React, { useState, useRef } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
  User,
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

const { height } = Dimensions.get("window");

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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {/* Ambient Background Glows */}
      <LinearGradient
        colors={["rgba(59, 30, 84, 0.12)", "rgba(59, 30, 84, 0)"]}
        style={styles.bgBlob1}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(212, 175, 55, 0.08)", "rgba(212, 175, 55, 0)"]}
        style={styles.bgBlob2}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(59, 30, 84, 0.1)", "rgba(59, 30, 84, 0)"]}
        style={styles.bgBlob3}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
        >
          {/* Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>Welcome back</Text>
            <Text style={styles.formSubtitle}>Sign in to discover your perfect match</Text>

            {/* Email or Mobile Number */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>EMAIL OR MOBILE NUMBER</Text>
              <View
                collapsable={false}
                style={[
                  styles.inputRow,
                  emailFocused && styles.inputRowFocused,
                ]}
              >
                <User
                  size={18}
                  color={emailFocused ? palette.purple.deep : palette.purple.muted}
                  style={styles.fieldIcon}
                />
                <TextInput
                  collapsable={false}
                  style={styles.textInput}
                  placeholder="Email or mobile number"
                  placeholderTextColor="#A39BB0"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="default"
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <View style={styles.passwordHeader}>
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("ForgotPassword")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View
                collapsable={false}
                style={[
                  styles.inputRow,
                  passwordFocused && styles.inputRowFocused,
                ]}
              >
                <Lock
                  size={18}
                  color={passwordFocused ? palette.purple.deep : palette.purple.muted}
                  style={styles.fieldIcon}
                />
                <TextInput
                  collapsable={false}
                  style={styles.textInput}
                  placeholder="Enter password"
                  placeholderTextColor="#A39BB0"
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
                    <EyeOff size={18} color={palette.purple.muted} />
                  ) : (
                    <Eye size={18} color={palette.purple.muted} />
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

            {/* Sign In Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={[styles.signInBtn, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={[palette.purple.deep, "#34005B"]}
                  style={styles.signInGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.signInText}>Sign In</Text>
                      <ArrowRight size={16} color="#FFFFFF" />
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
    backgroundColor: "#F8F5FC",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    justifyContent: "center",
    paddingBottom: 40,
    paddingTop: Platform.OS === "ios" ? 40 : 60,
  },
  formSection: {
    backgroundColor: "transparent",
    width: "100%",
  },
  formTitle: {
    fontSize: 32,
    ...fonts.bold,
    color: palette.purple.deep,
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: "left",
  },
  formSubtitle: {
    fontSize: 15,
    color: palette.purple.muted,
    marginBottom: 32,
    ...fonts.regular,
    textAlign: "left",
    lineHeight: 22,
  },
  fieldWrap: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 11,
    ...fonts.semibold,
    color: "#7A6F8B",
    letterSpacing: 1,
    marginBottom: 8,
  },
  passwordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  forgotText: {
    fontSize: 12,
    color: palette.purple.deep,
    ...fonts.semibold,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#EDE6F5",
    paddingHorizontal: 18,
    height: 58,
  },
  inputRowFocused: {
    borderColor: palette.purple.deep,
    backgroundColor: "#FFFFFF",
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
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
    height: "100%",
    textAlignVertical: "center",
  },
  eyeBtn: {
    paddingLeft: 10,
    height: "100%",
    justifyContent: "center",
  },
  errorBox: {
    backgroundColor: "#FFF2F2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#FFE6E6",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 13,
    textAlign: "center",
    ...fonts.medium,
  },
  signInBtn: {
    borderRadius: 28,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  signInGradient: {
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  signInText: {
    color: "#FFFFFF",
    fontSize: 16,
    ...fonts.semibold,
  },
  bottomSection: {
    marginTop: 32,
    alignItems: "center",
  },
  signupPromptRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  newHereText: {
    fontSize: 14,
    color: "#7A6F8B",
    ...fonts.regular,
  },
  createAccountText: {
    fontSize: 14,
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
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#C4C0CE",
  },
  badgeText: {
    fontSize: 11,
    color: "#7A6F8B",
    ...fonts.medium,
  },
  bgBlob1: {
    position: "absolute",
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  bgBlob2: {
    position: "absolute",
    top: height * 0.35,
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
  },
  bgBlob3: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
});
