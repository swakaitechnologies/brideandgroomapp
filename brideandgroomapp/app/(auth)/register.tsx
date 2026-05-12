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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { register } from "@/src/store/authSlice";
import { RootState, AppDispatch } from "@/src/store";
import { Text, View } from "@/components/Themed";
import { router, Link } from "expo-router";
import { 
  User, Mail, Phone, Lock, 
  ArrowRight, ArrowLeft, CheckCircle2,
  Calendar, Users, Sparkles,
  Eye, EyeOff
} from "lucide-react-native";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { palette } from "../../src/theme/colors";

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [date, setDate] = useState(new Date(2000, 0, 1));
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    createdBy: "Self",
    dateOfBirth: "",
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const calculateAge = (dobString: string) => {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const currentAge = calculateAge(formData.dateOfBirth);

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (event.type === 'set' && selectedDate) {
      setDate(selectedDate);
      
      // Fix timezone issue: Extract local date components
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      setFormData({ ...formData, dateOfBirth: formattedDate });
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleNext = () => {
    setValidationError(null);
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth) {
        setValidationError("Please fill all identity fields");
        return;
      }
      if (currentAge < 18) {
        setValidationError("You must be at least 18 years old to register");
        return;
      }
    }
    if (step === 2) {
      if (!formData.email || !formData.mobile) {
        setValidationError("Please enter contact details");
        return;
      }
    }
    setStep(step + 1);
  };

  const handleRegister = async () => {
    if (!agreedToTerms) return;
    const result = await dispatch(register({ ...formData, agreedToTerms }));
    if (register.fulfilled.match(result)) {
      router.replace("/(tabs)");
    }
  };

  const renderStep1 = () => (
    <View style={styles.formCard}>
      <Text style={styles.cardTitle}>Identity Details</Text>
      
      <View style={styles.inputContainer}>
        <User size={20} color={palette.purple.deep} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor={palette.neutral.grey}
          value={formData.firstName}
          onChangeText={(val) => setFormData({ ...formData, firstName: val })}
        />
      </View>

      <View style={styles.inputContainer}>
        <User size={20} color={palette.purple.deep} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor={palette.neutral.grey}
          value={formData.lastName}
          onChangeText={(val) => setFormData({ ...formData, lastName: val })}
        />
      </View>

      <TouchableOpacity 
        style={styles.inputContainer} 
        onPress={() => setShowDatePicker(true)}
      >
        <Calendar size={20} color={palette.purple.deep} style={styles.inputIcon} />
        <View style={styles.dateDisplay}>
          <Text style={[
            styles.dateText, 
            !formData.dateOfBirth && { color: palette.neutral.grey }
          ]}>
            {formData.dateOfBirth || "Select Date of Birth"}
          </Text>
        </View>
        {currentAge > 0 && (
          <View style={styles.ageBadge}>
            <Text style={styles.ageBadgeText}>{currentAge} Yrs</Text>
          </View>
        )}
      </TouchableOpacity>

      {validationError && (
        <Text style={styles.inlineError}>{validationError}</Text>
      )}

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          maximumDate={new Date()}
        />
      )}

      <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
        <Text style={styles.primaryButtonText}>NEXT STEP</Text>
        <ArrowRight size={18} color={palette.purple.deep} />
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.formCard}>
      <Text style={styles.cardTitle}>Access & Connect</Text>
      
      <View style={styles.inputContainer}>
        <Mail size={20} color={palette.purple.deep} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor={palette.neutral.grey}
          value={formData.email}
          onChangeText={(val) => setFormData({ ...formData, email: val })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Phone size={20} color={palette.purple.deep} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Mobile Number"
          placeholderTextColor={palette.neutral.grey}
          value={formData.mobile}
          onChangeText={(val) => setFormData({ ...formData, mobile: val })}
          keyboardType="phone-pad"
        />
      </View>

      <Text style={styles.label}>Profile Created By</Text>
      <View style={styles.chipContainer}>
        {["Self", "Parent", "Sibling", "Friend"].map((val) => (
          <TouchableOpacity
            key={val}
            style={[styles.chip, formData.createdBy === val && styles.chipActive]}
            onPress={() => setFormData({ ...formData, createdBy: val })}
          >
            <Text style={[styles.chipText, formData.createdBy === val && styles.chipTextActive]}>
              {val}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(1)}>
          <ArrowLeft size={18} color={palette.purple.muted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryButton, { flex: 1, marginTop: 0 }]} onPress={handleNext}>
          <Text style={styles.primaryButtonText}>CONTINUE</Text>
          <ArrowRight size={18} color={palette.purple.deep} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.formCard}>
      <Text style={styles.cardTitle}>Account Security</Text>
      
      <View style={styles.inputContainer}>
        <Lock size={20} color={palette.purple.deep} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Create Password"
          placeholderTextColor={palette.neutral.grey}
          value={formData.password}
          onChangeText={(val) => setFormData({ ...formData, password: val })}
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

      <TouchableOpacity 
        style={styles.termsContainer}
        onPress={() => setAgreedToTerms(!agreedToTerms)}
      >
        <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
          {agreedToTerms && <CheckCircle2 size={14} color={palette.purple.deep} />}
        </View>
        <Text style={styles.termsText}>
          I agree to the Terms of Use and Privacy Policy.
        </Text>
      </TouchableOpacity>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {typeof error === 'string' ? error : 'An unexpected error occurred. Please check your connection.'}
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(2)}>
          <ArrowLeft size={18} color={palette.purple.muted} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.primaryButton, { flex: 1, marginTop: 0 }, (!agreedToTerms || loading) && styles.buttonDisabled]} 
          onPress={handleRegister}
          disabled={!agreedToTerms || loading}
        >
          {loading ? (
            <ActivityIndicator color={palette.purple.deep} />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>FINISH & JOIN</Text>
              <Sparkles size={18} color={palette.purple.deep} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.progressContainer}>
            {[1, 2, 3].map((s) => (
              <View 
                key={s} 
                style={[styles.progressBar, s <= step && styles.progressBarActive]} 
              />
            ))}
          </View>
          <Text style={styles.stepTitle}>Step {step} of 3</Text>
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/login" asChild>
            <TouchableOpacity>
              <Text style={styles.loginLink}>Log in here</Text>
            </TouchableOpacity>
          </Link>
        </View>
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
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    backgroundColor: "transparent",
  },
  logo: {
    width: width * 0.7,
    height: 100,
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
    backgroundColor: "transparent",
  },
  progressBar: {
    width: 40,
    height: 4,
    backgroundColor: palette.purple.border,
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: palette.gold.main,
  },
  stepTitle: {
    fontSize: 12,
    color: palette.purple.muted,
    fontWeight: "bold",
    textTransform: "uppercase",
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
    fontSize: 20,
    fontWeight: "bold",
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
  dateDisplay: {
    flex: 1,
    height: 55,
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  dateText: {
    fontSize: 15,
    color: palette.purple.deep,
  },
  ageBadge: {
    backgroundColor: palette.gold.main,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ageBadgeText: {
    color: palette.purple.deep,
    fontSize: 10,
    fontWeight: "bold",
  },
  inlineError: {
    color: palette.status.error,
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: palette.purple.muted,
    marginTop: 5,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 25,
    backgroundColor: "transparent",
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: palette.purple.border,
    backgroundColor: "#FDFBFF",
  },
  chipActive: {
    backgroundColor: palette.purple.deep,
    borderColor: palette.purple.deep,
  },
  chipText: {
    fontSize: 13,
    color: palette.purple.muted,
    fontWeight: "600",
  },
  chipTextActive: {
    color: palette.neutral.white,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 15,
    marginTop: 10,
    backgroundColor: "transparent",
  },
  primaryButton: {
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
  primaryButtonText: {
    color: palette.purple.deep,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
    marginRight: 10,
  },
  secondaryButton: {
    width: 55,
    height: 55,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: palette.purple.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.neutral.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: palette.purple.border,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: palette.gold.main,
    borderColor: palette.gold.main,
  },
  termsText: {
    fontSize: 12,
    color: palette.purple.muted,
    flex: 1,
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
  loginLink: {
    color: palette.gold.main,
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
  },
});
