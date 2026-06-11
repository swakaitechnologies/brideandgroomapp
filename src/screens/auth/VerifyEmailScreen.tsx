import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDispatch } from "react-redux";
import { verifyEmailSuccess } from "../../store/authSlice";
import { verifyEmailToken } from "../../services/api";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Link as LinkIcon,
} from "lucide-react-native";
import { palette } from "../../theme/colors";
import LinearGradient from "react-native-linear-gradient";
import { fonts } from "@/src/theme";

const { height } = Dimensions.get("window");

export default function VerifyEmailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();
  const dispatch = useDispatch();

  const initialToken = route.params?.token || "";
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    initialToken ? "loading" : "idle"
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tokenFocused, setTokenFocused] = useState(false);

  const performVerification = async (verifyToken: string) => {
    if (!verifyToken) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    setStatus("loading");
    setError(null);

    try {
      const response = await verifyEmailToken({ token: verifyToken });
      const data = response.data;

      if (!data.success) {
        setStatus("error");
        setMessage(data.message || "Failed to verify email. The link may be expired.");
        return;
      }

      setStatus("success");
      setMessage(data.message || "Your identity has been confirmed. You now have full access to your account.");
      dispatch(verifyEmailSuccess());
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Network request failed. Please check your connection.");
    }
  };

  useEffect(() => {
    if (initialToken) {
      performVerification(initialToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken]);

  return (
    <View style={styles.root}>
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


          {/* Form Card */}
          <View style={styles.formSection}>
            {/* IDLE State */}
            {status === "idle" && (
              <>
                <Text style={styles.formTitle}>Verify Email Link</Text>
                <Text style={styles.formSubtitle}>
                  Enter the verification token sent to your email to activate your account.
                </Text>

                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>VERIFICATION TOKEN</Text>
                  <View
                    collapsable={false}
                    style={[
                      styles.inputRow,
                      tokenFocused && styles.inputRowFocused,
                    ]}
                  >
                    <LinkIcon
                      size={18}
                      color={tokenFocused ? palette.purple.deep : palette.purple.muted}
                      style={styles.fieldIcon}
                    />
                    <TextInput
                      collapsable={false}
                      style={styles.textInput}
                      placeholder="Paste verification token"
                      placeholderTextColor="#A39BB0"
                      value={token}
                      onChangeText={(val) => {
                        setToken(val);
                        setError(null);
                      }}
                      onFocus={() => setTokenFocused(true)}
                      onBlur={() => setTokenFocused(false)}
                    />
                  </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={styles.signInBtn}
                  onPress={() => performVerification(token)}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[palette.purple.deep, "#34005B"]}
                    style={styles.signInGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.signInText}>Verify Identity</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* LOADING State */}
            {status === "loading" && (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={palette.purple.deep} style={{ marginBottom: 20 }} />
                <Text style={styles.stateTitle}>Verifying Identity</Text>
                <Text style={styles.stateSubtitle}>
                  Please wait while we confirm your email address and secure your account.
                </Text>
              </View>
            )}

            {/* SUCCESS State */}
            {status === "success" && (
              <View style={styles.centerContainer}>
                <CheckCircle2 size={48} color="#2D1B44" style={{ marginBottom: 20 }} />
                <Text style={styles.stateTitle}>Email Verified!</Text>
                <Text style={styles.stateSubtitle}>{message}</Text>
                <TouchableOpacity
                  style={styles.signInBtn}
                  onPress={() => navigation.replace("Tabs")}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[palette.purple.deep, "#34005B"]}
                    style={styles.signInGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.signInText}>Enter Your Dashboard</Text>
                    <ArrowRight size={16} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* ERROR State */}
            {status === "error" && (
              <View style={styles.centerContainer}>
                <XCircle size={48} color="#D32F2F" style={{ marginBottom: 20 }} />
                <Text style={styles.stateTitle}>Verification Failed</Text>
                <Text style={styles.stateSubtitle}>{message}</Text>

                <TouchableOpacity
                  style={styles.signInBtn}
                  onPress={() => setStatus("idle")}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={[palette.purple.deep, "#34005B"]}
                    style={styles.signInGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.signInText}>Try Another Token</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => navigation.navigate("Login")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.outlineBtnText}>Return to Login</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Footer Trust badge */}
            <View style={styles.trustBadgesRow}>
              <View style={styles.badgeItem}>
                <ShieldCheck size={14} color="#7A6F8B" />
                <Text style={styles.badgeText}>Protected by EternalGuard</Text>
              </View>
            </View>
          </View>

          <Text style={styles.footerCopy}>&copy; 2026 BRIDE & GROOM LEGACY</Text>
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
  signInText: {
    color: "#FFFFFF",
    fontSize: 16,
    ...fonts.semibold,
  },
  outlineBtn: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#EDE6F5",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#FFFFFF",
  },
  outlineBtnText: {
    color: palette.purple.deep,
    fontSize: 15,
    ...fonts.semibold,
  },
  centerContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  stateTitle: {
    fontSize: 22,
    ...fonts.bold,
    color: palette.purple.deep,
    marginBottom: 8,
    textAlign: "center",
  },
  stateSubtitle: {
    fontSize: 14,
    color: "#7A6F8B",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 10,
  },
  trustBadgesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#EDE6F5",
    paddingTop: 16,
  },
  badgeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgeText: {
    fontSize: 11,
    color: "#7A6F8B",
    ...fonts.medium,
  },
  footerCopy: {
    textAlign: "center",
    color: "#A590C0",
    fontSize: 10,
    ...fonts.semibold,
    letterSpacing: 3,
    marginTop: 30,
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
