import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  Modal,
  FlatList,
  View,
  Text,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft, Camera, Edit2, Save,
  User, Phone, MapPin,
  Briefcase, Users,
  Heart, Globe, Star, ChevronDown,
  Check, X, Lock,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { palette } from '../../theme/colors';
import api, { getProfile, updateProfile, resolvePhotoUrl } from '../../services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showToast } from '../../utils/toast';
import { fonts } from "@/src/theme";

const { width, height: screenHeight } = Dimensions.get('window');

// Option Constants
const OPTIONS = {
  gender: ["Male", "Female", "Other"],
  maritalStatus: ["Never Married", "Divorced", "Widowed", "Awaiting Divorce"],
  createdBy: ["Self", "Parent", "Sibling", "Relative", "Friend"],
  relocate: ["Yes", "No", "Depends"],
  religion: ["Hindu", "Muslim", "Christian", "Sikh", "Jain", "Other"],
  familyValues: ["Orthodox", "Traditional", "Moderate", "Liberal"],
  zodiacSign: ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"],
  industry: ["IT / Software", "Healthcare", "Education", "Banking / Finance", "Business", "Other"],
  income: ["< 5 LPA", "5L - 10L", "10L - 15L", "15L - 25L", "25L - 50L", "50L+"],
  familyType: ["Nuclear", "Joint"],
  diet: ["Vegetarian", "Non-Vegetarian", "Eggetarian", "Vegan"],
  smoking: ["No", "Yes", "Occasionally"],
  drinking: ["No", "Yes", "Occasionally"],
  activity: ["Sedentary", "Moderate", "Active", "Athletic"],
};

// Fields per tab — used for completion tracking & dirty detection
const TAB_FIELDS: Record<string, string[]> = {
  Basic: [
    'bio', 'expectations', 'firstName', 'lastName', 'dob', 'height',
    'maritalStatus', 'createdBy', 'mobile', 'email', 'contactTime',
    'zodiacSign', 'horoscopeDob', 'horoscopeTime', 'horoscopePlace',
  ],
  Professional: [
    'highestDegree', 'college', 'profession', 'industry', 'company', 'income',
  ],
  Family: [
    'familyType', 'familyLocation', 'fatherStatus', 'motherStatus',
    'siblings', 'brothers', 'sisters', 'familyAbout',
    'country', 'state', 'city', 'area', 'relocate',
    'religion', 'caste', 'subCaste', 'motherTongue', 'familyValues',
  ],
  Lifestyle: [
    'diet', 'smoking', 'drinking', 'activity', 'hobby', 'hobbies',
  ],
  Preferences: [
    'preferredAge', 'preferredLocation', 'dealBreakers', 'lookingFor',
  ],
};

// Validation helpers
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidDOB = (dob: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return false;
  const date = new Date(dob);
  if (isNaN(date.getTime())) return false;
  const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return age >= 18;
};
const isValidHeight = (h: string) => {
  const num = parseFloat(h);
  return !isNaN(num) && num >= 3.0 && num <= 8.0;
};

// Replicate backend weighted completion logic to ensure frontend and backend metrics match exactly
const calculateCompletion = (p: any) => {
  if (!p) return 0;
  
  let score = 0;
  
  // 1. Basic & Identity (25%)
  if (p.firstName) score += 5;
  if (p.lastName) score += 5;
  if (p.dob) score += 5;
  if (p.gender) score += 5;
  if (p.maritalStatus) score += 5;
  
  // 2. Photos (20%)
  if (p.photos && p.photos.length > 0) {
    score += 15;
    if (p.photos.length >= 3) score += 5;
  }
  
  // 3. Education & Career (15%)
  if (p.highestDegree) score += 3;
  if (p.college) score += 2;
  if (p.profession) score += 4;
  if (p.industry) score += 2;
  if (p.income) score += 4;
  
  // 4. Personal Narrative (15%)
  const bioLen = p.bio ? p.bio.toString().length : 0;
  if (bioLen > 50) score += 8;
  else if (bioLen > 10) score += 4;
  
  const expLen = p.expectations ? p.expectations.toString().length : 0;
  if (expLen > 50) score += 7;
  else if (expLen > 10) score += 3;
  
  // 5. Family & Cultural (10%)
  if (p.familyType) score += 2;
  if (p.fatherStatus) score += 2;
  if (p.motherStatus) score += 2;
  if (p.religion) score += 2;
  if (p.motherTongue) score += 2;
  
  // 6. Lifestyle & Habits (10%)
  if (p.diet) score += 2.5;
  if (p.smoking) score += 2.5;
  if (p.drinking) score += 2.5;
  if (p.activity) score += 2.5;
  
  // 7. Location & Contact (5%)
  if (p.city) score += 2;
  if (p.state) score += 2;
  if (p.mobile || p.email) score += 1;
  
  return Math.min(Math.round(score), 100);
};

export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isDark = false;

  // Theme Tokens
  const themeBg = isDark ? '#121212' : '#F5F5F5';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : palette.purple.deep;
  const mutedText = isDark ? '#9E9E9E' : '#888888';
  const accentColor = palette.gold.main;

  const [activeTab, setActiveTab] = useState('Basic');
  const tabs = ['Basic', 'Professional', 'Family', 'Lifestyle', 'Preferences'];
  const inputBg = isDark ? '#252525' : '#FAFAFA';
  const inputBorder = isDark ? '#333333' : '#E8E8E8';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [currentSelection, setCurrentSelection] = useState<{
    label: string;
    field: string;
    options: string[];
    value: string;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Mobile Change Request State
  const [mobileModalVisible, setMobileModalVisible] = useState(false);
  const [newMobile, setNewMobile] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [requestingChange, setRequestingChange] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleRequestChange = async () => {
    if (!newMobile) {
      Alert.alert("Error", "Please enter a new mobile number.");
      return;
    }
    if (newMobile.length < 10) {
      Alert.alert("Error", "Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!changeReason) {
      Alert.alert("Error", "Please provide a reason for the change request.");
      return;
    }

    setRequestingChange(true);
    try {
      const res = await api.post('/profile/request-mobile-change', {
        newMobile,
        reason: changeReason
      });

      if (res.data && res.data.success) {
        setIsSubmitted(true);
      } else {
        Alert.alert("Error", res.data?.message || "Could not submit change request. Please try again.");
      }
    } catch (err: any) {
      console.warn("Mobile change request failed:", err);
      Alert.alert("Error", "A network error occurred. Please try again later.");
    } finally {
      setRequestingChange(false);
    }
  };

  // ── Floating save-button animation ────────────────────────────────
  const saveButtonAnim = useRef(new Animated.Value(0)).current;

  // ── Dirty-state tracking ──────────────────────────────────────────
  const isDirty = useMemo(() => {
    if (!profile) return false;
    const allFields = Object.values(TAB_FIELDS).flat();
    return allFields.some(field => {
      const original = (profile[field] ?? '').toString();
      const current = (formData[field] ?? '').toString();
      return original !== current;
    });
  }, [profile, formData]);

  const isDirtyRef = useRef(false);
  isDirtyRef.current = isDirty;

  // ── Profile completion ────────────────────────────────────────────
  const completionInfo = useMemo(() => {
    const pct = calculateCompletion(formData);
    const allFields = Object.values(TAB_FIELDS).flat();
    const filled = allFields.filter(f => {
      const val = formData[f];
      return val !== undefined && val !== null && val.toString().trim() !== '';
    });
    return { pct, remaining: allFields.length - filled.length };
  }, [formData]);

  // ── Tab completion dots ───────────────────────────────────────────
  const tabCompletion = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const tab of tabs) {
      const fields = TAB_FIELDS[tab] || [];
      result[tab] = fields.length > 0 && fields.every(f => {
        const val = formData[f];
        return val !== undefined && val !== null && val.toString().trim() !== '';
      });
    }
    return result;
  }, [formData]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [])
  );

  // ── Animate floating save button ─────────────────────────────────
  useEffect(() => {
    Animated.spring(saveButtonAnim, {
      toValue: isDirty ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
  }, [isDirty]);

  // ── Unsaved-changes guard ─────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });
    return unsubscribe;
  }, [navigation]);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      if (res.data.success) {
        setProfile(res.data.data);
        setFormData(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Profile Error:", error);
      showToast("Could not load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isDirty) return;

    // Validate critical fields before saving
    const errors: Record<string, string> = {};
    if (formData.email && !isValidEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (formData.dob && !isValidDOB(formData.dob)) {
      errors.dob = 'Enter a valid date (YYYY-MM-DD), age must be 18+';
    }
    if (formData.height && !isValidHeight(formData.height.toString())) {
      errors.height = 'Height must be between 3.0 and 8.0';
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(prev => ({ ...prev, ...errors }));
      showToast('Please fix the highlighted fields before saving.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile(formData);
      if (res.data.success) {
        setProfile(res.data.data);
        setFormData(res.data.data);
        setValidationErrors({});
        showToast("Profile updated successfully.");
      }
    } catch (error: any) {
      console.error("Update Profile Error:", error);
      showToast(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const openSelector = (label: string, field: string, options: string[]) => {
    setCurrentSelection({ label, field, options, value: formData[field] || "" });
    setModalVisible(true);
  };

  const selectOption = (option: string) => {
    if (currentSelection) {
      updateField(currentSelection.field, option);
    }
    setModalVisible(false);
  };

  // ── Field validation — fires on blur AND onEndEditing ─────────────
  const validateField = (field: string, value: string) => {
    let error = '';
    if (field === 'email' && value.trim().length > 0 && !isValidEmail(value)) {
      error = 'Please enter a valid email address';
    } else if (field === 'dob' && value.trim().length > 0 && !isValidDOB(value)) {
      error = 'Enter a valid date (YYYY-MM-DD), age must be 18+';
    } else if (field === 'height' && value.trim().length > 0 && !isValidHeight(value)) {
      error = 'Height must be between 3.0 and 8.0';
    }
    setValidationErrors(prev => {
      if (error) return { ...prev, [field]: error };
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  // ══════════════════════════════════════════════════════════════════
  // Render Helpers
  // ══════════════════════════════════════════════════════════════════

  const renderSectionHeader = (title: string, icon: any) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderRow}>
        {icon}
        <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
      </View>
      <View style={[styles.sectionAccent, { backgroundColor: accentColor }]} />
    </View>
  );

  const renderInput = (label: string, field: string, placeholder: string = "", editable: boolean = true) => {
    const hasError = !!validationErrors[field];
    const isFocused = focusedField === field;
    return (
      <View style={styles.fieldGroup}>
        <Text style={[styles.fieldLabel, { color: hasError ? '#E53935' : mutedText }]}>{label}</Text>
        <TextInput
          style={[
            styles.fieldInput,
            {
              backgroundColor: inputBg,
              color: textColor,
              borderColor: hasError ? '#E53935' : isFocused ? accentColor : inputBorder,
              borderWidth: hasError || isFocused ? 1.5 : 1,
            },
            !editable && { opacity: 0.6 },
          ]}
          value={formData[field]?.toString() || ""}
          onChangeText={(val) => {
            updateField(field, val);
            // Clear error while typing
            if (validationErrors[field]) {
              setValidationErrors(prev => {
                const { [field]: _, ...rest } = prev;
                return rest;
              });
            }
          }}
          onFocus={() => setFocusedField(field)}
          onBlur={() => {
            setFocusedField(null);
            validateField(field, formData[field]?.toString() || "");
          }}
          onEndEditing={() => {
            validateField(field, formData[field]?.toString() || "");
          }}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#555' : '#C0C0C0'}
          editable={editable}
        />
        {hasError && (
          <View style={styles.errorRow}>
            <X size={12} color="#E53935" />
            <Text style={styles.validationError}>{validationErrors[field]}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderSelect = (label: string, field: string, options: string[]) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: mutedText }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.selectBtn, { backgroundColor: inputBg, borderColor: inputBorder }]}
        onPress={() => openSelector(label, field, options)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.selectValue,
          { color: formData[field] ? textColor : (isDark ? '#555' : '#C0C0C0') },
        ]}>
          {formData[field] || `Select ${label}`}
        </Text>
        <ChevronDown size={16} color={mutedText} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: themeBg }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBg }]} edges={['top', 'left', 'right']}>
      {/* Top Navigation Bar */}
      <View style={[styles.topBar, { backgroundColor: cardBg }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBarBtn}>
          <ArrowLeft size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: textColor }]}>Edit Profile</Text>
        <View style={styles.topBarBtn} />
      </View>

      {/* ── Keyboard-aware wrapper ─────────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollBody, { paddingBottom: insets.bottom + 90 }]}
          keyboardShouldPersistTaps="handled"
        >

          {/* Hero Photo Section */}
          <View style={styles.heroWrap}>
            <Image
              source={{ 
                uri: resolvePhotoUrl(
                  profile?.photos?.find((p: any) => p.isMain === true || p.isMain === 1 || p.isMain === "1")?.url || 
                  profile?.photos?.[0]?.url || 
                  `https://api.dicebear.com/7.x/avataaars/png?seed=${profile?.email || 'edit'}`
                )
              }}
              style={styles.heroImg}
            />
            <View style={styles.heroOverlay}>
              <TouchableOpacity
                style={styles.cameraPill}
                onPress={() => navigation.navigate('MyPhotos')}
                activeOpacity={0.8}
              >
                <Camera size={16} color="#FFF" />
                <Text style={styles.cameraPillText}>Change Photo</Text>
              </TouchableOpacity>

              <View style={styles.heroDetails}>
                <Text style={styles.heroName}>{profile?.firstName} {profile?.lastName}</Text>
                <Text style={styles.heroMeta}>
                  {profile?.height ? `${profile.height}'` : ''}{profile?.profession ? ` · ${profile.profession}` : ''}
                </Text>
                <Text style={styles.heroMeta}>
                  {[profile?.city, profile?.state].filter(Boolean).join(', ')}
                </Text>
              </View>
            </View>
          </View>

          {/* ── Profile Completion Meter ──────────────────────────── */}
          <View style={[styles.completionCard, { backgroundColor: cardBg }]}>
            <View style={styles.completionRow}>
              <View>
                <Text style={[styles.completionPct, { color: textColor }]}>{completionInfo.pct}%</Text>
                <Text style={[styles.completionLabel, { color: mutedText }]}>Profile Complete</Text>
              </View>
              <View style={styles.completionRight}>
                <Text style={[styles.completionRemaining, { color: accentColor }]}>
                  {completionInfo.remaining}
                </Text>
                <Text style={[styles.completionRemainingLabel, { color: mutedText }]}>fields left</Text>
              </View>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: isDark ? '#333' : '#E8E8E8' }]}>
              <View style={[styles.progressFill, { width: `${completionInfo.pct}%`, backgroundColor: accentColor }]} />
            </View>
          </View>

          {/* ── Pill Tab Bar ──────────────────────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabScrollWrap}
            contentContainerStyle={styles.tabScrollContent}
          >
            {tabs.map(tab => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tabPill,
                    { backgroundColor: isActive ? palette.purple.deep : (isDark ? '#252525' : '#F0F0F0') },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.tabPillText,
                    { color: isActive ? '#FFFFFF' : mutedText },
                  ]}>
                    {tab}
                  </Text>
                  {tabCompletion[tab] && (
                    <View style={[styles.tabDot, { backgroundColor: isActive ? '#FFFFFF' : accentColor }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ── Tab Content ───────────────────────────────────────── */}
          <View style={styles.tabContent}>

            {/* ═══════════ BASIC TAB ═══════════ */}
            {activeTab === 'Basic' && (
              <>
                {/* About & Bio */}
                <View style={[styles.card, cardShadow]}>
                  <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
                  <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
                    {renderSectionHeader("About & Bio", <Edit2 size={16} color={accentColor} />)}
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.fieldLabel, { color: mutedText }]}>About Me</Text>
                      <TextInput
                        style={[styles.fieldInput, styles.textArea, {
                          backgroundColor: inputBg,
                          color: textColor,
                          borderColor: focusedField === 'bio' ? accentColor : inputBorder,
                          borderWidth: focusedField === 'bio' ? 1.5 : 1,
                        }]}
                        value={formData.bio || ""}
                        onChangeText={(val) => updateField("bio", val)}
                        onFocus={() => setFocusedField('bio')}
                        onBlur={() => setFocusedField(null)}
                        multiline
                        numberOfLines={4}
                        placeholder="Tell others about yourself..."
                        placeholderTextColor={isDark ? '#555' : '#C0C0C0'}
                      />
                    </View>
                    {renderInput("Expectations", "expectations", "What are you looking for?")}
                  </View>
                </View>

                {/* Basic Info */}
                <View style={[styles.card, cardShadow]}>
                  <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
                  <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
                    {renderSectionHeader("Basic Info", <User size={16} color={accentColor} />)}
                    <View style={styles.fieldRow}>
                      <View style={{ flex: 1 }}>{renderInput("First Name", "firstName")}</View>
                      <View style={{ flex: 1 }}>{renderInput("Last Name", "lastName")}</View>
                    </View>
                    <View style={styles.fieldRow}>
                      <View style={{ flex: 1 }}>{renderInput("Date of Birth", "dob", "YYYY-MM-DD")}</View>
                      <View style={{ flex: 1 }}>{renderInput("Height (e.g. 5.7)", "height")}</View>
                    </View>
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.fieldLabel, { color: mutedText }]}>Gender</Text>
                      <View style={[styles.lockedField, { backgroundColor: isDark ? '#252525' : '#F0F0F0' }]}>
                        <Lock size={14} color={mutedText} />
                        <Text style={[styles.lockedValue, { color: mutedText }]}>{profile?.gender || "Not Set"}</Text>
                      </View>
                    </View>
                    <View style={styles.fieldRow}>
                      <View style={{ flex: 1 }}>{renderSelect("Marital Status", "maritalStatus", OPTIONS.maritalStatus)}</View>
                      <View style={{ flex: 1 }}>{renderSelect("Created By", "createdBy", OPTIONS.createdBy)}</View>
                    </View>
                  </View>
                </View>

                {/* Horoscope & Astro */}
                <View style={[styles.card, cardShadow]}>
                  <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
                  <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
                    {renderSectionHeader("Horoscope & Astro", <Star size={16} color={accentColor} />)}
                    {renderSelect("Zodiac Sign", "zodiacSign", OPTIONS.zodiacSign)}
                    {renderInput("Horoscope DOB", "horoscopeDob", "YYYY-MM-DD")}
                    <View style={styles.fieldRow}>
                      <View style={{ flex: 1 }}>{renderInput("Horoscope Time", "horoscopeTime", "08:30 AM")}</View>
                      <View style={{ flex: 1 }}>{renderInput("Horoscope Place", "horoscopePlace", "Birth Place")}</View>
                    </View>
                  </View>
                </View>

                {/* Contact Details */}
                <View style={[styles.card, cardShadow]}>
                  <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
                  <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
                    {renderSectionHeader("Contact Details", <Phone size={16} color={accentColor} />)}
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.fieldLabel, { color: mutedText }]}>Mobile Number</Text>
                      <View style={styles.lockedRow}>
                        <TextInput
                          style={[styles.fieldInput, { flex: 1, backgroundColor: isDark ? '#252525' : '#F0F0F0', color: mutedText, borderColor: inputBorder }]}
                          value={profile?.mobile || ""}
                          editable={false}
                        />
                        <TouchableOpacity style={styles.changeBtn} onPress={() => setMobileModalVisible(true)}>
                          <Text style={styles.changeBtnText}>Request Change</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {renderInput("Email Address", "email", "example@gmail.com")}
                    {renderInput("Convenient Time to Call", "contactTime", "10 AM to 7 PM")}
                  </View>
                </View>
              </>
            )}

            {/* ═══════════ PROFESSIONAL TAB ═══════════ */}
            {activeTab === 'Professional' && (
              <>
                <View style={[styles.card, cardShadow]}>
                  <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
                  <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
                    {renderSectionHeader("Career & Education", <Briefcase size={16} color={accentColor} />)}
                    {renderInput("Highest Degree", "highestDegree", "BE")}
                    {renderInput("College / University", "college", "University Name")}
                    <View style={styles.fieldRow}>
                      <View style={{ flex: 1 }}>{renderInput("Profession", "profession", "Software Engineer")}</View>
                      <View style={{ flex: 1 }}>{renderSelect("Industry", "industry", OPTIONS.industry)}</View>
                    </View>
                    {renderInput("Company Name", "company", "Company Pvt Ltd")}
                    {renderSelect("Annual Income", "income", OPTIONS.income)}
                  </View>
                </View>
              </>
            )}

            {/* ═══════════ FAMILY TAB ═══════════ */}
            {activeTab === 'Family' && (
              <>
                {/* Family Details */}
                <View style={[styles.card, cardShadow]}>
                  <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
                  <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
                    {renderSectionHeader("Family Details", <Users size={16} color={accentColor} />)}
                    {renderSelect("Family Type", "familyType", OPTIONS.familyType)}
                    {renderInput("Family Location", "familyLocation", "Home Town")}
                    <View style={styles.fieldRow}>
                      <View style={{ flex: 1 }}>{renderInput("Father's Status", "fatherStatus", "Retired")}</View>
                      <View style={{ flex: 1 }}>{renderInput("Mother's Status", "motherStatus", "Homemaker")}</View>
                    </View>
                    {renderInput("Siblings (Brothers/Sisters)", "siblings", "1 Brother, 0 Sister")}
                    <View style={styles.fieldRow}>
                      <View style={{ flex: 1 }}>{renderInput("Brothers", "brothers", "1")}</View>
                      <View style={{ flex: 1 }}>{renderInput("Sisters", "sisters", "0")}</View>
                    </View>
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.fieldLabel, { color: mutedText }]}>About Family</Text>
                      <TextInput
                        style={[styles.fieldInput, styles.textArea, {
                          backgroundColor: inputBg,
                          color: textColor,
                          borderColor: focusedField === 'familyAbout' ? accentColor : inputBorder,
                          borderWidth: focusedField === 'familyAbout' ? 1.5 : 1,
                        }]}
                        value={formData.familyAbout || ""}
                        onChangeText={(val) => updateField("familyAbout", val)}
                        onFocus={() => setFocusedField('familyAbout')}
                        onBlur={() => setFocusedField(null)}
                        multiline
                        numberOfLines={3}
                        placeholder="Describe your family background..."
                        placeholderTextColor={isDark ? '#555' : '#C0C0C0'}
                      />
                    </View>
                  </View>
                </View>

                {/* Location & Religion */}
                <View style={[styles.card, cardShadow]}>
                  <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
                  <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
                    {renderSectionHeader("Location & Religion", <Globe size={16} color={accentColor} />)}
                    <View style={styles.fieldRow}>
                      <View style={{ flex: 1 }}>{renderInput("Country", "country", "India")}</View>
                      <View style={{ flex: 1 }}>{renderInput("State", "state", "Maharashtra")}</View>
                    </View>
                    <View style={styles.fieldRow}>
                      <View style={{ flex: 1 }}>{renderInput("City", "city", "Jalgaon")}</View>
                      <View style={{ flex: 1 }}>{renderInput("Area", "area", "Pachora")}</View>
                    </View>
                    {renderSelect("Willing to Relocate?", "relocate", OPTIONS.relocate)}
                    <View style={[styles.sectionDivider, { backgroundColor: inputBorder }]} />
                    {renderSelect("Religion", "religion", OPTIONS.religion)}
                    <View style={styles.fieldRow}>
                      <View style={{ flex: 1 }}>{renderInput("Caste", "caste", "OBC")}</View>
                      <View style={{ flex: 1 }}>{renderInput("Sub Caste", "subCaste", "Badgujar")}</View>
                    </View>
                    {renderInput("Mother Tongue", "motherTongue", "Marathi")}
                    {renderSelect("Family Values", "familyValues", OPTIONS.familyValues)}
                  </View>
                </View>
              </>
            )}

            {/* ═══════════ LIFESTYLE TAB ═══════════ */}
            {activeTab === 'Lifestyle' && (
              <>
                <View style={[styles.card, cardShadow]}>
                  <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
                  <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
                    {renderSectionHeader("Lifestyle", <Heart size={16} color={accentColor} />)}
                    <View style={styles.fieldRow}>
                      <View style={{ flex: 1 }}>{renderSelect("Dietary Habits", "diet", OPTIONS.diet)}</View>
                      <View style={{ flex: 1 }}>{renderSelect("Smoking", "smoking", OPTIONS.smoking)}</View>
                    </View>
                    <View style={styles.fieldRow}>
                      <View style={{ flex: 1 }}>{renderSelect("Drinking", "drinking", OPTIONS.drinking)}</View>
                      <View style={{ flex: 1 }}>{renderSelect("Activity Level", "activity", OPTIONS.activity)}</View>
                    </View>
                  </View>
                </View>

                {/* Hobbies & Interests */}
                <View style={[styles.card, cardShadow]}>
                  <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
                  <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
                    {renderSectionHeader("Hobbies & Interests", <Heart size={16} color={accentColor} />)}
                    {renderInput("Hobby", "hobby", "Reading, Painting")}
                    <View style={styles.fieldGroup}>
                      <Text style={[styles.fieldLabel, { color: mutedText }]}>Hobbies List</Text>
                      <TextInput
                        style={[styles.fieldInput, styles.textArea, {
                          backgroundColor: inputBg,
                          color: textColor,
                          borderColor: focusedField === 'hobbies' ? accentColor : inputBorder,
                          borderWidth: focusedField === 'hobbies' ? 1.5 : 1,
                        }]}
                        value={formData.hobbies || ""}
                        onChangeText={(val) => updateField("hobbies", val)}
                        onFocus={() => setFocusedField('hobbies')}
                        onBlur={() => setFocusedField(null)}
                        multiline
                        numberOfLines={3}
                        placeholder="Cooking, Traveling, Music..."
                        placeholderTextColor={isDark ? '#555' : '#C0C0C0'}
                      />
                    </View>
                  </View>
                </View>
              </>
            )}

            {/* ═══════════ PREFERENCES TAB ═══════════ */}
            {activeTab === 'Preferences' && (
              <>
                <View style={[styles.card, cardShadow]}>
                  <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
                  <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
                    {renderSectionHeader("Partner Preferences", <Star size={16} color={accentColor} />)}
                    <Text style={{ color: mutedText, fontSize: 13, lineHeight: 20, marginBottom: 20 }}>
                      Set detailed partner criteria like age range, religion, education, income, location and more from the dedicated preferences screen.
                    </Text>
                    <TouchableOpacity
                      style={{
                        backgroundColor: palette.purple.deep,
                        paddingVertical: 14,
                        borderRadius: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                      }}
                      onPress={() => navigation.navigate('PartnerPreference')}
                      activeOpacity={0.8}
                    >
                      <Heart size={18} color={accentColor} />
                      <Text style={{ color: '#FFF', fontSize: 15, ...fonts.semibold}}>
                        Open Partner Preferences
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Quick Edit: Profile-level preference fields saved with profile */}
                <View style={[styles.card, cardShadow]}>
                  <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
                  <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
                    {renderSectionHeader("Quick Expectations", <Edit2 size={16} color={accentColor} />)}
                    <View style={styles.fieldRow}>
                      <View style={{ flex: 1 }}>{renderInput("Preferred Age", "preferredAge", "24 - 29 Years")}</View>
                      <View style={{ flex: 1 }}>{renderInput("Preferred Location", "preferredLocation", "Mumbai, Pune")}</View>
                    </View>
                    {renderInput("Looking For", "lookingFor", "Life partner who is caring...")}
                    {renderInput("Deal Breakers", "dealBreakers", "Smoking, Drinking")}
                  </View>
                </View>
              </>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Floating Save Button ───────────────────────────────── */}
      <Animated.View
        style={[
          styles.floatingSaveWrap,
          {
            paddingBottom: insets.bottom + 12,
            transform: [{
              translateY: saveButtonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [120, 0],
              }),
            }],
            opacity: saveButtonAnim,
          },
        ]}
        pointerEvents={isDirty ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={[styles.floatingSaveBtn, { backgroundColor: accentColor }]}
          onPress={handleSave}
          disabled={saving || !isDirty}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Save size={18} color="#FFF" />
              <Text style={styles.floatingSaveText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalSheet, { backgroundColor: cardBg, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <View style={[styles.modalHead, { borderBottomColor: inputBorder }]}>
              <Text style={[styles.modalHeadTitle, { color: textColor }]}>{currentSelection?.label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={mutedText} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={currentSelection?.options}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = currentSelection?.value === item;
                return (
                  <TouchableOpacity
                    style={[styles.optionRow, { borderBottomColor: isDark ? '#2A2A2A' : '#F5F5F5' }]}
                    onPress={() => selectOption(item)}
                    activeOpacity={0.6}
                  >
                    <Text style={[
                      styles.optionLabel,
                      { color: isSelected ? accentColor : textColor },
                      isSelected && { ...fonts.semibold},
                    ]}>
                      {item}
                    </Text>
                    {isSelected && (
                      <View style={styles.optionCheck}>
                        <Check size={16} color={accentColor} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Mobile Change Request Modal */}
      <Modal
        visible={mobileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!requestingChange) setMobileModalVisible(false);
        }}
      >
        <TouchableOpacity
          style={[styles.modalBackdrop, { backgroundColor: 'transparent' }]}
          activeOpacity={1}
          onPress={() => {
            if (!requestingChange) setMobileModalVisible(false);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%', justifyContent: 'flex-end' }}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.requestModalCard, { backgroundColor: cardBg, paddingBottom: 20 }]}
            >
              <View style={styles.modalHandle} />
              {isSubmitted ? (
                <View style={styles.successContainer}>
                  <View style={[styles.successIconCircle, { backgroundColor: 'rgba(76,175,80,0.1)' }]}>
                    <Check size={28} color="#4CAF50" />
                  </View>
                  <Text style={[styles.successTitle, { color: textColor }]}>Request Submitted</Text>
                  <Text style={[styles.successSubtitle, { color: mutedText }]}>
                    Your mobile number change request has been sent for admin approval. You will receive updates shortly.
                  </Text>
                  
                  <TouchableOpacity
                    style={[styles.successBtn, { backgroundColor: palette.purple.deep }]}
                    onPress={() => {
                      setMobileModalVisible(false);
                      setIsSubmitted(false);
                      setNewMobile('');
                      setChangeReason('');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.successBtnText}>Got It</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.requestModalHeader}>
                    <Phone size={20} color={accentColor} />
                    <Text style={[styles.requestModalTitle, { color: textColor }]}>Request Mobile Change</Text>
                  </View>
                  
                  <Text style={[styles.requestModalSubtitle, { color: mutedText }]}>
                    Submit your new mobile number and a reason. An admin will review and approve your request.
                  </Text>

                  <View style={styles.requestFieldGroup}>
                    <Text style={[styles.requestFieldLabel, { color: mutedText }]}>NEW MOBILE NUMBER</Text>
                    <TextInput
                      style={[styles.requestInput, {
                        backgroundColor: inputBg,
                        color: textColor,
                        borderColor: inputBorder
                      }]}
                      placeholder="e.g. 9876543210"
                      placeholderTextColor={isDark ? '#555' : '#A39BB0'}
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={newMobile}
                      onChangeText={setNewMobile}
                      editable={!requestingChange}
                    />
                  </View>

                  <View style={styles.requestFieldGroup}>
                    <Text style={[styles.requestFieldLabel, { color: mutedText }]}>REASON FOR CHANGE</Text>
                    <TextInput
                      style={[styles.requestInput, styles.requestTextArea, {
                        backgroundColor: inputBg,
                        color: textColor,
                        borderColor: inputBorder
                      }]}
                      placeholder="Provide a clear reason for requesting this change..."
                      placeholderTextColor={isDark ? '#555' : '#A39BB0'}
                      multiline
                      numberOfLines={4}
                      value={changeReason}
                      onChangeText={setChangeReason}
                      editable={!requestingChange}
                    />
                  </View>

                  <View style={styles.requestButtonsRow}>
                    <TouchableOpacity
                      style={[styles.requestCancelBtn, { borderColor: inputBorder }]}
                      onPress={() => {
                        setMobileModalVisible(false);
                        setNewMobile('');
                        setChangeReason('');
                      }}
                      disabled={requestingChange}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.requestCancelBtnText, { color: mutedText }]}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.requestSubmitBtn, { backgroundColor: palette.purple.deep }]}
                      onPress={handleRequestChange}
                      disabled={requestingChange}
                      activeOpacity={0.8}
                    >
                      {requestingChange ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.requestSubmitBtnText}>Submit</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
}) as any;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topBarBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  topBarTitle: {
    fontSize: 17,
    ...fonts.semibold,
    letterSpacing: 0.2,
  },
  scrollBody: {
    paddingBottom: 20,
  },

  // ── Completion Card ───────────────────────────────────────
  completionCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 16,
  },
  completionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  completionPct: {
    fontSize: 28,
    ...fonts.bold,
    letterSpacing: -0.5,
  },
  completionLabel: {
    fontSize: 11,
    ...fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  completionRight: {
    alignItems: 'flex-end',
  },
  completionRemaining: {
    fontSize: 20,
    ...fonts.bold,
  },
  completionRemainingLabel: {
    fontSize: 10,
    ...fonts.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // ── Pill Tabs ─────────────────────────────────────────────
  tabScrollWrap: {
    marginTop: 16,
    marginBottom: 6,
    maxHeight: 46,
  },
  tabScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  tabPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tabPillText: {
    fontSize: 13,
    ...fonts.semibold,
    letterSpacing: 0.2,
  },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tabContent: {
    paddingBottom: 10,
  },

  // ── Hero ──────────────────────────────────────────────────
  heroWrap: {
    height: 260,
    position: 'relative',
    backgroundColor: '#1A1A1A',
  },
  heroImg: {
    width: '100%',
    height: '100%',
    opacity: 0.75,
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  cameraPill: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  cameraPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    ...fonts.semibold,
  },
  heroDetails: {
    backgroundColor: 'transparent',
  },
  heroName: {
    fontSize: 24,
    ...fonts.bold,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  heroMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
    ...fonts.medium,
  },

  // ── Cards & Section Headers ───────────────────────────────
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardAccent: {
    width: 4,
  },
  cardInner: {
    flex: 1,
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    ...fonts.bold,
    letterSpacing: 0.3,
  },
  sectionAccent: {
    width: 28,
    height: 3,
    borderRadius: 2,
    marginTop: 8,
  },

  // ── Fields ────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  fieldLabel: {
    fontSize: 11,
    ...fonts.semibold,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    height: 48,
  },
  selectValue: {
    fontSize: 14,
    flex: 1,
  },
  lockedField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  lockedValue: {
    fontSize: 14,
    ...fonts.medium,
  },
  lockedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'transparent',
  },
  changeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderRadius: 8,
  },
  changeBtnText: {
    fontSize: 11,
    ...fonts.semibold,
    color: palette.gold.main,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionDivider: {
    height: 1,
    marginVertical: 12,
  },

  // ── Validation ────────────────────────────────────────────
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  validationError: {
    fontSize: 11,
    color: '#E53935',
    ...fonts.semibold,
  },

  // ── Floating Save Button ──────────────────────────────────
  floatingSaveWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 0,
  },
  floatingSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    gap: 10,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
      android: { elevation: 8 },
    }),
  },
  floatingSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...fonts.bold,
    letterSpacing: 0.3,
  },

  // ── Modal ─────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.6,
    paddingTop: 8,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  modalHeadTitle: {
    fontSize: 17,
    ...fonts.semibold,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  optionLabel: {
    fontSize: 15,
    flex: 1,
  },
  optionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(212,175,55,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestModalCard: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: 'rgba(237, 230, 245, 0.6)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.08, shadowRadius: 16 },
      android: { elevation: 12 },
    }),
  },
  requestModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  requestModalTitle: {
    fontSize: 18,
    ...fonts.bold,
  },
  requestModalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    ...fonts.medium,
    marginBottom: 16,
  },
  requestFieldGroup: {
    marginBottom: 14,
  },
  requestFieldLabel: {
    fontSize: 11,
    ...fonts.semibold,
    letterSpacing: 1,
    marginBottom: 6,
  },
  requestInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
    ...fonts.medium,
  },
  requestTextArea: {
    height: 90,
    textAlignVertical: 'top',
    paddingVertical: 10,
  },
  requestButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  requestCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  requestCancelBtnText: {
    fontSize: 14,
    ...fonts.semibold,
  },
  requestSubmitBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    ...fonts.semibold,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  successTitle: {
    fontSize: 19,
    ...fonts.bold,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 13,
    lineHeight: 19,
    ...fonts.medium,
    textAlign: 'center',
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  successBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    ...fonts.semibold,
  },
});
