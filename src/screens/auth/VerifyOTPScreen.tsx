import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  Modal,
  Animated,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDispatch } from "react-redux";
import { verifyMobileSuccess } from "../../store/authSlice";
import { API_BASE_URL } from "../../services/api";
import { secureStorage } from "../../services/secureStorage";
import { TrackService } from "../../services/analyticsService";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Phone,
  Crown,
  Sparkles,
} from "lucide-react-native";
import { palette } from "../../theme/colors";
import LinearGradient from "react-native-linear-gradient";
import LottieView from "lottie-react-native";
import { fonts } from "@/src/theme";

const { width, height } = Dimensions.get("window");

export default function VerifyOTPScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const dispatch = useDispatch();

  useEffect(() => {
    TrackService.trackScreen("Verify_OTP_Screen");
  }, []);

  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [otpFocused, setOtpFocused] = useState(false);

  // Early adopter promo state
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoDetails, setPromoDetails] = useState<{
    planName: string;
    durationDays: number;
  } | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const lottieRef = useRef<LottieView>(null);

  const animatePromoModal = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

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

    setStatus("loading");
    setError(null);

    try {
      const token = await secureStorage.getItem("token");
      const headers: any = {
        "Content-Type": "application/json",
        "X-Mobile-App": "true",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers,
        body: JSON.stringify({ otp }),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message || "Failed to verify OTP code.");
        return;
      }

      setStatus("success");
      setMessage(data.message || "Your mobile number has been verified successfully.");
      TrackService.trackEvent("mobile_otp_verification_success");
      dispatch(verifyMobileSuccess());

      // Check if early adopter promo was awarded
      if (data.earlyAdopterPromoAwarded) {
        setPromoDetails({
          planName: data.earlyAdopterPlanName || "Diamond",
          durationDays: data.earlyAdopterDurationDays || 30,
        });
        setTimeout(() => {
          setShowPromoModal(true);
          animatePromoModal();
          lottieRef.current?.play();
        }, 600);
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Network request failed. Please check your connection.");
    }
  };

  const dismissPromoModal = () => {
    setShowPromoModal(false);
    navigation.replace("Tabs");
  };

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
                <Text style={styles.formTitle}>Verify Mobile OTP</Text>
                <Text style={styles.formSubtitle}>
                  Enter the 6-digit OTP code sent to your registered mobile number to proceed.
                </Text>

                {error && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <View style={styles.fieldWrap}>
                  <Text style={styles.fieldLabel}>6-DIGIT OTP CODE</Text>
                  <View
                    collapsable={false}
                    style={[
                      styles.inputRow,
                      otpFocused && styles.inputRowFocused,
                    ]}
                  >
                    <Phone
                      size={18}
                      color={otpFocused ? palette.purple.deep : palette.purple.muted}
                      style={styles.fieldIcon}
                    />
                    <TextInput
                      collapsable={false}
                      style={styles.textInput}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor="#A39BB0"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={otp}
                      onChangeText={(val) => {
                        setOtp(val.replace(/[^0-9]/g, ""));
                        setError(null);
                      }}
                      onFocus={() => setOtpFocused(true)}
                      onBlur={() => setOtpFocused(false)}
                    />
                  </View>
                </View>

                {/* Submit Button */}
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={styles.signInBtn}
                    onPress={handleVerifyOTP}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={[palette.purple.deep, "#34005B"]}
                      style={styles.signInGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Text style={styles.signInText}>Verify Code</Text>
                      <ArrowRight size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </>
            )}

            {/* LOADING State */}
            {status === "loading" && (
              <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={palette.purple.deep} style={{ marginBottom: 20 }} />
                <Text style={styles.stateTitle}>Verifying Code</Text>
                <Text style={styles.stateSubtitle}>
                  Please wait while we confirm your mobile OTP and activate your account access.
                </Text>
              </View>
            )}

            {/* SUCCESS State */}
            {status === "success" && (
              <View style={styles.centerContainer}>
                <CheckCircle2 size={48} color="#2D1B44" style={{ marginBottom: 20 }} />
                <Text style={styles.stateTitle}>Mobile Verified!</Text>
                <Text style={styles.stateSubtitle}>{message}</Text>
                {!showPromoModal && (
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
                )}
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
                    <Text style={styles.signInText}>Try Again</Text>
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

      {/* Early Adopter Confetti & Welcome Modal */}
      <Modal
        visible={showPromoModal}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={dismissPromoModal}
      >
        <View style={styles.modalOverlay}>
          {/* Confetti Animation */}
          <LottieView
            ref={lottieRef}
            source={require("../../../assets/animations/confetti.json")}
            style={styles.confettiAnimation}
            autoPlay={false}
            loop={false}
          />

          <Animated.View
            style={[
              styles.promoCard,
              { transform: [{ scale: scaleAnim }] },
            ]}
          >
            <LinearGradient
              colors={["#3B1E54", "#5A2A82"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.promoCardGradient}
            >
              {/* Crown Icon */}
              <View style={styles.promoIconContainer}>
                <Crown size={40} color="#D4AF37" />
              </View>

              <Text style={styles.promoTitle}>🎉 Congratulations!</Text>
              <Text style={styles.promoSubtitle}>
                You are one of our first 1,000 users!
              </Text>

              <View style={promoDetails ? styles.promoBadge : { display: "none" }}>
                <Sparkles size={16} color="#D4AF37" style={{ marginRight: 6 }} />
                <Text style={styles.promoBadgeText}>
                  {promoDetails?.planName || "Diamond"} Premium
                </Text>
              </View>

              <Text style={styles.promoDuration}>
                {promoDetails?.durationDays || 30} Days FREE
              </Text>

              <Text style={styles.promoDescription}>
                Enjoy unlimited messaging, contact reveals, video introductions, and all premium features — completely free!
              </Text>

              <TouchableOpacity
                style={styles.promoButton}
                onPress={dismissPromoModal}
              >
                <Text style={styles.promoButtonText}>EXPLORE NOW</Text>
                <ArrowRight size={16} color="#3B1E54" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        </View>
      </Modal>
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
  // Early Adopter Promo Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  confettiAnimation: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    height: height,
    zIndex: 10,
    pointerEvents: "none",
  },
  promoCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 20,
    shadowColor: "#3B1E54",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    zIndex: 20,
  },
  promoCardGradient: {
    padding: 30,
    alignItems: "center",
  },
  promoIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(212,175,55,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  promoTitle: {
    fontSize: 24,
    ...fonts.bold,
    color: "#FFFFFF",
    marginBottom: 6,
    textAlign: "center",
  },
  promoSubtitle: {
    fontSize: 14,
    ...fonts.medium,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 20,
    textAlign: "center",
  },
  promoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(212,175,55,0.15)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  promoBadgeText: {
    fontSize: 14,
    ...fonts.bold,
    color: "#D4AF37",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  promoDuration: {
    fontSize: 32,
    ...fonts.bold,
    color: "#D4AF37",
    marginBottom: 12,
    textAlign: "center",
  },
  promoDescription: {
    fontSize: 13,
    ...fonts.regular,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  promoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D4AF37",
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 32,
    elevation: 6,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  promoButtonText: {
    fontSize: 14,
    ...fonts.bold,
    color: "#3B1E54",
    letterSpacing: 1.5,
  },
});
