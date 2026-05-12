import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { login } from "@/src/store/authSlice";
import { RootState, AppDispatch } from "@/src/store";
import { Text, View } from "@/components/Themed";
import { router, Link } from "expo-router";
import {
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  Activity,
} from "lucide-react-native";
import { checkConnectivity } from "@/src/services/diagnostics";
import { palette } from "@/src/theme/colors";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [diagResult, setDiagResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const handleTestConnection = async () => {
    setTesting(true);
    const result = await checkConnectivity("http://192.168.1.4:5000/api");
    setDiagResult(result.message);
    setTesting(false);
    setTimeout(() => setDiagResult(null), 5000);
  };

  const handleLogin = async () => {
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      router.replace("/(tabs)");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.scrollContent}>
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
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
              resizeMethod="scale"
            />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.cardTitle}>Login to Account</Text>

            <View style={styles.inputContainer}>
              <Mail size={20} color="#3B1E54" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#A0A0A0"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#3B1E54" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#A0A0A0"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#7E6B8F" />
                ) : (
                  <Eye size={20} color="#7E6B8F" />
                )}
              </TouchableOpacity>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  {typeof error === "string"
                    ? error
                    : "An unexpected error occurred. Please check your connection."}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#3B1E54" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>CONTINUE JOURNEY</Text>
                  <ArrowRight size={18} color="#3B1E54" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.diagButton}
              onPress={handleTestConnection}
              disabled={testing}
            >
              {testing ? (
                <ActivityIndicator size="small" color="#D4AF37" />
              ) : (
                <>
                  <Activity
                    size={16}
                    color="#D4AF37"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.diagButtonText}>
                    Test Server Connection
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {diagResult && (
              <View style={styles.diagResultContainer}>
                <Text style={styles.diagResultText}>{diagResult}</Text>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Link href="/register" asChild>
              <TouchableOpacity>
                <Text style={styles.registerLink}>Register here</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
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
    flex: 1,
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
    width: width * 0.95,
    height: 140,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },
  titleContainer: {
    alignItems: "center",
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: palette.purple.deep,
    textAlign: "center",
  },
  goldLine: {
    width: 40,
    height: 3,
    backgroundColor: palette.gold.main,
    borderRadius: 2,
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 14,
    color: palette.purple.muted,
    textAlign: "center",
    fontStyle: "italic",
    paddingHorizontal: 20,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: palette.purple.deep,
    marginBottom: 25,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDFBFF",
    borderWidth: 1,
    borderColor: palette.purple.border,
    borderRadius: 15,
    marginBottom: 15,
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
  errorContainer: {
    backgroundColor: "#FFF0F0",
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
  },
  errorText: {
    color: palette.status.error,
    fontSize: 13,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: palette.gold.main,
    height: 55,
    borderRadius: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: palette.gold.main,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: palette.purple.deep,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
    marginRight: 10,
  },
  forgotPassword: {
    alignItems: "center",
    marginTop: 15,
    backgroundColor: "transparent",
  },
  forgotPasswordText: {
    color: palette.purple.muted,
    fontSize: 13,
    fontWeight: "500",
  },
  diagButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  diagButtonText: {
    color: palette.gold.main,
    fontSize: 12,
    fontWeight: "bold",
  },
  diagResultContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: palette.purple.light,
    borderRadius: 10,
  },
  diagResultText: {
    fontSize: 11,
    color: palette.purple.deep,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
    backgroundColor: "transparent",
  },
  footerText: {
    color: palette.purple.muted,
    fontSize: 14,
  },
  registerLink: {
    color: palette.gold.main,
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
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
});
