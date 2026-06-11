import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
  Platform,
  StatusBar,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft, Heart, Calendar, FileText, Image as ImageIcon, Sparkles, X, Camera, CheckCircle2
} from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { fonts } from '@/src/theme';
import { submitSuccessStory, getMySuccessStory, resolvePhotoUrl } from '../../services/api';
import { launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import { showToast } from '../../utils/toast';

const { width } = Dimensions.get('window');

export default function SubmitStoryScreen() {
  const navigation = useNavigation<any>();
  
  // Form States
  const [coupleName, setCoupleName] = useState('');
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  
  // Date States (DD, MM, YYYY)
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittedStory, setSubmittedStory] = useState<any>(null);

  const handleResetForm = useCallback(() => {
    setCoupleName('');
    setTitle('');
    setStory('');
    setDay('');
    setMonth('');
    setYear('');
    setImage(null);
    setSuccess(false);
    setSubmittedStory(null);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await getMySuccessStory();
      if (res.data.success && res.data.story) {
        setSubmittedStory(res.data.story);
        setSuccess(true);
      } else {
        setSubmittedStory(null);
        setSuccess(false);
      }
    } catch (err) {
      console.error("Error refreshing story submission:", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const checkSubmission = async () => {
      try {
        const res = await getMySuccessStory();
        if (res.data.success && res.data.story) {
          setSubmittedStory(res.data.story);
          setSuccess(true);
        } else {
          setSubmittedStory(null);
          setSuccess(false);
        }
      } catch (err) {
        console.error("Error checking story submission:", err);
      } finally {
        setChecking(false);
      }
    };
    checkSubmission();
  }, []);

  const handleSelectImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        showToast(result.errorMessage || "Image selection error.");
        return;
      }

      const asset = result.assets?.[0];
      if (asset) {
        setImage(asset);
      }
    } catch (err) {
      console.error("Image Picker Error:", err);
      showToast("Could not access photo gallery.");
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
  };

  const validateInputs = () => {
    if (!coupleName.trim()) {
      showToast("Please enter the couple's names.");
      return false;
    }
    if (!day || !month || !year || year.length !== 4) {
      showToast("Please enter a valid wedding date.");
      return false;
    }
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (isNaN(d) || d < 1 || d > 31 || isNaN(m) || m < 1 || m > 12 || isNaN(y) || y < 1900 || y > 2100) {
      showToast("Please enter valid date values.");
      return false;
    }
    if (!title.trim()) {
      showToast("Please enter a title for your story.");
      return false;
    }
    if (!story.trim() || story.trim().length < 50) {
      showToast("Please tell us your story (minimum 50 characters).");
      return false;
    }
    if (!image) {
      showToast("Please select a couple photo to upload.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      
      const formData = new FormData();
      formData.append('coupleName', coupleName.trim());
      formData.append('weddingDate', formattedDate);
      formData.append('title', title.trim());
      formData.append('story', story.trim());

      const fileData = {
        uri: Platform.OS === 'android' ? image.uri : image.uri.replace('file://', ''),
        type: image.type || 'image/jpeg',
        name: image.fileName || `story_${Date.now()}.jpg`,
      };
      formData.append('image', fileData as any);

      const res = await submitSuccessStory(formData);
      if (res.data.success) {
        setSubmittedStory(res.data.story);
        setSuccess(true);
      } else {
        showToast(res.data.message || "Failed to submit story.");
      }
    } catch (err) {
      console.error("Submit Success Story Error:", err);
      showToast("Server connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#3B1E54" />
      </SafeAreaView>
    );
  }

  if (success && submittedStory) {
    const isPending = submittedStory.status === 'pending';
    const isApproved = submittedStory.status === 'approved';
    const isRejected = submittedStory.status === 'rejected';

    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        <ScrollView
          contentContainerStyle={[styles.scrollBody, styles.centeredContent]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B1E54']}
              tintColor="#3B1E54"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {isPending && (
            <View style={styles.successCard}>
              <View style={styles.successIconCircle}>
                <CheckCircle2 size={48} color="#4CAF50" />
              </View>
              <Text style={styles.successTitle}>Story Submitted for Review!</Text>
              <Text style={styles.successSubtitle}>
                Thank you for sharing your beautiful journey with us! Your success story is pending review and will be featured on the platform once approved.
              </Text>
              
              <TouchableOpacity
                style={styles.addAnotherBtn}
                onPress={handleResetForm}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3B1E54', '#5A2A82']}
                  style={styles.gradientBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.addAnotherBtnText}>Add Another Story</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => navigation.replace("Tabs")}
                activeOpacity={0.7}
              >
                <Text style={styles.outlineBtnText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          )}

          {isApproved && (
            <View style={styles.approvedCard}>
              <View style={styles.liveBadge}>
                <Sparkles size={14} color="#D4AF37" />
                <Text style={styles.liveBadgeText}>APPROVED & LIVE</Text>
              </View>
              
              {submittedStory.imageUrl && (
                <View style={styles.approvedImageWrapper}>
                  <Image 
                    source={{ uri: resolvePhotoUrl(submittedStory.imageUrl) }} 
                    style={styles.approvedImage} 
                    resizeMode="cover"
                  />
                </View>
              )}

              <Text style={styles.approvedCouple}>{submittedStory.coupleName}</Text>
              
              {submittedStory.weddingDate && (
                <View style={styles.weddingDateRow}>
                  <Calendar size={14} color="#7E6B8F" />
                  <Text style={styles.weddingDateText}>
                    Married on {new Date(submittedStory.weddingDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <Text style={styles.approvedTitle}>{submittedStory.title}</Text>
              <Text style={styles.approvedStoryText}>{submittedStory.story}</Text>

              <TouchableOpacity
                style={styles.addAnotherBtn}
                onPress={handleResetForm}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3B1E54', '#5A2A82']}
                  style={styles.gradientBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.addAnotherBtnText}>Add Another Story</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => navigation.replace("Tabs")}
                activeOpacity={0.7}
              >
                <Text style={styles.outlineBtnText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          )}

          {isRejected && (
            <View style={styles.successCard}>
              <View style={[styles.successIconCircle, styles.errorIconCircle]}>
                <X size={48} color="#D32F2F" />
              </View>
              <Text style={styles.successTitle}>Story Not Approved</Text>
              <Text style={styles.successSubtitle}>
                Unfortunately, your submitted success story did not meet our community moderation guidelines. You can submit another story for review.
              </Text>
              
              <TouchableOpacity
                style={styles.addAnotherBtn}
                onPress={handleResetForm}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#3B1E54', '#5A2A82']}
                  style={styles.gradientBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.addAnotherBtnText}>Add Story Again</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => navigation.replace("Tabs")}
                activeOpacity={0.7}
              >
                <Text style={styles.outlineBtnText}>Back to Dashboard</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ArrowLeft size={22} color="#3B1E54" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share Success Story</Text>
        <View style={styles.headerBtn} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollBody}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B1E54']}
              tintColor="#3B1E54"
            />
          }
        >
          {/* Top Banner Card */}
          <LinearGradient
            colors={['#3B1E54', '#5A2A82']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerCard}
          >
            <View style={styles.bannerHeader}>
              <Sparkles size={24} color={palette.gold.main} />
              <Text style={styles.bannerSubtitle}>We'd Love to Celebrate You!</Text>
            </View>
            <Text style={styles.bannerDescription}>
              Found your perfect match? Share your matrimonial milestone with our community and inspire others who are on their journey to marriage.
            </Text>
          </LinearGradient>

          {/* Form Fields */}
          <View style={styles.formCard}>
            
            {/* Couple Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>COUPLE NAMES</Text>
              <View style={[styles.inputWrapper, focusedField === 'couple' && styles.inputFocused]}>
                <Heart size={18} color={focusedField === 'couple' ? '#3B1E54' : palette.purple.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Rahul & Deepika"
                  placeholderTextColor="#A39BB0"
                  value={coupleName}
                  onChangeText={setCoupleName}
                  onFocus={() => setFocusedField('couple')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Wedding Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>WEDDING DATE</Text>
              <View style={styles.dateRow}>
                <View style={[styles.dateField, focusedField === 'day' && styles.inputFocused]}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="DD"
                    placeholderTextColor="#A39BB0"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={day}
                    onChangeText={(val) => setDay(val.replace(/[^0-9]/g, ''))}
                    onFocus={() => setFocusedField('day')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={[styles.dateField, focusedField === 'month' && styles.inputFocused]}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="MM"
                    placeholderTextColor="#A39BB0"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={month}
                    onChangeText={(val) => setMonth(val.replace(/[^0-9]/g, ''))}
                    onFocus={() => setFocusedField('month')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={[styles.dateField, focusedField === 'year' && styles.inputFocused]}>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="YYYY"
                    placeholderTextColor="#A39BB0"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={year}
                    onChangeText={(val) => setYear(val.replace(/[^0-9]/g, ''))}
                    onFocus={() => setFocusedField('year')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            </View>

            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>STORY TITLE</Text>
              <View style={[styles.inputWrapper, focusedField === 'title' && styles.inputFocused]}>
                <FileText size={18} color={focusedField === 'title' ? '#3B1E54' : palette.purple.muted} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Love Found at First Sight"
                  placeholderTextColor="#A39BB0"
                  value={title}
                  onChangeText={setTitle}
                  onFocus={() => setFocusedField('title')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Story Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>TELL US YOUR STORY</Text>
              <View style={[styles.textAreaWrapper, focusedField === 'story' && styles.inputFocused]}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Tell us about how you met, your first conversation, and your beautiful journey to marriage..."
                  placeholderTextColor="#A39BB0"
                  multiline
                  numberOfLines={6}
                  value={story}
                  onChangeText={setStory}
                  onFocus={() => setFocusedField('story')}
                  onBlur={() => setFocusedField(null)}
                  textAlignVertical="top"
                />
              </View>
            </View>

            {/* Image Upload */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>COUPLE PHOTO</Text>
              {image ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: image.uri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.removeImageBtn} onPress={handleRemoveImage}>
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadPlaceholder} onPress={handleSelectImage} activeOpacity={0.7}>
                  <Camera size={32} color={palette.purple.muted} />
                  <Text style={styles.uploadText}>Select Couple Photo</Text>
                  <Text style={styles.uploadSubtext}>Upload a JPEG or PNG photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#3B1E54', '#5A2A82']}
                style={styles.gradientBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitBtnText}>Submit Success Story</Text>
                    <Sparkles size={16} color={palette.gold.main} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 30, 84, 0.08)',
    backgroundColor: '#FFFFFF',
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    ...fonts.bold,
    color: '#3B1E54',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  bannerCard: {
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#3B1E54',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bannerSubtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    ...fonts.bold,
  },
  bannerDescription: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    lineHeight: 18,
    ...fonts.medium,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 30, 84, 0.06)',
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    ...fonts.bold,
    color: '#7E6B8F',
    letterSpacing: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDFDFD',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EDE6F5',
    paddingHorizontal: 14,
    height: 48,
  },
  inputFocused: {
    borderColor: '#3B1E54',
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#3B1E54',
    ...fonts.medium,
    paddingVertical: 0,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateField: {
    flex: 1,
    backgroundColor: '#FDFDFD',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#EDE6F5',
    height: 46,
    justifyContent: 'center',
  },
  dateInput: {
    textAlign: 'center',
    fontSize: 14,
    color: '#3B1E54',
    ...fonts.semibold,
    paddingVertical: 0,
    height: 46,
  },
  textAreaWrapper: {
    backgroundColor: '#FDFDFD',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EDE6F5',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  textArea: {
    fontSize: 14,
    color: '#3B1E54',
    ...fonts.medium,
    height: 120,
    paddingVertical: 0,
  },
  uploadPlaceholder: {
    height: 140,
    borderWidth: 1.5,
    borderColor: '#EDE6F5',
    borderStyle: 'dashed',
    borderRadius: 14,
    backgroundColor: '#FDFDFD',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  uploadText: {
    fontSize: 14,
    ...fonts.bold,
    color: '#3B1E54',
  },
  uploadSubtext: {
    fontSize: 11,
    color: '#7E6B8F',
  },
  previewContainer: {
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
  },
  gradientBtn: {
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...fonts.bold,
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: width - 48,
    borderWidth: 1,
    borderColor: 'rgba(59, 30, 84, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    ...fonts.bold,
    color: '#3B1E54',
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: '#7E6B8F',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    ...fonts.medium,
  },
  addAnotherBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  addAnotherBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...fonts.bold,
  },
  outlineBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#EDE6F5',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  outlineBtnText: {
    color: '#3B1E54',
    fontSize: 15,
    ...fonts.bold,
  },
  centeredContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approvedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: width - 48,
    borderWidth: 1,
    borderColor: 'rgba(59, 30, 84, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    marginBottom: 16,
  },
  liveBadgeText: {
    color: '#D4AF37',
    fontSize: 11,
    ...fonts.bold,
    letterSpacing: 0.5,
  },
  approvedImageWrapper: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  approvedImage: {
    width: '100%',
    height: '100%',
  },
  approvedCouple: {
    fontSize: 20,
    ...fonts.bold,
    color: '#3B1E54',
    marginBottom: 6,
    textAlign: 'center',
  },
  weddingDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  weddingDateText: {
    fontSize: 13,
    color: '#7E6B8F',
    ...fonts.medium,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#EDE6F5',
    marginVertical: 14,
  },
  approvedTitle: {
    fontSize: 16,
    ...fonts.bold,
    color: '#3B1E54',
    marginBottom: 8,
    textAlign: 'center',
  },
  approvedStoryText: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 22,
    ...fonts.regular,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorIconCircle: {
    backgroundColor: 'rgba(211, 47, 47, 0.1)',
  }
});
