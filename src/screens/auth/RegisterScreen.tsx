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
  View,
  Text,
  StatusBar,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { register } from "@/src/store/authSlice";
import { RootState, AppDispatch } from "@/src/store";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  Shield,
  Gift,
} from "lucide-react-native";
import { palette } from "../../theme/colors";
import LinearGradient from "react-native-linear-gradient";
import { fonts } from "@/src/theme";
import { TrackService } from "../../services/analyticsService";

const { width, height } = Dimensions.get("window");

const stepsData = [
  { title: "Identity", icon: User, subtitle: "About yourself" },
  { title: "Contact", icon: Mail, subtitle: "How to reach you" },
  { title: "Security", icon: Lock, subtitle: "Secure account" },
];

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    createdBy: "Self",
    dateOfBirth: "",
    gender: "",
    country: "India",
    referredByCode: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [certifyAge, setCertifyAge] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Field focus states
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { loading, error } = useSelector((state: RootState) => state.auth);



  useEffect(() => {
    TrackService.trackScreen('Register_Screen');
  }, []);

  const updateDOB = (day: string, month: string, year: string) => {
    const dVal = parseInt(day, 10);
    const mVal = parseInt(month, 10);
    const yVal = parseInt(year, 10);
    if (
      !isNaN(dVal) && dVal >= 1 && dVal <= 31 &&
      !isNaN(mVal) && mVal >= 1 && mVal <= 12 &&
      year && year.length === 4 && !isNaN(yVal) && yVal > 1900
    ) {
      setFormData((prev) => ({
        ...prev,
        dateOfBirth: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
      }));
    } else {
      setFormData((prev) => ({ ...prev, dateOfBirth: "" }));
    }
  };

  const handleDayChange = (val: string) => {
    const c = val.replace(/[^0-9]/g, "");
    if (c === "" || c === "0" || (parseInt(c, 10) >= 1 && parseInt(c, 10) <= 31)) {
      setDobDay(c);
      updateDOB(c, dobMonth, dobYear);
    }
  };

  const handleMonthChange = (val: string) => {
    const c = val.replace(/[^0-9]/g, "");
    if (c === "" || c === "0" || (parseInt(c, 10) >= 1 && parseInt(c, 10) <= 12)) {
      setDobMonth(c);
      updateDOB(dobDay, c, dobYear);
    }
  };

  const handleYearChange = (val: string) => {
    const c = val.replace(/[^0-9]/g, "");
    setDobYear(c);
    updateDOB(dobDay, dobMonth, c);
  };

  const calculateAge = (d: string) => {
    if (!d) return 0;
    const dob = new Date(d);
    if (isNaN(dob.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const md = today.getMonth() - dob.getMonth();
    if (md < 0 || (md === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  const currentAge = calculateAge(formData.dateOfBirth);
  const isUnderage = formData.dateOfBirth !== "" && currentAge < 18;

  const handleNext = () => {
    setValidationError(null);
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.gender) {
        setValidationError("Please fill all fields and select gender.");
        return;
      }
      if (isUnderage) {
        setValidationError("You must be 18 years or older to register.");
        return;
      }
    }
    if (step === 2) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setValidationError("Please enter a valid email address.");
        return;
      }
      if (formData.mobile.length < 10) {
        setValidationError("Please enter a valid 10-digit mobile number.");
        return;
      }
      if (!formData.country) {
        setValidationError("Please select your country.");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleRegister = async () => {
    setValidationError(null);
    if (!certifyAge) {
      setValidationError("You must certify that you are at least 18 years old.");
      return;
    }
    if (!agreedToTerms) {
      setValidationError("Please agree to the Terms of Use.");
      return;
    }
    if (!agreedToPrivacy) {
      setValidationError("Please agree to the collection and processing of your profile data as outlined in the Privacy Policy.");
      return;
    }
    if (isUnderage) {
      setValidationError("You must be at least 18 years old.");
      return;
    }
    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return;
    }
    TrackService.trackEvent('registration_initiated', { createdBy: formData.createdBy });
    const result = await dispatch(
      register({ ...formData, agreedToTerms, is18Plus: currentAge >= 18 })
    );
    if (register.fulfilled.match(result)) {
      try {
        await AsyncStorage.setItem("isNewRegistration", "true");
      } catch (err) {
        console.log("Error setting registration flag:", err);
      }
      TrackService.trackEvent('registration_success');
      navigation.reset({ index: 0, routes: [{ name: "VerifyOTP" }] });
    }
  };

  // ─── Render Inputs ────────────────────────────────────────
  const renderField = (
    fieldName: string,
    Icon: any,
    placeholder: string,
    value: string,
    onChange: (v: string) => void,
    extra?: any
  ) => {
    const isFocused = focusedField === fieldName;
    return (
      <View style={s.fieldWrap}>
        <Text style={s.fieldLabel}>{placeholder.toUpperCase()}</Text>
        <View collapsable={false} style={[s.inputRow, isFocused && s.inputRowFocused]}>
          <Icon
            size={18}
            color={isFocused ? palette.purple.deep : palette.purple.muted}
            style={s.fieldIcon}
          />
          <TextInput
            collapsable={false}
            style={s.textInput}
            placeholder={placeholder}
            placeholderTextColor="#A39BB0"
            value={value}
            onChangeText={onChange}
            onFocus={() => setFocusedField(fieldName)}
            onBlur={() => setFocusedField(null)}
            {...extra}
          />
        </View>
      </View>
    );
  };

  // ─── Step 1: Identity ─────────────────────────────────────
  const renderStep1 = () => (
    <View style={s.card}>
      <Text style={s.cardTitle}>Basic Identity</Text>
      <Text style={s.cardSubtitle}>Start building your premium profile</Text>

      {renderField("firstName", User, "First name", formData.firstName, (v) =>
        setFormData({ ...formData, firstName: v })
      )}
      {renderField("lastName", User, "Last name", formData.lastName, (v) =>
        setFormData({ ...formData, lastName: v })
      )}

      <Text style={s.fieldLabel}>DATE OF BIRTH</Text>
      <View style={s.dobRow}>
        <View collapsable={false} style={[s.dobField, focusedField === "dobDay" && s.dobFieldFocused]}>
          <TextInput
            collapsable={false}
            style={s.dobInput}
            placeholder="DD"
            placeholderTextColor="#A39BB0"
            keyboardType="number-pad"
            maxLength={2}
            value={dobDay}
            onChangeText={handleDayChange}
            onFocus={() => setFocusedField("dobDay")}
            onBlur={() => setFocusedField(null)}
          />
        </View>
        <View collapsable={false} style={[s.dobField, focusedField === "dobMonth" && s.dobFieldFocused]}>
          <TextInput
            collapsable={false}
            style={s.dobInput}
            placeholder="MM"
            placeholderTextColor="#A39BB0"
            keyboardType="number-pad"
            maxLength={2}
            value={dobMonth}
            onChangeText={handleMonthChange}
            onFocus={() => setFocusedField("dobMonth")}
            onBlur={() => setFocusedField(null)}
          />
        </View>
        <View collapsable={false} style={[s.dobField, focusedField === "dobYear" && s.dobFieldFocused]}>
          <TextInput
            collapsable={false}
            style={s.dobInput}
            placeholder="YYYY"
            placeholderTextColor="#A39BB0"
            keyboardType="number-pad"
            maxLength={4}
            value={dobYear}
            onChangeText={handleYearChange}
            onFocus={() => setFocusedField("dobYear")}
            onBlur={() => setFocusedField(null)}
          />
        </View>
        {currentAge > 0 && (
          <View style={s.ageBadge}>
            <Text style={s.ageBadgeText}>{currentAge} yrs</Text>
          </View>
        )}
      </View>

      <Text style={s.fieldLabel}>GENDER</Text>
      <View style={s.chipRow}>
        {["Male", "Female", "Other"].map((val) => (
          <TouchableOpacity
            key={val}
            style={[s.chip, formData.gender === val && s.chipActive]}
            onPress={() => setFormData({ ...formData, gender: val })}
            activeOpacity={0.8}
          >
            <Text style={[s.chipText, formData.gender === val && s.chipTextActive]}>{val}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {validationError && <Text style={s.errorInline}>{validationError}</Text>}

      <TouchableOpacity style={s.primaryBtn} onPress={handleNext} activeOpacity={0.9}>
        <LinearGradient
          colors={[palette.purple.deep, "#34005B"]}
          style={s.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={s.primaryBtnText}>Continue</Text>
          <ArrowRight size={16} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // ─── Step 2: Contact ──────────────────────────────────────
  const renderStep2 = () => (
    <View style={s.card}>
      <Text style={s.cardTitle}>Contact Information</Text>
      <Text style={s.cardSubtitle}>Let us know how to contact you</Text>

      {renderField("email", Mail, "Email address", formData.email, (v) =>
        setFormData({ ...formData, email: v })
      )}
      {renderField("mobile", Phone, "Mobile number", formData.mobile, (v) =>
        setFormData({ ...formData, mobile: v })
      )}
      {renderField("referredByCode", Gift, "Referral code (Optional)", formData.referredByCode, (v) =>
        setFormData({ ...formData, referredByCode: v })
      )}

      <Text style={s.fieldLabel}>COUNTRY</Text>
      <View style={s.chipRow}>
        {["India", "United States", "Canada", "United Kingdom", "Australia"].map((val) => (
          <TouchableOpacity
            key={val}
            style={[s.chip, formData.country === val && s.chipActive]}
            onPress={() => setFormData({ ...formData, country: val })}
            activeOpacity={0.8}
          >
            <Text style={[s.chipText, formData.country === val && s.chipTextActive]}>{val}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.fieldLabel}>PROFILE CREATED BY</Text>
      <View style={s.chipRow}>
        {["Self", "Parent", "Sibling", "Friend"].map((val) => (
          <TouchableOpacity
            key={val}
            style={[s.chip, formData.createdBy === val && s.chipActive]}
            onPress={() => setFormData({ ...formData, createdBy: val })}
            activeOpacity={0.8}
          >
            <Text style={[s.chipText, formData.createdBy === val && s.chipTextActive]}>{val}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {validationError && <Text style={s.errorInline}>{validationError}</Text>}

      <View style={s.btnRow}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => {
            setValidationError(null);
            setStep(1);
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={palette.purple.deep} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.primaryBtn, s.primaryBtnFlex]} onPress={handleNext} activeOpacity={0.9}>
          <LinearGradient
            colors={[palette.purple.deep, "#34005B"]}
            style={s.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={s.primaryBtnText}>Continue</Text>
            <ArrowRight size={16} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Step 3: Security ─────────────────────────────────────
  const renderStep3 = () => (
    <View style={s.card}>
      <Text style={s.cardTitle}>Account Security</Text>
      <Text style={s.cardSubtitle}>Create credentials to secure your profile</Text>

      <View style={s.fieldWrap}>
        <Text style={s.fieldLabel}>CREATE PASSWORD</Text>
        <View
          collapsable={false}
          style={[
            s.inputRow,
            focusedField === "password" && s.inputRowFocused,
          ]}
        >
          <Lock
            size={18}
            color={focusedField === "password" ? palette.purple.deep : palette.purple.muted}
            style={s.fieldIcon}
          />
          <TextInput
            collapsable={false}
            style={s.textInput}
            placeholder="Create password"
            placeholderTextColor="#A39BB0"
            value={formData.password}
            onChangeText={(v) => setFormData({ ...formData, password: v })}
            secureTextEntry={!showPassword}
            onFocus={() => setFocusedField("password")}
            onBlur={() => setFocusedField(null)}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={s.eyeBtn}
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

      {/* Checkbox 1: Certify Age */}
      <TouchableOpacity
        style={s.termsRow}
        onPress={() => setCertifyAge(!certifyAge)}
        activeOpacity={0.8}
      >
        <View style={[s.checkbox, certifyAge && s.checkboxChecked]}>
          {certifyAge && <CheckCircle2 size={12} color="#FFF" />}
        </View>
        <Text style={s.termsText}>
          I certify that I am at least 18 years old. (Required)
        </Text>
      </TouchableOpacity>

      {/* Checkbox 2: Terms of Use */}
      <TouchableOpacity
        style={s.termsRow}
        onPress={() => setAgreedToTerms(!agreedToTerms)}
        activeOpacity={0.8}
      >
        <View style={[s.checkbox, agreedToTerms && s.checkboxChecked]}>
          {agreedToTerms && <CheckCircle2 size={12} color="#FFF" />}
        </View>
        <Text style={s.termsText}>
          I agree to the Terms of Use. (Required)
        </Text>
      </TouchableOpacity>

      {/* Checkbox 3: Privacy Policy */}
      <TouchableOpacity
        style={s.termsRow}
        onPress={() => setAgreedToPrivacy(!agreedToPrivacy)}
        activeOpacity={0.8}
      >
        <View style={[s.checkbox, agreedToPrivacy && s.checkboxChecked]}>
          {agreedToPrivacy && <CheckCircle2 size={12} color="#FFF" />}
        </View>
        <Text style={s.termsText}>
          I agree to the collection and processing of my profile data as outlined in the Privacy Policy. (Required)
        </Text>
      </TouchableOpacity>

      {validationError && <Text style={s.errorInline}>{validationError}</Text>}
      {error && (
        <View style={s.errorBox}>
          <Text style={s.errorBoxText}>
            {typeof error === "string" ? error : "An unexpected registration error occurred."}
          </Text>
        </View>
      )}

      <View style={s.btnRow}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => {
            setValidationError(null);
            setStep(2);
          }}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={palette.purple.deep} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.primaryBtn, s.primaryBtnFlex, loading && s.primaryBtnDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[palette.purple.deep, "#34005B"]}
            style={s.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={s.primaryBtnText}>Finish & Join</Text>
                <Sparkles size={14} color="#FFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      {/* Ambient Background Glows */}
      <LinearGradient
        colors={["rgba(59, 30, 84, 0.12)", "rgba(59, 30, 84, 0)"]}
        style={s.bgBlob1}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(212, 175, 55, 0.08)", "rgba(212, 175, 55, 0)"]}
        style={s.bgBlob2}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["rgba(59, 30, 84, 0.1)", "rgba(59, 30, 84, 0)"]}
        style={s.bgBlob3}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.keyboardView}
      >
        <ScrollView
          contentContainerStyle={s.scrollBody}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={false}
        >
          {/* Header Section */}
          <View style={s.headerSection}>
            {/* Step Indicators Row */}
            <View style={s.stepIndicatorsRow}>
              {stepsData.map((item, i) => {
                const active = i + 1 === step;
                const passed = i + 1 < step;
                return (
                  <View key={i} style={s.indicatorItem}>
                    <View
                      style={[
                        s.indicatorDot,
                        active && s.indicatorDotActive,
                        passed && s.indicatorDotPassed,
                      ]}
                    >
                      {passed ? (
                        <CheckCircle2 size={12} color="#FFF" />
                      ) : (
                        <Text
                          style={[
                            s.indicatorNumberText,
                            active && s.indicatorNumberTextActive,
                          ]}
                        >
                          {i + 1}
                        </Text>
                      )}
                    </View>
                    <Text style={[s.indicatorLabel, active && s.indicatorLabelActive]}>
                      {item.title}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Footer */}
          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")} activeOpacity={0.7}>
              <Text style={s.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={s.trustRow}>
            <Shield size={12} color="#7A6F8B" />
            <Text style={s.trustText}>256-bit Secure Encryption · Privacy Protected</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8F5FC",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: height * 0.015,
  },
  logo: {
    width: width * 0.5,
    height: 54,
  },
  taglineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
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
    color: "#6B5A80",
    letterSpacing: 1.5,
    ...fonts.semibold,
    textAlign: "center",
  },
  stepIndicatorsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    gap: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
    borderWidth: 1,
    borderColor: "rgba(237, 230, 245, 0.4)",
    marginTop: 10,
  },
  indicatorItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  indicatorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F0EAF5",
    justifyContent: "center",
    alignItems: "center",
  },
  indicatorDotActive: {
    backgroundColor: palette.purple.deep,
  },
  indicatorDotPassed: {
    backgroundColor: palette.purple.deep,
  },
  indicatorNumberText: {
    fontSize: 9,
    ...fonts.semibold,
    color: "#7A6F8B",
  },
  indicatorNumberTextActive: {
    color: "#FFFFFF",
  },
  indicatorLabel: {
    fontSize: 10,
    ...fonts.semibold,
    color: "#968AA7",
  },
  indicatorLabelActive: {
    color: palette.purple.deep,
    ...fonts.semibold,
  },
  keyboardView: {
    flex: 1,
  },
  scrollBody: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === "ios" ? 24 : 36,
    paddingBottom: 40,
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
  card: {
    backgroundColor: "transparent",
    width: "100%",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 32,
    ...fonts.bold,
    color: palette.purple.deep,
    marginBottom: 8,
    letterSpacing: -0.5,
    textAlign: "left",
  },
  cardSubtitle: {
    fontSize: 15,
    color: palette.purple.muted,
    marginBottom: 24,
    ...fonts.regular,
    textAlign: "left",
    lineHeight: 22,
  },
  fieldWrap: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    ...fonts.semibold,
    color: "#7A6F8B",
    letterSpacing: 1,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#EDE6F5",
    paddingHorizontal: 18,
    height: 50,
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
  dobRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  dobField: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#EDE6F5",
    height: 44,
    justifyContent: "center",
  },
  dobFieldFocused: {
    borderColor: palette.purple.deep,
    backgroundColor: "#FFFFFF",
  },
  dobInput: {
    textAlign: "center",
    fontSize: 15,
    color: palette.purple.deep,
    ...fonts.semibold,
    paddingVertical: 0,
    height: 44,
  },
  ageBadge: {
    backgroundColor: palette.gold.main,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    justifyContent: "center",
  },
  ageBadgeText: {
    color: palette.purple.deep,
    fontSize: 11,
    ...fonts.bold,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#EDE6F5",
    backgroundColor: "#FFFFFF",
  },
  chipActive: {
    backgroundColor: palette.purple.deep,
    borderColor: palette.purple.deep,
  },
  chipText: {
    fontSize: 13,
    color: "#7A6F8B",
    ...fonts.semibold,
  },
  chipTextActive: {
    color: "#FFF",
  },
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  primaryBtn: {
    borderRadius: 25,
    overflow: "hidden",
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  primaryBtnFlex: {
    flex: 1,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryGradient: {
    height: 50,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: 16,
    ...fonts.semibold,
  },
  backBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "#EDE6F5",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#EDE6F5",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: palette.purple.deep,
    borderColor: palette.purple.deep,
  },
  termsText: {
    fontSize: 12,
    color: "#7A6F8B",
    flex: 1,
    lineHeight: 18,
    ...fonts.medium,
  },
  errorInline: {
    color: "#D32F2F",
    fontSize: 12,
    marginBottom: 14,
    marginLeft: 4,
    ...fonts.medium,
  },
  errorBox: {
    backgroundColor: "#FFF2F2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#FFE6E6",
  },
  errorBoxText: {
    color: "#D32F2F",
    fontSize: 13,
    textAlign: "center",
    ...fonts.medium,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    color: "#7A6F8B",
    fontSize: 14,
    ...fonts.medium,
  },
  footerLink: {
    color: palette.purple.deep,
    fontSize: 14,
    ...fonts.semibold,
  },
  trustRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
    opacity: 0.6,
  },
  trustText: {
    fontSize: 11,
    color: "#7A6F8B",
    marginLeft: 6,
    ...fonts.semibold,
  },
});
