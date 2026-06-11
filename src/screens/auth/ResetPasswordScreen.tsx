import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "@/components/Themed";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Lock,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  Link as LinkIcon,
} from "lucide-react-native";
import { palette } from "../../theme/colors";
import { resetPassword } from "../../services/api";
import LinearGradient from "react-native-linear-gradient";
import { fonts } from "@/src/theme";


export default function ResetPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const route = useRoute<any>();

  // Token can be passed via deep link/route params, or pasted manually in development
  const initialToken = route.params?.token || "";
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!token) {
      setError("Reset token is required. Please paste the token from your email.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await resetPassword({ token, newPassword: password });
      const data = response.data;

      if (!data.success) {
        setError(data.message || "Failed to reset password");
        return;
      }

      setSuccess("Password reset successfully. Please login with your new password.");
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Network request failed. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
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



          <View style={styles.formCard}>
            <View style={styles.titleContainer}>
              <Text style={styles.cardTitle}>
                Reset <Text style={styles.cardTitleItalic}>Password</Text>
              </Text>
              <Text style={styles.cardSubtitle}>
                Almost there! Please secure your account with a divine new password.
              </Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {success && (
              <View style={styles.successContainer}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            {/* Render Token input if not provided via deep linking */}
            {!initialToken && (
              <>
                <Text style={styles.label}>Reset Token</Text>
                <View style={styles.inputContainer}>
                  <LinkIcon size={20} color={palette.purple.deep} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Paste your reset token here"
                    placeholderTextColor={palette.neutral.grey}
                    value={token}
                    onChangeText={(val) => {
                      setToken(val);
                      setError(null);
                    }}
                  />
                </View>
              </>
            )}

            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color={palette.purple.deep} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter new password"
                placeholderTextColor={palette.neutral.grey}
                value={password}
                onChangeText={(val) => {
                  setPassword(val);
                  setError(null);
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color={palette.purple.muted} />
                ) : (
                  <Eye size={20} color={palette.purple.muted} />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputContainer}>
              <Lock size={20} color={palette.purple.deep} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Repeat new password"
                placeholderTextColor={palette.neutral.grey}
                value={confirmPassword}
                onChangeText={(val) => {
                  setConfirmPassword(val);
                  setError(null);
                }}
                secureTextEntry={!showPassword}
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={palette.purple.deep} />
              ) : (
                <Text style={styles.primaryButtonText}>RESET PASSWORD</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerLinks}>
              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                style={styles.backButton}
              >
                <ArrowLeft size={16} color={palette.purple.deep} style={{ marginRight: 8 }} />
                <Text style={styles.backButtonText}>RETURN TO LOGIN</Text>
              </TouchableOpacity>

              <View style={styles.secureBadge}>
                <ShieldCheck size={14} color={palette.purple.muted} style={{ marginRight: 6 }} />
                <Text style={styles.secureBadgeText}>SECURE RESET PROTOCOL</Text>
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
    justifyContent: "center",
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
    backgroundColor: "transparent",
    width: "100%",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 25,
    backgroundColor: "transparent",
  },
  cardTitle: {
    fontSize: 32,
    ...fonts.bold,
    color: palette.purple.deep,
    textAlign: "center",
  },
  cardTitleItalic: {
    color: palette.gold.main,
    fontStyle: "italic",
  },
  cardSubtitle: {
    fontSize: 15,
    color: palette.purple.muted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EDE6F5",
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
    marginTop: 10,
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
  successContainer: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  successText: {
    color: "#2E7D32",
    fontSize: 13,
    textAlign: "center",
    ...fonts.semibold,
  },
  footerLinks: {
    marginTop: 30,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F5F0FA",
    paddingTop: 20,
    backgroundColor: "transparent",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  backButtonText: {
    fontSize: 11,
    ...fonts.semibold,
    color: palette.purple.deep,
    letterSpacing: 1,
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
});
