import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft, Save, RotateCcw,
  ChevronDown, Shield, Heart,
  BookOpen, MapPin, Briefcase,
  CheckCircle, XCircle, AlertCircle, HelpCircle,
  ShieldCheck, ToggleLeft, ToggleRight
} from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { getContactFilters, updateContactFilters } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../../services/secureStorage';
import { fonts } from "@/src/theme";

// Options — mirrored from PartnerPreferenceScreen for consistency
const RELIGION_OPTIONS = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain', 'Parsi', 'Jewish', 'Spiritual'];
const EDUCATION_OPTIONS = ['Doctorate', 'Masters', 'Bachelors', 'Diploma', 'High School'];
const INCOME_OPTIONS = ['Upto 3 Lakh', '3-6 Lakh', '6-10 Lakh', '10-15 Lakh', '15+ Lakh'];
const MARITAL_OPTIONS = ['Never Married', 'Divorced', 'Widowed', 'Awaiting Divorce'];
const MOTHER_TONGUE_OPTIONS = [
  'Hindi', 'English', 'Punjabi', 'Tamil', 'Telugu', 'Bengali',
  'Marathi', 'Gujarati', 'Kannada', 'Malayalam', 'Odia', 'Urdu',
  'Assamese', 'Sindhi', 'Kashmiri', 'Nepali', 'Konkani', 'Maithili',
];

export default function ContactFilterScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // Filter states
  const [isEnabled, setIsEnabled] = useState(false);
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<string[]>([]);
  const [religion, setReligion] = useState<string[]>([]);
  const [motherTongue, setMotherTongue] = useState<string[]>([]);
  const [education, setEducation] = useState<string[]>([]);
  const [incomeRange, setIncomeRange] = useState('');
  const [country, setCountry] = useState('');
  const [isKycRequired, setIsKycRequired] = useState(false);

  // UI States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal Picker States
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTitle, setPickerTitle] = useState('');
  const [pickerOptions, setPickerOptions] = useState<string[]>([]);
  const [pickerMultiSelect, setPickerMultiSelect] = useState(false);
  const [pickerTempSelectedList, setPickerTempSelectedList] = useState<string[]>([]);
  const [pickerSaveTarget, setPickerSaveTarget] = useState<string>('');

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

  // Fetch existing filters on load
  const fetchFilters = async () => {
    try {
      const token = await secureStorage.getItem('token');
      if (!token) return;

      const response = await getContactFilters();
      const result = response.data;
      if (result.success && result.data) {
        const f = result.data;
        setIsEnabled(!!f.isEnabled);
        if (f.minAge) setMinAge(String(f.minAge));
        if (f.maxAge) setMaxAge(String(f.maxAge));
        if (f.incomeRange) setIncomeRange(f.incomeRange);
        if (f.country) setCountry(f.country);
        setIsKycRequired(!!f.isKycRequired);

        // Parse JSON array fields
        const parseJsonArray = (val: any): string[] => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return [val];
          }
        };

        setMaritalStatus(parseJsonArray(f.maritalStatus));
        setReligion(parseJsonArray(f.religion));
        setMotherTongue(parseJsonArray(f.motherTongue));
        setEducation(parseJsonArray(f.education));
      }
    } catch (error) {
      console.error('Fetch Contact Filters error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  // Save filters
  const handleSave = async () => {
    // Validation
    if (minAge && maxAge) {
      const minAgeInt = parseInt(minAge);
      const maxAgeInt = parseInt(maxAge);
      if (!isNaN(minAgeInt) && !isNaN(maxAgeInt) && maxAgeInt < minAgeInt) {
        showAlert('Validation Error', 'Maximum age must be greater than or equal to minimum age.', 'error');
        return;
      }
      if (!isNaN(minAgeInt) && minAgeInt < 18) {
        showAlert('Validation Error', 'Minimum age must be at least 18.', 'error');
        return;
      }
    }

    setSaving(true);
    try {
      const token = await secureStorage.getItem('token');
      if (!token) {
        showAlert('Error', 'Session expired. Please login again.', 'error');
        return;
      }

      const body = {
        isEnabled,
        minAge: minAge ? parseInt(minAge) : null,
        maxAge: maxAge ? parseInt(maxAge) : null,
        maritalStatus: maritalStatus.length > 0 ? maritalStatus : null,
        religion: religion.length > 0 ? religion : null,
        motherTongue: motherTongue.length > 0 ? motherTongue : null,
        education: education.length > 0 ? education : null,
        incomeRange: incomeRange || null,
        country: country || null,
        isKycRequired,
      };

      const response = await updateContactFilters(body);
      const result = response.data;
      if (result.success) {
        showAlert('Saved', 'Your contact filters have been updated successfully.', 'success');
      } else {
        showAlert('Error', result.message || 'Failed to update contact filters.', 'error');
      }
    } catch (error) {
      console.error('Save Contact Filters Error:', error);
      showAlert('Error', 'Network request failed. Please check your connection.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset all filters
  const handleReset = () => {
    showAlert(
      'Reset Filters',
      'Are you sure you want to clear all your contact filter settings? This will allow anyone to contact you.',
      'confirm',
      () => {
        setIsEnabled(false);
        setMinAge('');
        setMaxAge('');
        setMaritalStatus([]);
        setReligion([]);
        setMotherTongue([]);
        setEducation([]);
        setIncomeRange('');
        setCountry('');
        setIsKycRequired(false);
        showAlert('Reset', 'Your contact filters have been cleared. Remember to save your changes.', 'info');
      },
      undefined,
      'Reset',
      'Cancel'
    );
  };

  // Multi-select picker helpers
  const openMultiPicker = (title: string, options: string[], selectedList: string[], target: string) => {
    setPickerTitle(title);
    setPickerOptions(options);
    setPickerMultiSelect(true);
    setPickerTempSelectedList([...selectedList]);
    setPickerSaveTarget(target);
    setPickerVisible(true);
  };

  const openSinglePicker = (title: string, options: string[], currentVal: string, target: string) => {
    setPickerTitle(title);
    setPickerOptions(options);
    setPickerMultiSelect(false);
    setPickerTempSelectedList(currentVal ? [currentVal] : []);
    setPickerSaveTarget(target);
    setPickerVisible(true);
  };

  const toggleMultiSelectOption = (option: string) => {
    if (pickerTempSelectedList.includes(option)) {
      setPickerTempSelectedList(pickerTempSelectedList.filter(o => o !== option));
    } else {
      setPickerTempSelectedList([...pickerTempSelectedList, option]);
    }
  };

  const applyPickerSelection = () => {
    switch (pickerSaveTarget) {
      case 'maritalStatus': setMaritalStatus(pickerTempSelectedList); break;
      case 'religion': setReligion(pickerTempSelectedList); break;
      case 'motherTongue': setMotherTongue(pickerTempSelectedList); break;
      case 'education': setEducation(pickerTempSelectedList); break;
      case 'incomeRange': setIncomeRange(pickerTempSelectedList[0] || ''); break;
    }
    setPickerVisible(false);
  };

  const handleSingleSelect = (item: string) => {
    switch (pickerSaveTarget) {
      case 'incomeRange': setIncomeRange(item); break;
    }
    setPickerVisible(false);
  };

  // Render Loader
  if (loading) {
    return (
      <View style={[styles.loaderContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={palette.gold.main} />
        <Text style={styles.loaderText}>Loading filters...</Text>
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
        <Text style={styles.headerTitle}>Contact Filter</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <RotateCcw size={20} color={palette.status.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Master Toggle Card */}
        <View style={[styles.card, styles.masterToggleCard]}>
          <View style={styles.masterToggleRow}>
            <View style={styles.masterToggleInfo}>
              <Shield size={22} color={palette.gold.main} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.masterToggleTitle}>Enable Contact Filters</Text>
                <Text style={styles.masterToggleSubtitle}>
                  {isEnabled
                    ? 'Filters are active — only matching members can contact you.'
                    : 'Filters are off — anyone can contact you.'}
                </Text>
              </View>
            </View>
            <Switch
              value={isEnabled}
              onValueChange={setIsEnabled}
              thumbColor={isEnabled ? palette.gold.main : '#E8E0F0'}
              trackColor={{ false: '#E8E0F0', true: 'rgba(212, 175, 55, 0.4)' }}
            />
          </View>
        </View>

        {/* Disabled overlay hint */}
        {!isEnabled && (
          <View style={styles.disabledHint}>
            <AlertCircle size={16} color={palette.purple.muted} />
            <Text style={styles.disabledHintText}>
              Enable the toggle above to activate your contact filters.
            </Text>
          </View>
        )}

        {/* Section 1: Age Criteria */}
        <View style={[styles.card, !isEnabled && styles.cardDisabled]}>
          <View style={styles.cardHeader}>
            <Heart size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Age Criteria</Text>
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
                placeholder="18"
                placeholderTextColor="rgba(126, 107, 143, 0.4)"
                editable={isEnabled}
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
                placeholder="60"
                placeholderTextColor="rgba(126, 107, 143, 0.4)"
                editable={isEnabled}
              />
            </View>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Marital Status</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => isEnabled && openMultiPicker('Marital Status', MARITAL_OPTIONS, maritalStatus, 'maritalStatus')}
              disabled={!isEnabled}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>
                {maritalStatus.length === 0 ? 'Any Status' : maritalStatus.join(', ')}
              </Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Religion & Language */}
        <View style={[styles.card, !isEnabled && styles.cardDisabled]}>
          <View style={styles.cardHeader}>
            <BookOpen size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Religion & Language</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Religion</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => isEnabled && openMultiPicker('Religion', RELIGION_OPTIONS, religion, 'religion')}
              disabled={!isEnabled}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>
                {religion.length === 0 ? 'Any Religion' : religion.join(', ')}
              </Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Mother Tongue</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => isEnabled && openMultiPicker('Mother Tongue', MOTHER_TONGUE_OPTIONS, motherTongue, 'motherTongue')}
              disabled={!isEnabled}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>
                {motherTongue.length === 0 ? 'Any Language' : motherTongue.join(', ')}
              </Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 3: Education & Income */}
        <View style={[styles.card, !isEnabled && styles.cardDisabled]}>
          <View style={styles.cardHeader}>
            <Briefcase size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Education & Income</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Education Level</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => isEnabled && openMultiPicker('Education', EDUCATION_OPTIONS, education, 'education')}
              disabled={!isEnabled}
            >
              <Text style={styles.dropdownText} numberOfLines={1}>
                {education.length === 0 ? 'Any Education' : education.join(', ')}
              </Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Annual Income</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => isEnabled && openSinglePicker('Annual Income', INCOME_OPTIONS, incomeRange, 'incomeRange')}
              disabled={!isEnabled}
            >
              <Text style={styles.dropdownText}>
                {incomeRange || 'Any Income'}
              </Text>
              <ChevronDown size={20} color={palette.gold.main} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 4: Location */}
        <View style={[styles.card, !isEnabled && styles.cardDisabled]}>
          <View style={styles.cardHeader}>
            <MapPin size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Location</Text>
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Country</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. India, United States"
              placeholderTextColor="rgba(126, 107, 143, 0.4)"
              value={country}
              onChangeText={setCountry}
              editable={isEnabled}
            />
          </View>
        </View>

        {/* Section 5: KYC Verification */}
        <View style={[styles.card, !isEnabled && styles.cardDisabled]}>
          <View style={styles.cardHeader}>
            <ShieldCheck size={20} color={palette.gold.main} style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Verification Requirement</Text>
          </View>

          <View style={styles.kycToggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kycToggleLabel}>Require KYC Badge</Text>
              <Text style={styles.kycToggleHint}>
                Only allow KYC-verified members to request your contact details.
              </Text>
            </View>
            <Switch
              value={isKycRequired}
              onValueChange={(val) => { if (isEnabled) setIsKycRequired(val); }}
              thumbColor={isKycRequired ? palette.gold.main : '#E8E0F0'}
              trackColor={{ false: '#E8E0F0', true: 'rgba(212, 175, 55, 0.4)' }}
              disabled={!isEnabled}
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
              <Text style={styles.saveBtnText}>Save Filters</Text>
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
                <TouchableOpacity style={styles.modalApplyBtn} onPress={applyPickerSelection}>
                  <Text style={styles.modalApplyBtnText}>Apply Selection</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={pickerOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const isSelected = pickerTempSelectedList.includes(item);
                  return (
                    <TouchableOpacity
                      style={[styles.optionItem, isSelected && styles.optionItemSelected]}
                      onPress={() => handleSingleSelect(item)}
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
  // Master toggle
  masterToggleCard: {
    borderColor: palette.gold.main,
    borderWidth: 1.5,
    backgroundColor: '#FFFDF5',
  },
  masterToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  masterToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  masterToggleTitle: {
    fontSize: 16,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  masterToggleSubtitle: {
    fontSize: 12,
    color: palette.purple.muted,
    marginTop: 3,
    lineHeight: 16,
  },
  // Disabled hint
  disabledHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF9FC',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: palette.purple.border,
    borderStyle: 'dashed',
  },
  disabledHintText: {
    fontSize: 13,
    color: palette.purple.muted,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  // Card Styles
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
  cardDisabled: {
    opacity: 0.5,
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
    flex: 1,
  },
  // KYC Toggle
  kycToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kycToggleLabel: {
    fontSize: 14,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  kycToggleHint: {
    fontSize: 12,
    color: palette.purple.muted,
    marginTop: 4,
    lineHeight: 16,
  },
  // Save Button
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
  // Picker Modal
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
