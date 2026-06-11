import React, { useState, useEffect } from "react";
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
  Modal,
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
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  Shield,
  Gift,
  ChevronDown,
} from "lucide-react-native";
import { palette } from "@/src/theme/colors";
import { fonts } from "@/src/theme";
import LinearGradient from "react-native-linear-gradient";
import { TrackService } from "../../services/analyticsService";

const { height } = Dimensions.get("window");

interface SelectionModalProps {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}

function SelectionModal({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}: SelectionModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={s.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={s.modalContent}>
          <Text style={s.modalTitle}>{title}</Text>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[
                s.modalOption,
                selectedValue === opt && s.modalOptionActive,
              ]}
              onPress={() => {
                onSelect(opt);
                onClose();
              }}
            >
              <Text
                style={[
                  s.modalOptionText,
                  selectedValue === opt && s.modalOptionTextActive,
                ]}
              >
                {opt}
              </Text>
              {selectedValue === opt && (
                <CheckCircle2 size={16} color={palette.purple.deep} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

export default function RegisterScreen() {
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

  // Selection Modals visibility
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [createdByModalVisible, setCreatedByModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    TrackService.trackScreen("Register_Screen");
  }, []);

  const updateDOB = (day: string, month: string, year: string) => {
    if (day && month && year && year.length === 4) {
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
    if (c === "" || (parseInt(c, 10) >= 1 && parseInt(c, 10) <= 31)) {
      setDobDay(c);
      updateDOB(c, dobMonth, dobYear);
    }
  };

  const handleMonthChange = (val: string) => {
    const c = val.replace(/[^0-9]/g, "");
    if (c === "" || (parseInt(c, 10) >= 1 && parseInt(c, 10) <= 12)) {
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

  const handleRegister = async () => {
    setValidationError(null);

    // 1. Identity validation
    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.dateOfBirth ||
      !formData.gender
    ) {
      setValidationError("Please fill all fields and select gender.");
      return;
    }
    if (isUnderage) {
      setValidationError("You must be 18 years or older to register.");
      return;
    }

    // 2. Contact validation
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

    // 3. Security & Consent validation
    if (formData.password.length < 6) {
      setValidationError("Password must be at least 6 characters.");
      return;
    }
    if (!certifyAge) {
      setValidationError("You must certify that you are at least 18 years old.");
      return;
    }
    if (!agreedToTerms) {
      setValidationError("Please agree to the Terms of Use.");
      return;
    }
    if (!agreedToPrivacy) {
      setValidationError(
        "Please agree to the collection and processing of your profile data as outlined in the Privacy Policy."
      );
      return;
    }

    TrackService.trackEvent("registration_initiated", {
      createdBy: formData.createdBy,
    });
    const result = await dispatch(
      register({ ...formData, agreedToTerms, is18Plus: currentAge >= 18 })
    );
    if (register.fulfilled.match(result)) {
      try {
        await AsyncStorage.setItem("isNewRegistration", "true");
      } catch (err) {
        console.log("Error setting registration flag:", err);
      }
      TrackService.trackEvent("registration_success");
      navigation.reset({ index: 0, routes: [{ name: "VerifyOTP" }] });
    }
  };

  return (
    <View style={s.root}>
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
            <Image
              source={require("../../../assets/images/logo.png")}
              style={s.logo}
              resizeMode="contain"
            />
            <Text style={s.taglineText}>EXCLUSIVITY & ELEGANCE</Text>
          </View>

          {/* Registration Form Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Create Account</Text>
            <Text style={s.cardSubtitle}>
              Fill in your details to discover your match
            </Text>

            {/* Row 1: First Name & Last Name */}
            <View style={s.row}>
              <View style={s.halfField}>
                <Text style={s.fieldLabel}>FIRST NAME</Text>
                <View
                  style={[
                    s.inputRow,
                    focusedField === "firstName" && s.inputRowFocused,
                  ]}
                >
                  <User
                    size={16}
                    color={
                      focusedField === "firstName"
                        ? palette.purple.deep
                        : palette.purple.muted
                    }
                    style={s.fieldIcon}
                  />
                  <TextInput
                    style={s.textInput}
                    placeholder="First name"
                    placeholderTextColor="#A39BB0"
                    value={formData.firstName}
                    onChangeText={(v) =>
                      setFormData({ ...formData, firstName: v })
                    }
                    onFocus={() => setFocusedField("firstName")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <View style={s.halfField}>
                <Text style={s.fieldLabel}>LAST NAME</Text>
                <View
                  style={[
                    s.inputRow,
                    focusedField === "lastName" && s.inputRowFocused,
                  ]}
                >
                  <User
                    size={16}
                    color={
                      focusedField === "lastName"
                        ? palette.purple.deep
                        : palette.purple.muted
                    }
                    style={s.fieldIcon}
                  />
                  <TextInput
                    style={s.textInput}
                    placeholder="Last name"
                    placeholderTextColor="#A39BB0"
                    value={formData.lastName}
                    onChangeText={(v) =>
                      setFormData({ ...formData, lastName: v })
                    }
                    onFocus={() => setFocusedField("lastName")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            </View>

            {/* Row 2: Date of Birth & Gender */}
            <View style={s.row}>
              <View style={s.dobFieldContainer}>
                <Text style={s.fieldLabel}>DATE OF BIRTH</Text>
                <View style={s.dobRow}>
                  <View
                    style={[
                      s.dobField,
                      focusedField === "dobDay" && s.dobFieldFocused,
                    ]}
                  >
                    <TextInput
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
                  <View
                    style={[
                      s.dobField,
                      focusedField === "dobMonth" && s.dobFieldFocused,
                    ]}
                  >
                    <TextInput
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
                  <View
                    style={[
                      s.dobField,
                      focusedField === "dobYear" && s.dobFieldFocused,
                    ]}
                  >
                    <TextInput
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
                      <Text style={s.ageBadgeText}>{currentAge}y</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={s.genderFieldContainer}>
                <Text style={s.fieldLabel}>GENDER</Text>
                <TouchableOpacity
                  style={[
                    s.selectRow,
                    genderModalVisible && s.selectRowFocused,
                  ]}
                  onPress={() => setGenderModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      s.selectText,
                      !formData.gender && s.selectPlaceholder,
                    ]}
                  >
                    {formData.gender || "Gender"}
                  </Text>
                  <ChevronDown size={14} color={palette.purple.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Row 3: Email Address & Mobile Number */}
            <View style={s.row}>
              <View style={s.halfField}>
                <Text style={s.fieldLabel}>EMAIL ADDRESS</Text>
                <View
                  style={[
                    s.inputRow,
                    focusedField === "email" && s.inputRowFocused,
                  ]}
                >
                  <Mail
                    size={16}
                    color={
                      focusedField === "email"
                        ? palette.purple.deep
                        : palette.purple.muted
                    }
                    style={s.fieldIcon}
                  />
                  <TextInput
                    style={s.textInput}
                    placeholder="email@domain.com"
                    placeholderTextColor="#A39BB0"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(v) => setFormData({ ...formData, email: v })}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <View style={s.halfField}>
                <Text style={s.fieldLabel}>MOBILE NUMBER</Text>
                <View
                  style={[
                    s.inputRow,
                    focusedField === "mobile" && s.inputRowFocused,
                  ]}
                >
                  <Phone
                    size={16}
                    color={
                      focusedField === "mobile"
                        ? palette.purple.deep
                        : palette.purple.muted
                    }
                    style={s.fieldIcon}
                  />
                  <TextInput
                    style={s.textInput}
                    placeholder="10-digit number"
                    placeholderTextColor="#A39BB0"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={formData.mobile}
                    onChangeText={(v) =>
                      setFormData({ ...formData, mobile: v })
                    }
                    onFocus={() => setFocusedField("mobile")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            </View>

            {/* Row 4: Password & Referral Code */}
            <View style={s.row}>
              <View style={s.halfField}>
                <Text style={s.fieldLabel}>PASSWORD</Text>
                <View
                  style={[
                    s.inputRow,
                    focusedField === "password" && s.inputRowFocused,
                  ]}
                >
                  <Lock
                    size={16}
                    color={
                      focusedField === "password"
                        ? palette.purple.deep
                        : palette.purple.muted
                    }
                    style={s.fieldIcon}
                  />
                  <TextInput
                    style={s.textInput}
                    placeholder="Min 6 chars"
                    placeholderTextColor="#A39BB0"
                    value={formData.password}
                    onChangeText={(v) =>
                      setFormData({ ...formData, password: v })
                    }
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
                      <EyeOff size={16} color={palette.purple.muted} />
                    ) : (
                      <Eye size={16} color={palette.purple.muted} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s.halfField}>
                <Text style={s.fieldLabel}>REFERRAL (OPTIONAL)</Text>
                <View
                  style={[
                    s.inputRow,
                    focusedField === "referredByCode" && s.inputRowFocused,
                  ]}
                >
                  <Gift
                    size={16}
                    color={
                      focusedField === "referredByCode"
                        ? palette.purple.deep
                        : palette.purple.muted
                    }
                    style={s.fieldIcon}
                  />
                  <TextInput
                    style={s.textInput}
                    placeholder="Promo code"
                    placeholderTextColor="#A39BB0"
                    value={formData.referredByCode}
                    onChangeText={(v) =>
                      setFormData({ ...formData, referredByCode: v })
                    }
                    onFocus={() => setFocusedField("referredByCode")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            </View>

            {/* Row 5: Profile Created By & Country Selector */}
            <View style={s.row}>
              <View style={s.halfField}>
                <Text style={s.fieldLabel}>CREATED BY</Text>
                <TouchableOpacity
                  style={[
                    s.selectRow,
                    createdByModalVisible && s.selectRowFocused,
                  ]}
                  onPress={() => setCreatedByModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      s.selectText,
                      !formData.createdBy && s.selectPlaceholder,
                    ]}
                  >
                    {formData.createdBy || "Select relation"}
                  </Text>
                  <ChevronDown size={14} color={palette.purple.muted} />
                </TouchableOpacity>
              </View>

              <View style={s.halfField}>
                <Text style={s.fieldLabel}>COUNTRY</Text>
                <TouchableOpacity
                  style={[
                    s.selectRow,
                    countryModalVisible && s.selectRowFocused,
                  ]}
                  onPress={() => setCountryModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      s.selectText,
                      !formData.country && s.selectPlaceholder,
                    ]}
                  >
                    {formData.country || "Select country"}
                  </Text>
                  <ChevronDown size={14} color={palette.purple.muted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Consent Checklist (DPDP Requirements) */}
            <View style={s.consentSection}>
              {/* Checkbox 1: Certify Age */}
              <TouchableOpacity
                style={s.termsRow}
                onPress={() => setCertifyAge(!certifyAge)}
                activeOpacity={0.8}
              >
                <View style={[s.checkbox, certifyAge && s.checkboxChecked]}>
                  {certifyAge && <CheckCircle2 size={10} color="#FFF" />}
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
                  {agreedToTerms && <CheckCircle2 size={10} color="#FFF" />}
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
                  {agreedToPrivacy && <CheckCircle2 size={10} color="#FFF" />}
                </View>
                <Text style={s.termsText}>
                  I agree to the collection and processing of my profile data
                  as outlined in the Privacy Policy. (Required)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {validationError && (
              <Text style={s.errorInline}>{validationError}</Text>
            )}
            {error && (
              <View style={s.errorBox}>
                <Text style={s.errorBoxText}>
                  {typeof error === "string"
                    ? error
                    : "An unexpected registration error occurred."}
                </Text>
              </View>
            )}

            {/* Primary Action Button */}
            <TouchableOpacity
              style={[s.primaryBtn, loading && s.btnDisabled]}
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

          {/* Footer Navigation */}
          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.7}
            >
              <Text style={s.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <View style={s.trustRow}>
            <Shield size={12} color="#7A6F8B" />
            <Text style={s.trustText}>
              256-bit Secure Encryption · Privacy Protected
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals for Custom Selectors */}
      <SelectionModal
        visible={genderModalVisible}
        title="Select Gender"
        options={["Male", "Female", "Other"]}
        selectedValue={formData.gender}
        onSelect={(val) => setFormData({ ...formData, gender: val })}
        onClose={() => setGenderModalVisible(false)}
      />

      <SelectionModal
        visible={createdByModalVisible}
        title="Profile Created By"
        options={["Self", "Parent", "Sibling", "Friend"]}
        selectedValue={formData.createdBy}
        onSelect={(val) => setFormData({ ...formData, createdBy: val })}
        onClose={() => setCreatedByModalVisible(false)}
      />

      <SelectionModal
        visible={countryModalVisible}
        title="Select Country"
        options={[
          "India",
          "United States",
          "Canada",
          "United Kingdom",
          "Australia",
        ]}
        selectedValue={formData.country}
        onSelect={(val) => setFormData({ ...formData, country: val })}
        onClose={() => setCountryModalVisible(false)}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8F5FC",
  },
  keyboardView: {
    flex: 1,
  },
  scrollBody: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 12 : 24,
    paddingBottom: 20,
    justifyContent: "center",
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 140,
    height: 38,
  },
  taglineText: {
    fontSize: 9,
    color: "#6B5A80",
    letterSpacing: 1.2,
    ...fonts.semibold,
    textAlign: "center",
    marginTop: 2,
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
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 20,
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 6,
  },
  cardTitle: {
    fontSize: 22,
    ...fonts.bold,
    color: palette.purple.deep,
    marginBottom: 4,
    letterSpacing: -0.4,
    textAlign: "left",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#7A6F8B",
    marginBottom: 16,
    ...fonts.regular,
    textAlign: "left",
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  halfField: {
    flex: 1,
  },
  dobFieldContainer: {
    flex: 1.2,
  },
  genderFieldContainer: {
    flex: 0.8,
  },
  fieldLabel: {
    fontSize: 9,
    ...fonts.semibold,
    color: "#7A6F8B",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F2FC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 10,
    height: 44,
  },
  inputRowFocused: {
    borderColor: palette.purple.deep,
    backgroundColor: "#FFFFFF",
  },
  fieldIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    color: palette.purple.deep,
    ...fonts.medium,
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingLeft: 6,
  },
  dobRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dobField: {
    flex: 1,
    backgroundColor: "#F6F2FC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "transparent",
    height: 44,
    justifyContent: "center",
  },
  dobFieldFocused: {
    borderColor: palette.purple.deep,
    backgroundColor: "#FFFFFF",
  },
  dobInput: {
    textAlign: "center",
    fontSize: 13,
    color: palette.purple.deep,
    ...fonts.semibold,
    paddingVertical: 0,
    height: 44,
  },
  ageBadge: {
    backgroundColor: palette.gold.main,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    justifyContent: "center",
    marginLeft: 2,
  },
  ageBadgeText: {
    color: palette.purple.deep,
    fontSize: 9,
    ...fonts.bold,
  },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F6F2FC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 10,
    height: 44,
  },
  selectRowFocused: {
    borderColor: palette.purple.deep,
    backgroundColor: "#FFFFFF",
  },
  selectText: {
    fontSize: 13,
    color: palette.purple.deep,
    ...fonts.medium,
  },
  selectPlaceholder: {
    color: "#A39BB0",
  },
  consentSection: {
    marginTop: 4,
    marginBottom: 10,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#EDE6F5",
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: palette.purple.deep,
    borderColor: palette.purple.deep,
  },
  termsText: {
    fontSize: 10,
    color: "#7A6F8B",
    flex: 1,
    lineHeight: 13,
    ...fonts.medium,
  },
  errorInline: {
    color: "#D32F2F",
    fontSize: 11,
    marginBottom: 8,
    marginLeft: 2,
    ...fonts.medium,
  },
  errorBox: {
    backgroundColor: "#FFF2F2",
    borderRadius: 10,
    padding: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#FFE6E6",
  },
  errorBoxText: {
    color: "#D32F2F",
    fontSize: 12,
    textAlign: "center",
    ...fonts.medium,
  },
  primaryBtn: {
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
    width: "100%",
    marginTop: 4,
  },
  primaryGradient: {
    height: 48,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  primaryBtnText: {
    color: "#FFF",
    fontSize: 15,
    ...fonts.semibold,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  footerText: {
    color: "#7A6F8B",
    fontSize: 13,
    ...fonts.medium,
  },
  footerLink: {
    color: palette.purple.deep,
    fontSize: 13,
    ...fonts.semibold,
  },
  trustRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    opacity: 0.6,
  },
  trustText: {
    fontSize: 10,
    color: "#7A6F8B",
    marginLeft: 4,
    ...fonts.semibold,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 16,
    ...fonts.bold,
    color: palette.purple.deep,
    marginBottom: 14,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: "#F9F6FC",
  },
  modalOptionActive: {
    backgroundColor: "#EFEAF7",
  },
  modalOptionText: {
    fontSize: 14,
    color: palette.purple.deep,
    ...fonts.medium,
  },
  modalOptionTextActive: {
    ...fonts.bold,
  },
});
