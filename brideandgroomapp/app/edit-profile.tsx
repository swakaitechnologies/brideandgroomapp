import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import {
  ArrowLeft, Camera, Edit2, Save,
  User, Mail, Phone, MapPin,
  Briefcase, GraduationCap, Users,
  Heart, Globe, Star, ChevronRight, ChevronDown,
  Check, X, Lock,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { palette } from '@/src/theme/colors';
import { getProfile, updateProfile } from '@/src/services/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '@/src/store';

const { width, height: screenHeight } = Dimensions.get('window');

// ─── Option Constants ────────────────────────────────────
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

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { mode } = useSelector((state: RootState) => state.theme);
  const isDark = mode === 'dark';

  // ─── Theme Tokens ──────────────────────────────────────
  const themeBg = isDark ? '#121212' : '#F5F5F5';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : palette.purple.deep;
  const mutedText = isDark ? '#9E9E9E' : '#888888';
  const inputBg = isDark ? '#252525' : '#FAFAFA';
  const inputBorder = isDark ? '#333333' : '#E8E8E8';
  const accentColor = palette.gold.main;

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

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      if (res.data.success) {
        setProfile(res.data.data);
        setFormData(res.data.data);
      }
    } catch (error) {
      console.error("Fetch Profile Error:", error);
      Alert.alert("Error", "Could not load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateProfile(formData);
      if (res.data.success) {
        Alert.alert("Success", "Profile updated successfully.");
      }
    } catch (error: any) {
      console.error("Update Profile Error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to update profile.");
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

  // ─── Render Helpers ────────────────────────────────────
  const renderSectionHeader = (title: string, icon: any) => (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIconWrap, { backgroundColor: isDark ? '#252525' : '#F5F5F5' }]}>
        {icon}
      </View>
      <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
    </View>
  );

  const renderInput = (label: string, field: string, placeholder: string = "", editable: boolean = true) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: mutedText }]}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          { backgroundColor: inputBg, color: textColor, borderColor: inputBorder },
          !editable && { opacity: 0.6 },
        ]}
        value={formData[field]?.toString() || ""}
        onChangeText={(val) => updateField(field, val)}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#555' : '#C0C0C0'}
        editable={editable}
      />
    </View>
  );

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

  // ─── Loading ───────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: themeBg }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  // ─── Main Render ───────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBg }]}>
      {/* ─── Top Navigation Bar ─── */}
      <View style={[styles.topBar, { backgroundColor: cardBg }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topBarBtn}>
          <ArrowLeft size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: textColor }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.topBarBtn}>
          {saving ? (
            <ActivityIndicator size="small" color={accentColor} />
          ) : (
            <Save size={22} color={accentColor} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>

        {/* ─── Hero Photo Section ─── */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: profile?.photos?.[0]?.url || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + profile?.email }}
            style={styles.heroImg}
          />
          <View style={styles.heroOverlay}>
            <TouchableOpacity
              style={styles.cameraPill}
              onPress={() => router.push('/my-photos')}
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

        {/* ─── Section 1: About & Bio ─── */}
        <View style={[styles.card, cardShadow]}>
          <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
            {renderSectionHeader("About & Bio", <Edit2 size={16} color={accentColor} />)}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: mutedText }]}>About Me</Text>
              <TextInput
                style={[styles.fieldInput, styles.textArea, { backgroundColor: inputBg, color: textColor, borderColor: inputBorder }]}
                value={formData.bio || ""}
                onChangeText={(val) => updateField("bio", val)}
                multiline
                numberOfLines={4}
                placeholder="Tell others about yourself..."
                placeholderTextColor={isDark ? '#555' : '#C0C0C0'}
              />
            </View>
            {renderInput("Expectations", "expectations", "What are you looking for?")}
          </View>
        </View>

        {/* ─── Section 2: Basic Info ─── */}
        <View style={[styles.card, cardShadow]}>
          <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
            {renderSectionHeader("Basic Info", <User size={16} color={accentColor} />)}
            {renderInput("First Name", "firstName")}
            {renderInput("Last Name", "lastName")}
            {renderInput("Date of Birth", "dob", "YYYY-MM-DD")}
            {renderInput("Height (e.g. 5.7)", "height")}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: mutedText }]}>Gender</Text>
              <View style={[styles.lockedField, { backgroundColor: isDark ? '#252525' : '#F0F0F0' }]}>
                <Lock size={14} color={mutedText} />
                <Text style={[styles.lockedValue, { color: mutedText }]}>{profile?.gender || "Male"}</Text>
              </View>
            </View>
            {renderSelect("Marital Status", "maritalStatus", OPTIONS.maritalStatus)}
            {renderSelect("Profile Created By", "createdBy", OPTIONS.createdBy)}
          </View>
        </View>

        {/* ─── Section 3: Contact Details ─── */}
        <View style={[styles.card, cardShadow]}>
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
                <TouchableOpacity style={styles.changeBtn}>
                  <Text style={styles.changeBtnText}>Request Change</Text>
                </TouchableOpacity>
              </View>
            </View>
            {renderInput("Email Address", "email", "example@gmail.com")}
            {renderInput("Convenient Time to Call", "contactTime", "10 AM to 7 PM")}
          </View>
        </View>

        {/* ─── Section 4: Location & Religion ─── */}
        <View style={[styles.card, cardShadow]}>
          <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
            {renderSectionHeader("Location & Religion", <Globe size={16} color={accentColor} />)}
            {renderInput("Country", "country", "India")}
            {renderInput("State", "state", "Maharashtra")}
            {renderInput("City", "city", "Jalgaon")}
            {renderInput("Area", "area", "Pachora")}
            {renderSelect("Willing to Relocate?", "relocate", OPTIONS.relocate)}
            <View style={[styles.sectionDivider, { backgroundColor: inputBorder }]} />
            {renderSelect("Religion", "religion", OPTIONS.religion)}
            {renderInput("Caste", "caste", "OBC")}
            {renderInput("Sub Caste", "subCaste", "Badgujar")}
            {renderInput("Mother Tongue", "motherTongue", "Marathi")}
            {renderSelect("Family Values", "familyValues", OPTIONS.familyValues)}
          </View>
        </View>

        {/* ─── Section 5: Career & Education ─── */}
        <View style={[styles.card, cardShadow]}>
          <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
            {renderSectionHeader("Career & Education", <Briefcase size={16} color={accentColor} />)}
            {renderInput("Highest Degree", "highestDegree", "BE")}
            {renderInput("College / University", "college", "University Name")}
            {renderInput("Profession", "profession", "Software Engineer")}
            {renderSelect("Industry", "industry", OPTIONS.industry)}
            {renderInput("Company Name", "company", "Company Pvt Ltd")}
            {renderSelect("Annual Income", "income", OPTIONS.income)}
          </View>
        </View>

        {/* ─── Section 6: Family Details ─── */}
        <View style={[styles.card, cardShadow]}>
          <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
            {renderSectionHeader("Family Details", <Users size={16} color={accentColor} />)}
            {renderSelect("Family Type", "familyType", OPTIONS.familyType)}
            {renderInput("Family Location", "familyLocation", "Home Town")}
            {renderInput("Father's Status", "fatherStatus", "Retired")}
            {renderInput("Mother's Status", "motherStatus", "Homemaker")}
            {renderInput("Siblings (Brothers/Sisters)", "siblings", "1 Brother, 0 Sister")}
          </View>
        </View>

        {/* ─── Section 7: Lifestyle ─── */}
        <View style={[styles.card, cardShadow]}>
          <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
            {renderSectionHeader("Lifestyle", <Heart size={16} color={accentColor} />)}
            {renderSelect("Dietary Habits", "diet", OPTIONS.diet)}
            {renderSelect("Smoking Habits", "smoking", OPTIONS.smoking)}
            {renderSelect("Drinking Habits", "drinking", OPTIONS.drinking)}
            {renderSelect("Physical Activity", "activity", OPTIONS.activity)}
          </View>
        </View>

        {/* ─── Section 8: Partner Preferences ─── */}
        <View style={[styles.card, cardShadow]}>
          <View style={[styles.cardInner, { backgroundColor: cardBg }]}>
            {renderSectionHeader("Partner Preferences", <Star size={16} color={accentColor} />)}
            {renderInput("Preferred Age", "preferredAge", "24 - 29 Years")}
            {renderInput("Preferred Location", "preferredLocation", "Mumbai, Pune")}
            {renderInput("Deal Breakers", "dealBreakers", "Smoking, Drinking")}
          </View>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ─── Selection Modal ─── */}
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
            {/* Modal Header */}
            <View style={styles.modalHandle} />
            <View style={[styles.modalHead, { borderBottomColor: inputBorder }]}>
              <Text style={[styles.modalHeadTitle, { color: textColor }]}>{currentSelection?.label}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                <X size={20} color={mutedText} />
              </TouchableOpacity>
            </View>

            {/* Option List */}
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
                      isSelected && { fontWeight: '700' },
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
    </SafeAreaView>
  );
}

// ─── Card Shadow (extracted for reuse) ───────────────────
const cardShadow = Platform.select({
  ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
  web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
}) as any;

// ─── Styles ──────────────────────────────────────────────
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

  // Top Bar
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
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  scrollBody: {
    paddingBottom: 30,
  },

  // Hero
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
    ...StyleSheet.absoluteFillObject,
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
    fontWeight: '600',
  },
  heroDetails: {
    backgroundColor: 'transparent',
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  heroMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 3,
    fontWeight: '500',
  },

  // Cards
  card: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardInner: {
    padding: 20,
    borderRadius: 16,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.2,
  },

  // Field Group
  fieldGroup: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
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

  // Select
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

  // Locked
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
    fontWeight: '500',
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
    fontWeight: '700',
    color: palette.gold.main,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  sectionDivider: {
    height: 1,
    marginVertical: 12,
  },

  // Modal
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
    fontWeight: '700',
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
});
