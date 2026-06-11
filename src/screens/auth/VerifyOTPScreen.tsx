import React, { useState, useEffect, useRef } from "react";
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
  Modal,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "@/components/Themed";
import { useNavigation, useRoute } from "@react-navigation/native";
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
    TrackService.trackScreen('Verify_OTP_Screen');
  }, []);

  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Early adopter promo state
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoDetails, setPromoDetails] = useState<{
    planName: string;
    durationDays: number;
  } | null>(null);
  const scaleAnim = useRef(new Animated.Value(0)).current;
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
      TrackService.trackEvent('mobile_otp_verification_success');
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
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Background Decorative Gradients */}
          <LinearGradient
            colors={[palette.purple.deep, "#2D1B44"]}
            style={styles.bgGradientTop}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <LinearGradient
            colors={["#2D1B44", palette.purple.deep]}
            style={styles.bgGradientBottom}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.header}>
            <Image
              source={require("../../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <View style={styles.formCard}>
            {/* IDLE State */}
            {status === "idle" && (
              <>
                <View style={styles.titleContainer}>
                  <Text style={styles.cardTitle}>
                    Verify <Text style={styles.cardTitleItalic}>Mobile</Text>
                  </Text>
                  <Text style={styles.cardSubtitle}>
                    Enter the 6-digit OTP code sent to your registered mobile number to proceed.
                  </Text>
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Text style={styles.label}>6-Digit OTP Code</Text>
                <View style={styles.inputContainer}>
                  <Phone size={20} color={palette.purple.deep} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor={palette.neutral.grey}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={(val) => {
                      setOtp(val.replace(/[^0-9]/g, ""));
                      setError(null);
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleVerifyOTP}
                >
                  <Text style={styles.primaryButtonText}>VERIFY CODE</Text>
                </TouchableOpacity>
              </>
            )}

            {/* LOADING State */}
            {status === "loading" && (
              <View style={styles.centerContainer}>
                <View style={styles.spinnerWrapper}>
                  <ActivityIndicator size="large" color={palette.purple.deep} />
                </View>
                <Text style={styles.stateTitle}>Verifying Code</Text>
                <Text style={styles.stateSubtitle}>
                  Please wait while we confirm your mobile OTP and activate your account access.
                </Text>
              </View>
            )}

            {/* SUCCESS State */}
            {status === "success" && (
              <View style={styles.centerContainer}>
                <View style={styles.successIconWrapper}>
                  <CheckCircle2 size={42} color="#2E7D32" />
                </View>
                <Text style={styles.successTitle}>Mobile Verified!</Text>
                <Text style={styles.successSubtitle}>{message}</Text>
                {!showPromoModal && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => navigation.replace("Tabs")}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text style={styles.primaryButtonText}>ENTER YOUR DASHBOARD</Text>
                      <ArrowRight size={16} color={palette.purple.deep} style={{ marginLeft: 8 }} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ERROR State */}
            {status === "error" && (
              <View style={styles.centerContainer}>
                <View style={styles.errorIconWrapper}>
                  <XCircle size={42} color={palette.status.error} />
                </View>
                <Text style={styles.errorTitle}>Verification Failed</Text>
                <Text style={styles.errorSubtitle}>{message}</Text>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => setStatus("idle")}
                >
                  <Text style={styles.primaryButtonText}>TRY AGAIN</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.outlineButton}
                  onPress={() => navigation.navigate("Login")}
                >
                  <Text style={styles.outlineButtonText}>RETURN TO LOGIN</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.footerLinks}>
              <View style={styles.secureBadge}>
                <ShieldCheck size={14} color={palette.purple.muted} style={{ marginRight: 6 }} />
                <Text style={styles.secureBadgeText}>PROTECTED BY ETERNALGUARD</Text>
              </View>
            </View>
          </View>

          <Text style={styles.footerCopy}>&copy; 2026 BRIDE&GROOM LEGACY</Text>
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

              <View style={styles.promoBadge}>
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
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    backgroundColor: "transparent",
  },
  logo: {
    width: width * 0.7,
    height: 100,
  },
  bgGradientTop: {
    position: "absolute",
    top: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 1,
  },
  bgGradientBottom: {
    position: "absolute",
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
    alignItems: "center",
    marginBottom: 25,
    backgroundColor: "transparent",
  },
  cardTitle: {
    fontSize: 26,
    ...fonts.semibold,
    color: palette.purple.deep,
    textAlign: "center",
  },
  cardTitleItalic: {
    color: palette.gold.main,
    fontStyle: "italic",
  },
  cardSubtitle: {
    fontSize: 14,
    color: palette.purple.muted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  label: {
    fontSize: 10,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginLeft: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDFBFF",
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
    justifyContent: "center",
    alignItems: "center",
    shadowColor: palette.gold.main,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    width: "100%",
    marginTop: 10,
  },
  primaryButtonText: {
    color: palette.purple.deep,
    fontSize: 12,
    ...fonts.semibold,
    letterSpacing: 1.5,
  },
  outlineButton: {
    width: "100%",
    height: 55,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: palette.purple.border,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    backgroundColor: palette.neutral.white,
  },
  outlineButtonText: {
    color: palette.purple.deep,
    fontSize: 12,
    ...fonts.semibold,
    letterSpacing: 1.5,
  },
  centerContainer: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "transparent",
  },
  spinnerWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F8F7FC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5DEEE",
  },
  successIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  errorIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  stateTitle: {
    fontSize: 24,
    ...fonts.semibold,
    color: palette.purple.deep,
    textAlign: "center",
    marginBottom: 10,
  },
  stateSubtitle: {
    fontSize: 14,
    color: palette.purple.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 24,
    ...fonts.semibold,
    color: palette.purple.deep,
    textAlign: "center",
    marginBottom: 10,
  },
  successSubtitle: {
    fontSize: 14,
    color: palette.purple.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },
  errorTitle: {
    fontSize: 24,
    ...fonts.semibold,
    color: palette.purple.deep,
    textAlign: "center",
    marginBottom: 10,
  },
  errorSubtitle: {
    fontSize: 14,
    color: palette.purple.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },
  errorContainer: {
    backgroundColor: "#FFF0F0",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    color: palette.status.error,
    fontSize: 13,
    textAlign: "center",
  },
  footerLinks: {
    marginTop: 30,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F5F0FA",
    paddingTop: 20,
    backgroundColor: "transparent",
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  secureBadgeText: {
    fontSize: 9,
    ...fonts.semibold,
    color: palette.purple.muted,
    letterSpacing: 1.5,
  },
  footerCopy: {
    textAlign: "center",
    color: "#A590C0",
    fontSize: 10,
    ...fonts.semibold,
    letterSpacing: 3,
    marginTop: 30,
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
