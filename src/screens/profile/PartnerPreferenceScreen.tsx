import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft, Save, RotateCcw,
  ChevronDown, Settings, Heart,
  BookOpen, MapPin, Briefcase,
  CheckCircle, XCircle, AlertCircle, HelpCircle
} from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { getProfile, updateProfile, getPartnerPreferences, updatePartnerPreferences, resetPartnerPreferences } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../../services/secureStorage';
import { fonts } from "@/src/theme";

// Options list definitions
const RELIGION_OPTIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi', 'Jewish', 'Spiritual', 'Any'];
const DIET_OPTIONS = ['Veg', 'Non-Veg', 'Vegan', 'Eggetarian', 'Any'];
const EDUCATION_OPTIONS = ['Doctorate', 'Masters', 'Bachelors', 'Diploma', 'High School', 'Any'];
const INCOME_OPTIONS = ['Upto 3 Lakh', '3-6 Lakh', '6-10 Lakh', '10-15 Lakh', '15+ Lakh', 'Any'];
const MARITAL_OPTIONS = ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'];
const WORK_SECTOR_OPTIONS = ['Private', 'Government', 'Business', 'Self-Employed', 'Freelance'];

export default function PartnerPreferenceScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isDark = false;

  // Form states
  const [minAge, setMinAge] = useState('18');
  const [maxAge, setMaxAge] = useState('50');
  const [minHeight, setMinHeight] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<string[]>([]);
  const [diet, setDiet] = useState('Any');
  const [education, setEducation] = useState('Any');
  const [workSector, setWorkSector] = useState<string[]>([]);
  const [incomeRange, setIncomeRange] = useState('Any');
  const [religion, setReligion] = useState('Any');
  const [caste, setCaste] = useState('');
  const [casteNoBar, setCasteNoBar] = useState(false);
  const [motherTongue, setMotherTongue] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  // Profile-level preference fields (stored on Profile model)
  const [lookingFor, setLookingFor] = useState('');
  const [dealBreakers, setDealBreakers] = useState('');

  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Modal Picker States
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTitle, setPickerTitle] = useState('');
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const [pickerSelectedCallback, setPickerSelectedCallback] = useState<(val: string) => void>(() => { });
  const [pickerMultiSelect, setPickerMultiSelect] = useState(false);
  const [pickerTempSelectedList, setPickerTempSelectedList] = useState<string[]>([]);

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'confirm' | 'info';
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'confirm' | 'info' = 'info',
    onConfirm?: () => void,
    onCancel?: () => void,
    confirmText = 'OK',
    cancelText = 'Cancel'
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm,
      onCancel,
      confirmText,
      cancelText,
    });
  };

  // Fetch Preferences on load
  const fetchPreferences = async () => {
    try {
      const token = await secureStorage.getItem('token');
      if (!token) return;

      // Fetch PartnerPreference model data
      const response = await getPartnerPreferences();
      const result = response.data;
      if (result.success && result.data) {
        const p = result.data;
        if (p.minAge) setMinAge(String(p.minAge));
        if (p.maxAge) setMaxAge(String(p.maxAge));
        if (p.minHeight) setMinHeight(p.minHeight);

        // Handle marital status parsing
        if (p.maritalStatus) {
          try {
            const parsed = typeof p.maritalStatus === 'string' ? JSON.parse(p.maritalStatus) : p.maritalStatus;
            setMaritalStatus(Array.isArray(parsed) ? parsed : [parsed]);
          } catch {
            setMaritalStatus([p.maritalStatus]);
          }
        }

        if (p.diet) setDiet(p.diet);
        if (p.education) setEducation(p.education);

        // Handle work sector parsing
        if (p.workSector) {
          try {
            const parsed = typeof p.workSector === 'string' ? JSON.parse(p.workSector) : p.workSector;
            setWorkSector(Array.isArray(parsed) ? parsed : [parsed]);
          } catch {
            setWorkSector([p.workSector]);
          }
        }

        if (p.incomeRange) setIncomeRange(p.incomeRange);
        if (p.religion) setReligion(p.religion);
        if (p.caste) setCaste(p.caste);
        if (p.casteNoBar !== undefined) setCasteNoBar(p.casteNoBar);
        if (p.motherTongue) setMotherTongue(p.motherTongue);
        if (p.country) setCountry(p.country);
        if (p.city) setCity(p.city);
      }

      // Fetch profile-level preference fields
      const profileRes = await getProfile();
      if (profileRes.data?.success && profileRes.data?.data) {
        const prof = profileRes.data.data;
        if (prof.lookingFor) setLookingFor(prof.lookingFor);
        if (prof.dealBreakers) setDealBreakers(prof.dealBreakers);
      }
    } catch (error) {
      console.error('Fetch Preferences error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  // Save Preferences
  const handleSave = async () => {
    const minAgeInt = parseInt(minAge);
    const maxAgeInt = parseInt(maxAge);

    if (isNaN(minAgeInt) || minAgeInt < 18 || minAgeInt > 100) {
      showAlert('Validation Error', 'Minimum age must be at least 18.', 'error');
      return;
    }
    if (isNaN(maxAgeInt) || maxAgeInt < minAgeInt) {
      showAlert('Validation Error', 'Maximum age must be greater than or equal to minimum age.', 'error');
      return;
    }

    setSaving(true);
    try {
      const token = await secureStorage.getItem('token');
      if (!token) {
        showAlert('Error', 'Session expired. Please login again.', 'error');
        return;
      }

      const body = {
        minAge: minAgeInt,
        maxAge: maxAgeInt,
        minHeight,
        maritalStatus,
        diet,
        education,
        workSector,
        incomeRange,
        religion,
        caste,
        casteNoBar,
        motherTongue,
        country,
        city
      };

      const response = await updatePartnerPreferences(body);
      const result = response.data;

      // Also save profile-level preference fields (auto-derived from structured inputs)
      const derivedPreferredAge = `${minAge} - ${maxAge} Years`;
      const derivedPreferredLocation = [city, country].filter(Boolean).join(', ');
      await updateProfile({
        preferredAge: derivedPreferredAge,
        preferredLocation: derivedPreferredLocation,
        lookingFor,
        dealBreakers,
      });

      if (result.success) {
        showAlert('Success', 'All preferences updated successfully.', 'success');
      } else {
        showAlert('Error', result.message || 'Failed to update preferences.', 'error');
      }
    } catch (error) {
      console.error('Save Preferences Error:', error);
      showAlert('Error', 'Network request failed. Please check your connection.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset Preferences
  const handleReset = () => {
    showAlert(
      'Reset Preferences',
      'Are you sure you want to clear your custom partner preferences? This will restore standard matching.',
      'confirm',
      async () => {
        setResetting(true);
        try {
          const token = await secureStorage.getItem('token');
          if (!token) return;

          const response = await resetPartnerPreferences();
          const result = response.data;
          if (result.success) {
            // Restore defaults in state
            setMinAge('18');
            setMaxAge('50');
            setMinHeight('');
            setMaritalStatus([]);
            setDiet('Any');
            setEducation('Any');
            setWorkSector([]);
            setIncomeRange('Any');
            setReligion('Any');
            setCaste('');
            setCasteNoBar(false);
            setMotherTongue('');
            setCountry('');
            setCity('');
            showAlert('Success', 'Preferences have been reset.', 'success');
          }
        } catch (err) {
          console.error(err);
        } finally {
          setResetting(false);
        }
      },
      undefined,
      'Reset',
      'Cancel'
    );
  };

  // Dropdown Picker Handler
  const openSinglePicker = (title: string, options: string[], currentVal: string, onSelect: (val: string) => void) => {
    setPickerTitle(title);
    setPickerOptions(options);
    setPickerMultiSelect(false);
    setPickerSelectedCallback(() => onSelect);
    setPickerTempSelectedList([currentVal]);
    setPickerVisible(true);
  };

  const openMultiPicker = (title: string, options: string[], selectedList: string[], onSave: (list: string[]) => void) => {
    setPickerTitle(title);
    setPickerOptions(options);
    setPickerMultiSelect(true);
    setPickerTempSelectedList([...selectedList]);
    setPickerSelectedCallback(() => (val: string) => {
      // Stub callback, multi selection handled by Save button
    });
    setPickerVisible(true);
  };

  const toggleMultiSelectOption = (option: string) => {
    if (pickerTempSelectedList.includes(option)) {
      setPickerTempSelectedList(pickerTempSelectedList.filter(o => o !== option));
    } else {
      setPickerTempSelectedList([...pickerTempSelectedList, option]);
    }
  };

  const saveMultiSelectResults = () => {
    if (pickerTitle === 'Marital Status') {
      setMaritalStatus(pickerTempSelectedList);
    } else if (pickerTitle === 'Working Sector') {
      setWorkSector(pickerTempSelectedList);
    }
    setPickerVisible(false);
  };

  // Render Loader
  if (loading) {
    return (
      <View style={[styles.loaderContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={palette.gold.main} />
        <Text style={styles.loaderText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#FFFFFF' }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={palette.purple.deep} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Preferences</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset} disabled={resetting}>
          {resetting ? (
            <ActivityIndicator size="small" color={palette.status.error} />
          ) : (
            <RotateCcw size={20} color={palette.status.error} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Section 0: Profile-level Expectations */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <BookOpen size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Your Expectations</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Looking For</Text>
            <TextInput
              style={[styles.textInput, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="Describe your ideal partner..."
              placeholderTextColor="rgba(126, 107, 143, 0.5)"
              value={lookingFor}
              onChangeText={setLookingFor}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Deal Breakers</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Smoking, Drinking"
              placeholderTextColor="rgba(126, 107, 143, 0.5)"
              value={dealBreakers}
              onChangeText={setDealBreakers}
            />
          </View>
        </View>

        {/* Section 1: Basic Preferences */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Heart size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Basic Profile Criteria</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Min Age</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                maxLength={2}
                value={minAge}
                onChangeText={setMinAge}
              />
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Text style={styles.label}>Max Age</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                maxLength={2}
                value={maxAge}
                onChangeText={setMaxAge}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Minimum Height</Text>
            <TextInput
              style={styles.textInput}
              placeholder={"e.g. 5'5\" or 165 cm"}
              placeholderTextColor="rgba(126, 107, 143, 0.5)"
              value={minHeight}
              onChangeText={setMinHeight}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Marital Status</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => openMultiPicker('Marital Status', MARITAL_OPTIONS, maritalStatus, setMaritalStatus)}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>
                {maritalStatus.length === 0 ? 'Any Status' : maritalStatus.join(', ')}
              </Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Dietary Choice</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => openSinglePicker('Dietary Choice', DIET_OPTIONS, diet, setDiet)}
            >
              <Text style={styles.dropdownText}>{diet}</Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Social Preferences */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Settings size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Social & Religious Settings</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Religion</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => openSinglePicker('Religion', RELIGION_OPTIONS, religion, setReligion)}
            >
              <Text style={styles.dropdownText}>{religion}</Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputWrapper, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Caste</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Specific Caste"
                placeholderTextColor="rgba(126, 107, 143, 0.5)"
                value={caste}
                onChangeText={setCaste}
              />
            </View>
            <View style={[styles.toggleWrapper, { flex: 1 }]}>
              <Text style={styles.label}>Caste No Bar</Text>
              <Switch
                value={casteNoBar}
                onValueChange={setCasteNoBar}
                thumbColor={casteNoBar ? palette.gold.main : '#E8E0F0'}
                trackColor={{ false: '#E8E0F0', true: 'rgba(212, 175, 55, 0.4)' }}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Mother Tongue</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Hindi, English, Punjabi"
              placeholderTextColor="rgba(126, 107, 143, 0.5)"
              value={motherTongue}
              onChangeText={setMotherTongue}
            />
          </View>
        </View>

        {/* Section 3: Professional Preferences */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <BookOpen size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Education & Career</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Minimum Education</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => openSinglePicker('Education Level', EDUCATION_OPTIONS, education, setEducation)}
            >
              <Text style={styles.dropdownText}>{education}</Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Working Sector</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => openMultiPicker('Working Sector', WORK_SECTOR_OPTIONS, workSector, setWorkSector)}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>
                {workSector.length === 0 ? 'Any Sector' : workSector.join(', ')}
              </Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Annual Income Expectation</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => openSinglePicker('Annual Income', INCOME_OPTIONS, incomeRange, setIncomeRange)}
            >
              <Text style={styles.dropdownText}>{incomeRange}</Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 4: Location Preferences */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MapPin size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Geographics</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Preferred Country</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. India, United States"
              placeholderTextColor="rgba(126, 107, 143, 0.5)"
              value={country}
              onChangeText={setCountry}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Preferred City</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. New Delhi, Mumbai"
              placeholderTextColor="rgba(126, 107, 143, 0.5)"
              value={city}
              onChangeText={setCity}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={palette.purple.deep} />
          ) : (
            <>
              <Save size={20} color={palette.purple.deep} style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Preferences</Text>
            </>
          )}
        </TouchableOpacity>

      </ScrollView>

      {/* Custom Picker Modal */}
      <Modal visible={pickerVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{pickerTitle}</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            {pickerMultiSelect ? (
              // Multi Select Options list
              <View style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollOptions}>
                  {pickerOptions.map(option => {
                    const isSelected = pickerTempSelectedList.includes(option);
                    return (
                      <TouchableOpacity
                        key={option}
                        style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                        onPress={() => toggleMultiSelectOption(option)}
                      >
                        <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                          {option}
                        </Text>
                        {isSelected && <Text style={styles.optionCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity style={styles.modalApplyBtn} onPress={saveMultiSelectResults}>
                  <Text style={styles.modalApplyBtnText}>Apply Selection</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Single Select Options list
              <FlatList
                data={pickerOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const isSelected = pickerTempSelectedList.includes(item);
                  return (
                    <TouchableOpacity
                      style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                      onPress={() => {
                        pickerSelectedCallback(item);
                        setPickerVisible(false);
                      }}
                    >
                      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                        {item}
                      </Text>
                      {isSelected && <Text style={styles.optionCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Alert Modal */}
      <Modal visible={alertConfig.visible} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View style={styles.alertIconWrapper}>
              {alertConfig.type === 'success' && <CheckCircle size={40} color="#4CAF50" />}
              {alertConfig.type === 'error' && <XCircle size={40} color={palette.status.error} />}
              {alertConfig.type === 'confirm' && <HelpCircle size={40} color={palette.gold.main} />}
              {alertConfig.type === 'info' && <AlertCircle size={40} color={palette.purple.muted} />}
            </View>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            
            <View style={styles.alertBtnContainer}>
              {alertConfig.type === 'confirm' ? (
                <>
                  <TouchableOpacity 
                    style={[styles.alertBtn, styles.alertBtnSecondary]}
                    onPress={() => {
                      setAlertConfig(prev => ({ ...prev, visible: false }));
                      if (alertConfig.onCancel) alertConfig.onCancel();
                    }}
                  >
                    <Text style={styles.alertBtnTextSecondary}>{alertConfig.cancelText || 'Cancel'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.alertBtn, styles.alertBtnPrimary]}
                    onPress={() => {
                      setAlertConfig(prev => ({ ...prev, visible: false }));
                      if (alertConfig.onConfirm) alertConfig.onConfirm();
                    }}
                  >
                    <Text style={styles.alertBtnTextPrimary}>{alertConfig.confirmText || 'OK'}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  style={[styles.alertBtn, styles.alertBtnSingle]}
                  onPress={() => {
                    setAlertConfig(prev => ({ ...prev, visible: false }));
                    if (alertConfig.onConfirm) alertConfig.onConfirm();
                  }}
                >
                  <Text style={styles.alertBtnTextPrimary}>{alertConfig.confirmText || 'OK'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: palette.purple.border,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  resetBtn: {
    padding: 5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: palette.purple.deep,
    marginTop: 15,
    fontSize: 16,
    ...fonts.semibold,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: palette.purple.border,
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    marginBottom: 15,
  },
  toggleWrapper: {
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  label: {
    fontSize: 12,
    ...fonts.semibold,
    color: palette.purple.muted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#FAF9FC',
    borderColor: palette.purple.border,
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    color: palette.purple.deep,
    paddingHorizontal: 15,
    fontSize: 14,
  },
  dropdownTrigger: {
    backgroundColor: '#FAF9FC',
    borderColor: palette.purple.border,
    borderWidth: 1,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    color: palette.purple.deep,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: palette.gold.main,
    height: 55,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    shadowColor: palette.gold.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnText: {
    color: palette.purple.deep,
    fontSize: 16,
    ...fonts.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    height: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 18,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  modalCloseText: {
    color: '#999999',
    fontSize: 14,
    ...fonts.semibold,
  },
  optionItem: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionItemSelected: {
    backgroundColor: 'rgba(59, 30, 84, 0.05)',
  },
  optionText: {
    fontSize: 16,
    color: palette.purple.deep,
  },
  optionTextSelected: {
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  optionCheck: {
    fontSize: 18,
    color: palette.gold.main,
    ...fonts.semibold,
  },
  scrollOptions: {
    paddingBottom: 20,
  },
  modalApplyBtn: {
    backgroundColor: palette.purple.deep,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalApplyBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    ...fonts.semibold,
  },
  // Custom Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(59, 30, 84, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  alertIconWrapper: {
    marginBottom: 15,
  },
  alertTitle: {
    fontSize: 18,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginBottom: 8,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    color: palette.purple.muted,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  alertBtnContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  alertBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBtnPrimary: {
    backgroundColor: palette.purple.deep,
  },
  alertBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: palette.purple.border,
  },
  alertBtnSingle: {
    backgroundColor: palette.purple.deep,
    width: '100%',
  },
  alertBtnTextPrimary: {
    color: '#FFFFFF',
    ...fonts.semibold,
    fontSize: 15,
  },
  alertBtnTextSecondary: {
    color: palette.purple.deep,
    ...fonts.semibold,
    fontSize: 15,
  },
});
