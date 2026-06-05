import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  Image,
  Share,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  Switch,
  Modal,
  TextInput,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useProfileSocket } from '../../hooks/useProfileSocket';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Heart,
  Share2,
  MapPin,
  Briefcase,
  User,
  Languages,
  Phone,
  Mail,
  ShieldCheck,
  Crown,
  Lock,
  MessageCircle,
  Zap,
  ThumbsUp,
  Flag,
  X,
  FileText,
  Plus,
} from 'lucide-react-native';
import { Text, View } from '@/components/Themed';
import { palette } from '../../theme/colors';
import {
  revealContact,
  getMySubscription,
  getProfileById,
  resolvePhotoUrl,
  sendInterest,
  toggleShortlist,
  toggleLike,
  submitReport,
  blockUser,
} from '../../services/api';
import { showToast } from '../../utils/toast';
import { fonts } from "@/src/theme";
import { launchImageLibrary } from 'react-native-image-picker';
import { pick } from '@react-native-documents/picker';

const { width } = Dimensions.get('window');



export default function ProfileDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const profile = route.params?.profile || null;

  const isDark = false;

  const [loading, setLoading] = useState(false);
  const [_profileLoading, setProfileLoading] = useState(false);
  const [profileFetched, setProfileFetched] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [subscription, setSubscription] = useState<any>(null);
  const [contactRevealed, setContactRevealed] = useState(false);
  const [revealedData, setRevealedData] = useState<{
    mobile?: string;
    email?: string;
  } | null>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(profile);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Array<{ uri: string; type: string; name: string }>>([]);
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const handlePickImage = async () => {
    if (selectedFiles.length >= 5) {
      showCustomToast('You can attach up to 5 proof documents.');
      return;
    }
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 5 - selectedFiles.length,
      });
      if (result.didCancel) return;
      if (result.errorCode) {
        showCustomToast(result.errorMessage || 'Gallery error.');
        return;
      }
      const assets = result.assets;
      if (assets && assets.length > 0) {
        const newFiles = assets.map(asset => ({
          uri: asset.uri || '',
          name: asset.fileName || `proof_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        }));
        setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 5));
      }
    } catch (err) {
      console.error('Image picker error:', err);
      showCustomToast('Could not open gallery.');
    }
  };

  const handlePickPDF = async () => {
    if (selectedFiles.length >= 5) {
      showCustomToast('You can attach up to 5 proof documents.');
      return;
    }
    try {
      const results = await pick({
        type: ['application/pdf'],
        allowMultiSelection: true,
      });
      if (results && results.length > 0) {
        const newFiles = results.map(file => ({
          uri: file.uri,
          name: file.name || `proof_${Date.now()}.pdf`,
          type: file.type || 'application/pdf',
        }));
        setSelectedFiles(prev => [...prev, ...newFiles].slice(0, 5));
      }
    } catch (err: any) {
      if (err.message && err.message.includes('cancel')) {
        return;
      }
      console.warn('Document picker error:', err);
      showCustomToast('Failed to select document.');
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleReportAndBlock = async () => {
    if (!reportReason) {
      showCustomToast('Please select a reason for reporting.');
      return;
    }

    const targetUserId = currentProfile?.userId || currentProfile?.id;
    if (!targetUserId) {
      showCustomToast('User ID not found');
      return;
    }

    setReportSubmitting(true);
    try {
      const reportRes = await submitReport(
        targetUserId,
        'user',
        reportReason,
        reportDescription,
        selectedFiles
      );

      if (!reportRes.data?.success) {
        showCustomToast(reportRes.data?.message || 'Failed to submit report.');
        setReportSubmitting(false);
        return;
      }

      if (alsoBlock) {
        const blockRes = await blockUser(targetUserId, reportReason);
        if (!blockRes.data?.success) {
          showCustomToast(blockRes.data?.message || 'Report submitted, but failed to block user.');
        }
      }

      showCustomToast(alsoBlock ? 'User reported and blocked successfully.' : 'Report submitted successfully.');
      
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
      setSelectedFiles([]);
      navigation.goBack();
    } catch (err: any) {
      console.error('Report & Block error:', err);
      showCustomToast(err.response?.data?.message || err.message || 'Something went wrong.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const scrollY = React.useRef(new Animated.Value(0)).current;

  const showCustomToast = (msg: string) => {
    showToast(msg);
  };

  const onPhotoScroll = (event: any) => {
    const slide = Math.round(
      event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
    );
    if (slide !== activePhotoIndex) {
      setActivePhotoIndex(slide);
    }
  };

  const themeBg = isDark ? '#0A0A0A' : '#FFFFFF';
  const cardBg = isDark ? '#1A1A1A' : '#F9F9F9';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const mutedText = isDark ? '#AAAAAA' : '#666666';
  const accentGold = palette.gold.main;
  const deepPurple = '#3B1E54';

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const res = await getMySubscription();
        if (res.data.success) {
          setSubscription(res.data.subscription);
        }
      } catch (e) {
        console.error('Fetch Sub Error', e);
      }
    };
    fetchSub();
  }, []);

  const targetId = route.params?.id || profile?.userId || profile?.id;

  const fetchFreshProfile = useCallback(async (isManualRefresh = false) => {
    if (!targetId) return;
    try {
      if (isManualRefresh) setRefreshing(true);
      setProfileLoading(true);
      const res = await getProfileById(targetId);
      if (res.data.success && res.data.data) {
        setCurrentProfile(res.data.data);
        setProfileFetched(true);
        if (res.data.data.isContactRevealed) {
          setContactRevealed(true);
          setRevealedData({
            mobile: res.data.data.mobile || 'Verified',
            email: res.data.data.email || 'Verified',
          });
        }
      }
    } catch (err) {
      console.error('Fetch fresh profile error:', err);
    } finally {
      setProfileLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }, [targetId]);

  // Initial fetch
  useEffect(() => {
    setProfileFetched(false);
    fetchFreshProfile();
  }, [fetchFreshProfile]);

  // Real-time socket updates
  useProfileSocket(targetId, fetchFreshProfile);

  const onRefresh = useCallback(() => {
    fetchFreshProfile(true);
  }, [fetchFreshProfile]);

  const handleReveal = async () => {
    if (!subscription) {
      showCustomToast('Premium is required to view the contact.');
      return;
    }

    Alert.alert(
      'Reveal Contact?',
      `This will use 1 of your ${
        subscription.plan?.maxContacts === -1
          ? 'unlimited'
          : subscription.plan?.maxContacts
      } contact reveals.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reveal Now',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await revealContact(
                currentProfile.userId || currentProfile.id,
              );
              if (res.data.success) {
                setContactRevealed(true);
                setRevealedData({
                  mobile: res.data.data.mobile || 'Verified',
                  email: res.data.data.email || 'Verified',
                });
                // Update subscription state locally to show real-time count
                if (subscription.plan?.maxContacts !== -1) {
                  setSubscription({
                    ...subscription,
                    contactsUsed: subscription.contactsUsed + 1,
                  });
                }
              } else {
                showCustomToast(res.data.message || 'Failed to reveal contact');
              }
            } catch (err: any) {
              showCustomToast(
                err.response?.data?.message || 'Failed to reveal contact',
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleToggleShortlist = async () => {
    const targetUserId = currentProfile?.userId || currentProfile?.id;
    if (!targetUserId) {
      showCustomToast('User ID not found');
      return;
    }
    try {
      const res = await toggleShortlist(targetUserId);
      if (res.data?.success) {
        setCurrentProfile((prev: any) => ({
          ...prev,
          isShortlisted: !prev?.isShortlisted,
        }));
        showCustomToast(res.data?.message || 'Shortlist status updated');
      } else {
        showCustomToast(res.data?.message || 'Failed to update shortlist');
      }
    } catch (err: any) {
      showCustomToast(err.message || 'Something went wrong');
    }
  };

  const handleToggleLike = async () => {
    const targetUserId = currentProfile?.userId || currentProfile?.id;
    if (!targetUserId) {
      showCustomToast('User ID not found');
      return;
    }
    try {
      const res = await toggleLike(targetUserId);
      if (res.data?.success) {
        setCurrentProfile((prev: any) => ({
          ...prev,
          isLiked: !prev?.isLiked,
        }));
        showCustomToast(res.data?.message || 'Like status updated');
      } else {
        showCustomToast(res.data?.message || 'Failed to update like');
      }
    } catch (err: any) {
      showCustomToast(err.message || 'Something went wrong');
    }
  };

  const handleShareProfile = async () => {
    try {
      const customId = currentProfile?.customId || 'N/A';
      const name = `${currentProfile?.firstName || ''} ${currentProfile?.lastName || ''}`.trim();
      const message = `Check out this profile on Bride & Groom Matrimony!\nName: ${name}\nID: ${customId}\nLink: https://brideandgroom.co.in/profile/${currentProfile?.userId || currentProfile?.id}`;
      
      await Share.share({
        message,
        title: 'Share Profile',
      });
    } catch (error: any) {
      showCustomToast(error.message || 'Failed to share profile');
    }
  };

  const DataRow = ({ label, value }: { label: string; value: any }) => {
    if (value === undefined || value === null || value === '') return null;
    let displayValue =
      typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
    return (
      <View style={styles.dataRow}>
        <Text style={[styles.dataLabel, { color: mutedText }]}>{label}</Text>
        <Text style={[styles.dataValue, { color: textColor }]}>
          {displayValue}
        </Text>
      </View>
    );
  };

  if (!currentProfile) return null;

  // Compute age from dob (timezone-independent)
  const computeAge = (dob: string | null | undefined): number | null => {
    if (!dob) return null;
    const match = dob.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const year = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const day = parseInt(match[3]);
    
    const birthDate = new Date(year, month, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Safe timezone-independent date formatter for DATEONLY strings
  const formatDateString = (dateStr: string | null | undefined): string | null => {
    if (!dateStr) return null;
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const day = parseInt(match[3]);
      return new Date(year, month, day).toLocaleDateString();
    }
    return new Date(dateStr).toLocaleDateString();
  };

  const profileAge = currentProfile.age || computeAge(currentProfile.dob);
  const isOnline = currentProfile.user?.isOnline ?? false;
  const lastSeen = currentProfile.user?.lastSeen
    ? new Date(currentProfile.user.lastSeen).toLocaleString()
    : null;
  const partnerPref = currentProfile.partnerPreference || {};

  return (
    <View style={{ flex: 1, backgroundColor: themeBg }}>
      {/* Sticky Header Buttons */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <ChevronLeft size={28} color="#FFF" />
      </TouchableOpacity>
      <View style={styles.headerActions}>
        <TouchableOpacity style={styles.actionIcon} onPress={handleShareProfile}>
          <Share2 size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionIcon} onPress={() => setShowReportModal(true)}>
          <Flag size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accentGold}
            colors={[accentGold]}
          />
        }
      >
        {/* Header Photo */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              transform: [
                {
                  translateY: scrollY.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [0, 0, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onPhotoScroll}
            scrollEventThrottle={16}
            style={{ width: '100%', height: '100%' }}
          >
            {currentProfile.photosLocked && currentProfile.privacySettings?.photoVisibility !== 'Verified' && currentProfile.privacySettings?.photoVisibility !== 'Selected' ? (
              <Image
                source={{
                  uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${currentProfile.id || 'default'}`,
                }}
                style={{ width, height: 400 }}
                resizeMode="cover"
                blurRadius={Platform.OS === 'ios' ? 25 : 15}
              />
            ) : currentProfile.photos && currentProfile.photos.length > 0 ? (
              currentProfile.photos.map((photo: any, index: number) => {
                const isPhotoLockedForPremium = currentProfile.photosLocked && currentProfile.privacySettings?.photoVisibility === 'Verified';
                const isPhotoLockedForSelected = currentProfile.photosLocked && currentProfile.privacySettings?.photoVisibility === 'Selected';
                const shouldBlurPhoto = isPhotoLockedForPremium || isPhotoLockedForSelected;
                
                const photoSource = photo.url 
                  ? { uri: resolvePhotoUrl(photo.url) }
                  : { uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${currentProfile.id || 'default'}` };
                
                return (
                  <Image
                    key={photo.id || index}
                    source={photoSource}
                    style={{ width, height: 400 }}
                    resizeMode="cover"
                    blurRadius={shouldBlurPhoto ? (Platform.OS === 'ios' ? 25 : 15) : undefined}
                  />
                );
              })
            ) : (
              <Image
                source={{
                  uri: `https://api.dicebear.com/7.x/avataaars/png?seed=${currentProfile.id || 'default'}`,
                }}
                style={{ width, height: 400 }}
                resizeMode="cover"
              />
            )}
          </ScrollView>

          {/* Dots Indicator */}
          {currentProfile.photos && currentProfile.photos.length > 1 && (
            <View style={styles.paginationDots}>
              {currentProfile.photos.map((_: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    activePhotoIndex === index ? styles.activeDot : styles.inactiveDot,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Photos Locked Overlay */}
          {currentProfile.photosLocked && (
            <View style={styles.premiumOverlayFixed}>
              {currentProfile.privacySettings?.photoVisibility === 'Verified' ? (
                <>
                  <Crown size={36} color={palette.gold.main} style={{ marginBottom: 12 }} />
                  <Text style={styles.premiumOverlayText}>
                    Profile Images are visible to premium members only
                  </Text>
                  <TouchableOpacity
                    style={styles.premiumOverlayButton}
                    onPress={() => navigation.navigate("Tabs", { screen: "Premium" })}
                  >
                    <Crown size={16} color="#3B1E54" style={{ marginRight: 6 }} />
                    <Text style={styles.premiumOverlayButtonText}>Purchase Plan</Text>
                  </TouchableOpacity>
                </>
              ) : currentProfile.privacySettings?.photoVisibility === 'Selected' ? (
                <>
                  <Lock size={36} color={palette.gold.main} style={{ marginBottom: 12 }} />
                  <Text style={styles.premiumOverlayText}>
                    Profile Images are visible only to members liked by this user
                  </Text>
                </>
              ) : (
                <>
                  <Lock size={36} color={palette.gold.main} style={{ marginBottom: 12 }} />
                  <Text style={styles.premiumOverlayText}>
                    Profile Images are visible to matches only
                  </Text>
                </>
              )}
            </View>
          )}
        </Animated.View>

        {/* Content */}
        <View style={[styles.contentContainer, { backgroundColor: themeBg, zIndex: 1, elevation: 1 }]}>
          <View style={styles.profileHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={[styles.nameText, { color: textColor }]}>
                  {`${currentProfile.firstName || ''} ${currentProfile.lastName || ''}`.trim()}{profileAge ? `, ${profileAge}` : ''}
                </Text>
                {currentProfile.verificationStatus === 'approved' && (
                  <ShieldCheck size={20} color="#4CAF50" />
                )}
                {currentProfile.isKycVerified && (
                  <View style={{ backgroundColor: '#E8F5E9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 4 }}>
                    <Text style={{ fontSize: 9, ...fonts.bold, color: '#2E7D32' }}>KYC</Text>
                  </View>
                )}
              </View>
              <View style={styles.idTag}>
                <Text style={styles.idText}>
                  ID: {currentProfile.customId || 'N/A'}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <View style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: isOnline ? '#4CAF50' : '#BDBDBD',
                }} />
                <Text style={{ fontSize: 11, ...fonts.semibold, color: isOnline ? '#4CAF50' : mutedText }}>
                  {isOnline ? 'Online' : lastSeen ? `Last seen ${lastSeen}` : 'Offline'}
                </Text>
              </View>
            </View>
            {(currentProfile.isPremium || currentProfile.accountType === 'Premium') && (
              <View
                style={[styles.premiumBadge, { backgroundColor: accentGold }]}
              >
                <Crown size={16} color={deepPurple} />
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
            )}
          </View>

          <View style={[styles.infoGrid, { backgroundColor: cardBg }]}>
            <View style={styles.infoItem}>
              <MapPin size={18} color={accentGold} />
              <Text style={[styles.infoLabel, { color: mutedText }]}>
                Location
              </Text>
              <Text style={[styles.infoValue, { color: textColor }]}>
                {[currentProfile.city, currentProfile.state].filter(Boolean).join(', ') || '—'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Briefcase size={18} color={accentGold} />
              <Text style={[styles.infoLabel, { color: mutedText }]}>
                Profession
              </Text>
              <Text style={[styles.infoValue, { color: textColor }]}>
                {currentProfile.profession || '—'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <User size={18} color={accentGold} />
              <Text style={[styles.infoLabel, { color: mutedText }]}>
                Height
              </Text>
              <Text style={[styles.infoValue, { color: textColor }]}>
                {currentProfile.height || '—'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Languages size={18} color={accentGold} />
              <Text style={[styles.infoLabel, { color: mutedText }]}>
                Language
              </Text>
              <Text style={[styles.infoValue, { color: textColor }]}>
                {currentProfile.motherTongue || '—'}
              </Text>
            </View>
          </View>

          {/* Section: Personal Info */}
          <View style={styles.detailCard}>
            <Text style={[styles.detailCardTitle, { color: deepPurple }]}>
              Personal Details
            </Text>
            <View style={styles.dataGrid}>
              <DataRow label="First Name" value={currentProfile.firstName} />
              <DataRow label="Last Name" value={currentProfile.lastName} />
              <DataRow label="Custom ID" value={currentProfile.customId} />
              <DataRow label="Gender" value={currentProfile.gender} />
              <DataRow
                label="DOB"
                value={formatDateString(currentProfile.dob)}
              />
              <DataRow
                label="Marital Status"
                value={currentProfile.maritalStatus}
              />
              <DataRow label="Created By" value={currentProfile.createdBy} />
            </View>
          </View>

          {/* Section: Physical Appearance & Lifestyle */}
          <View style={styles.detailCard}>
            <Text style={[styles.detailCardTitle, { color: deepPurple }]}>
              Physical & Lifestyle
            </Text>
            <View style={styles.dataGrid}>
              <DataRow label="Height" value={currentProfile.height} />
              <DataRow
                label="Weight"
                value={
                  currentProfile.weight ? `${currentProfile.weight} kg` : null
                }
              />
              <DataRow label="Diet" value={currentProfile.diet} />
              <DataRow label="Smoking" value={currentProfile.smoking} />
              <DataRow label="Drinking" value={currentProfile.drinking} />
              <DataRow
                label="Physical Activity"
                value={currentProfile.activity}
              />
            </View>
          </View>

          {/* Section: Location */}
          <View style={styles.detailCard}>
            <Text style={[styles.detailCardTitle, { color: deepPurple }]}>
              Location Details
            </Text>
            <View style={styles.dataGrid}>
              <DataRow label="Country" value={currentProfile.country} />
              <DataRow label="State" value={currentProfile.state} />
              <DataRow label="City" value={currentProfile.city} />
              <DataRow label="Area" value={currentProfile.area} />
              <DataRow
                label="Open to Relocate"
                value={currentProfile.relocate}
              />
            </View>
          </View>

          {/* Section: Religion & Culture */}
          <View style={styles.detailCard}>
            <Text style={[styles.detailCardTitle, { color: deepPurple }]}>
              Religion & Culture
            </Text>
            <View style={styles.dataGrid}>
              <DataRow label="Religion" value={currentProfile.religion} />
              <DataRow label="Caste" value={currentProfile.caste} />
              <DataRow label="Sub Caste" value={currentProfile.subCaste} />
              <DataRow
                label="Mother Tongue"
                value={currentProfile.motherTongue}
              />
              <DataRow label="Culture" value={currentProfile.culture} />
            </View>
          </View>

          {/* Section: Education & Profession */}
          <View style={styles.detailCard}>
            <Text style={[styles.detailCardTitle, { color: deepPurple }]}>
              Education & Career
            </Text>
            <View style={styles.dataGrid}>
              <DataRow
                label="Highest Degree"
                value={currentProfile.highestDegree}
              />
              <DataRow label="College" value={currentProfile.college} />
              <DataRow label="Profession" value={currentProfile.profession} />
              <DataRow label="Industry" value={currentProfile.industry} />
              <DataRow label="Company" value={currentProfile.company} />
              <DataRow label="Annual Income" value={currentProfile.income} />
            </View>
          </View>

          {/* Section: Family Details */}
          <View style={styles.detailCard}>
            <Text style={[styles.detailCardTitle, { color: deepPurple }]}>
              Family Background
            </Text>
            <View style={styles.dataGrid}>
              <DataRow label="Family Type" value={currentProfile.familyType} />
              <DataRow
                label="Family Location"
                value={currentProfile.familyLocation}
              />
              <DataRow
                label="Father Status"
                value={currentProfile.fatherStatus}
              />
              <DataRow
                label="Mother Status"
                value={currentProfile.motherStatus}
              />
              <DataRow label="Brothers" value={currentProfile.brothers} />
              <DataRow label="Sisters" value={currentProfile.sisters} />
              <DataRow label="Siblings" value={currentProfile.siblings} />
              <DataRow
                label="About Family"
                value={currentProfile.familyAbout}
              />
            </View>
          </View>

          {/* Section: Personal Info & Hobbies */}
          <View style={styles.detailCard}>
            <Text style={[styles.detailCardTitle, { color: deepPurple }]}>
              About & Hobbies
            </Text>
            <View style={styles.dataGrid}>
              <DataRow label="Hobby" value={currentProfile.hobby} />
              <DataRow label="Hobbies List" value={currentProfile.hobbies} />
              <DataRow label="Bio" value={currentProfile.bio} />
            </View>
          </View>

          {/* Section: Horoscope & Astro */}
          <View style={styles.detailCard}>
            <Text style={[styles.detailCardTitle, { color: deepPurple }]}>
              Horoscope & Astro
            </Text>
            <View style={styles.dataGrid}>
              <DataRow label="Zodiac Sign" value={currentProfile.zodiacSign} />
              <DataRow
                label="Horoscope DOB"
                value={formatDateString(currentProfile.horoscopeDob)}
              />
              <DataRow
                label="Horoscope Time"
                value={currentProfile.horoscopeTime}
              />
              <DataRow
                label="Horoscope Place"
                value={currentProfile.horoscopePlace}
              />
            </View>
          </View>

          {/* Section: Partner Preferences (from Profile) */}
          <View style={styles.detailCard}>
            <Text style={[styles.detailCardTitle, { color: deepPurple }]}>
              Partner Preferences
            </Text>
            <View style={styles.dataGrid}>
              <DataRow
                label="Expectations"
                value={currentProfile.expectations}
              />
              <DataRow label="Looking For" value={currentProfile.lookingFor} />
              <DataRow
                label="Preferred Age"
                value={currentProfile.preferredAge}
              />
              <DataRow
                label="Preferred Location"
                value={currentProfile.preferredLocation}
              />
              <DataRow
                label="Deal Breakers"
                value={currentProfile.dealBreakers}
              />
            </View>
          </View>

          {/* Section: Detailed Partner Preferences (from PartnerPreference model) */}
          {(partnerPref.minAge || partnerPref.maxAge || partnerPref.religion || partnerPref.education || partnerPref.incomeRange || partnerPref.country || partnerPref.city) && (
            <View style={styles.detailCard}>
              <Text style={[styles.detailCardTitle, { color: deepPurple }]}>
                Desired Partner Criteria
              </Text>
              <View style={styles.dataGrid}>
                <DataRow
                  label="Age Range"
                  value={
                    partnerPref.minAge || partnerPref.maxAge
                      ? `${partnerPref.minAge || '—'} – ${partnerPref.maxAge || '—'} yrs`
                      : null
                  }
                />
                <DataRow label="Min Height" value={partnerPref.minHeight} />
                <DataRow
                  label="Marital Status"
                  value={
                    Array.isArray(partnerPref.maritalStatus)
                      ? partnerPref.maritalStatus.join(', ')
                      : partnerPref.maritalStatus
                  }
                />
                <DataRow label="Diet" value={partnerPref.diet} />
                <DataRow label="Education" value={partnerPref.education} />
                <DataRow
                  label="Work Sector"
                  value={
                    Array.isArray(partnerPref.workSector)
                      ? partnerPref.workSector.join(', ')
                      : partnerPref.workSector
                  }
                />
                <DataRow label="Income Range" value={partnerPref.incomeRange} />
                <DataRow label="Religion" value={partnerPref.religion} />
                <DataRow label="Caste" value={partnerPref.caste} />
                <DataRow
                  label="Caste No Bar"
                  value={partnerPref.casteNoBar}
                />
                <DataRow label="Mother Tongue" value={partnerPref.motherTongue} />
                <DataRow label="Country" value={partnerPref.country} />
                <DataRow label="City" value={partnerPref.city} />
              </View>
            </View>
          )}

          {/* Section: Additional Info */}
          <View style={styles.detailCard}>
            <Text style={[styles.detailCardTitle, { color: deepPurple }]}>
              Additional Info
            </Text>
            <View style={styles.dataGrid}>
              <DataRow label="Contact Time" value={currentProfile.contactTime} />
              <DataRow label="Verification" value={currentProfile.verificationStatus} />
              <DataRow label="KYC Verified" value={currentProfile.isKycVerified} />
            </View>
          </View>

          {/* Contact Section */}
          <View
            style={[styles.contactSection, { backgroundColor: deepPurple }]}
          >
            <View style={styles.contactHeader}>
              <Phone size={24} color={accentGold} />
              <Text style={styles.contactTitle}>Contact Details</Text>
            </View>

            {contactRevealed ? (
              <View style={styles.revealedContainer}>
                <View style={styles.revealItem}>
                  <Phone size={18} color={accentGold} />
                  <Text style={styles.revealText}>{revealedData?.mobile}</Text>
                </View>
                <View style={styles.revealItem}>
                  <Mail size={18} color={accentGold} />
                  <Text style={styles.revealText}>{revealedData?.email}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.lockedContainer}>
                <Lock
                  size={32}
                  color="rgba(255,255,255,0.3)"
                  style={{ marginBottom: 15 }}
                />
                <Text style={styles.lockedText}>
                  Contact details are locked for privacy
                </Text>

                <TouchableOpacity
                  style={[styles.revealButton, { backgroundColor: accentGold }]}
                  onPress={handleReveal}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={deepPurple} size="small" />
                  ) : (
                    <>
                      <Zap size={18} color={deepPurple} />
                      <Text style={styles.revealButtonText}>
                        Reveal Contact (
                        {subscription?.plan?.maxContacts === -1
                          ? 'Unlimited'
                          : (subscription?.plan?.maxContacts ?? 0) - (subscription?.contactsUsed ?? 0)}{' '}
                        left)
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>



          <View style={{ height: 110 + insets.bottom }} />
        </View>
      </Animated.ScrollView>

      {/* Footer Actions */}
      <View
        style={[
          styles.footer,
          {
            bottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* Chat / Message Button */}
        <TouchableOpacity
          style={[styles.msgButton, { borderColor: deepPurple }]}
          onPress={() => {
            const targetUserId = currentProfile.userId || currentProfile.id;
            if (targetUserId) {
              navigation.navigate('ChatDetail', { userId: targetUserId });
            } else {
              showCustomToast('User ID not found');
            }
          }}
        >
          <MessageCircle size={20} color={deepPurple} />
        </TouchableOpacity>

        {/* Like Button */}
        <TouchableOpacity
          style={[
            styles.msgButton,
            {
              borderColor: currentProfile?.isLiked ? accentGold : deepPurple,
              backgroundColor: currentProfile?.isLiked ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
            },
            !profileFetched && { opacity: 0.5 }
          ]}
          onPress={handleToggleLike}
          disabled={!profileFetched}
          activeOpacity={0.7}
        >
          <ThumbsUp
            size={20}
            color={currentProfile?.isLiked ? accentGold : deepPurple}
            fill={currentProfile?.isLiked ? accentGold : 'none'}
          />
        </TouchableOpacity>

        {/* Shortlist Button */}
        <TouchableOpacity
          style={[
            styles.msgButton,
            {
              borderColor: currentProfile?.isShortlisted ? '#FF3B30' : deepPurple,
              backgroundColor: currentProfile?.isShortlisted ? 'rgba(255, 59, 48, 0.08)' : 'transparent',
            },
            !profileFetched && { opacity: 0.5 }
          ]}
          onPress={handleToggleShortlist}
          disabled={!profileFetched}
          activeOpacity={0.7}
        >
          <Heart
            size={20}
            color={currentProfile?.isShortlisted ? '#FF3B30' : deepPurple}
            fill={currentProfile?.isShortlisted ? '#FF3B30' : 'none'}
          />
        </TouchableOpacity>


        <TouchableOpacity
          style={[
            styles.connectFooterBtn, 
            (currentProfile?.areMatched || currentProfile?.interestStatus === 'accepted')
              ? { backgroundColor: '#4CAF50' } 
              : { backgroundColor: deepPurple },
            (loading || !profileFetched || (currentProfile?.hasSentInterest && currentProfile?.interestStatus !== 'accepted' && !currentProfile?.areMatched)) && { opacity: 0.6 }
          ]}
          onPress={async () => {
            const targetUserId = currentProfile.userId || currentProfile.id;
            if (!targetUserId) {
              showCustomToast('User ID not found');
              return;
            }
            setLoading(true);
            try {
              const res = await sendInterest(targetUserId);
              if (res.data?.success) {
                showCustomToast('Interest request has been successfully sent!');
                setCurrentProfile((prev: any) => ({
                  ...prev,
                  hasSentInterest: true,
                  interestStatus: 'pending',
                }));
              } else {
                showCustomToast(res.data?.message || 'Failed to send interest request');
              }
            } catch (err: any) {
              showCustomToast(
                err.response?.data?.message || err.message || 'Failed to send interest request'
              );
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading || !profileFetched || currentProfile?.hasSentInterest || currentProfile?.areMatched || currentProfile?.interestStatus === 'accepted'}
        >
          {loading || !profileFetched ? (
            <ActivityIndicator color={accentGold} size="small" />
          ) : (
            <Text 
              style={styles.connectFooterText}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {(currentProfile?.areMatched || currentProfile?.interestStatus === 'accepted')
                ? 'ACCEPTED' 
                : currentProfile?.hasSentInterest 
                  ? 'SENT' 
                  : 'INTEREST'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowReportModal(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report suspicious profile</Text>
              <TouchableOpacity onPress={() => setShowReportModal(false)} style={{ padding: 4 }}>
                <X size={20} color={deepPurple} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              contentContainerStyle={styles.modalScroll}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.reasonLabel}>Why are you reporting this profile?</Text>
              <View style={styles.reasonRow}>
                {[
                  'Commercial Matchmaker / Agent',
                  'Fake Profile / Scammer',
                  'Harassment / Abusive behavior',
                  'Inappropriate Content / Photos',
                  'Other',
                ].map((reason) => {
                  const isActive = reportReason === reason;
                  return (
                    <TouchableOpacity
                      key={reason}
                      style={[styles.reasonPill, isActive && styles.reasonPillActive]}
                      onPress={() => setReportReason(reason)}
                    >
                      <Text style={[styles.reasonPillText, isActive && styles.reasonPillTextActive]}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.descLabel}>Tell us more (Optional)</Text>
              <TextInput
                style={styles.descInput}
                placeholder="Please provide details about your report..."
                placeholderTextColor="#A0A0A0"
                multiline
                numberOfLines={4}
                value={reportDescription}
                onChangeText={setReportDescription}
              />

              <Text style={styles.proofLabel}>Attach Proof (Images or PDFs - Max 5)</Text>
              
              {selectedFiles.length > 0 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.fileList}
                >
                  {selectedFiles.map((file, index) => {
                    const isImage = file.type.startsWith('image/');
                    return (
                      <View key={index} style={isImage ? styles.fileThumbnail : styles.fileDocBadge}>
                        {isImage ? (
                          <Image source={{ uri: file.uri }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                        ) : (
                          <>
                            <FileText size={20} color={deepPurple} style={{ alignSelf: 'center' }} />
                            <Text style={styles.fileDocName} numberOfLines={1}>
                              {file.name}
                            </Text>
                          </>
                        )}
                        <TouchableOpacity 
                          style={styles.removeFileBtn} 
                          onPress={() => handleRemoveFile(index)}
                        >
                          <X size={10} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              <View style={styles.proofBtnRow}>
                <TouchableOpacity 
                  style={styles.proofBtn} 
                  onPress={handlePickImage}
                  disabled={selectedFiles.length >= 5}
                >
                  <Plus size={14} color={deepPurple} />
                  <Text style={styles.proofBtnText}>Add Image</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.proofBtn} 
                  onPress={handlePickPDF}
                  disabled={selectedFiles.length >= 5}
                >
                  <Plus size={14} color={deepPurple} />
                  <Text style={styles.proofBtnText}>Add PDF</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.blockRow}>
                <View style={styles.blockTextContainer}>
                  <Text style={styles.blockTitle}>Also block this member</Text>
                  <Text style={styles.blockDesc}>
                    They will not be able to send you messages or view your details anymore.
                  </Text>
                </View>
                <Switch
                  value={alsoBlock}
                  onValueChange={setAlsoBlock}
                  trackColor={{ false: '#767577', true: '#FF3B30' }}
                  thumbColor={alsoBlock ? '#FFF' : '#f4f3f4'}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitModalBtn, reportSubmitting && styles.submitModalBtnDisabled]}
                onPress={handleReportAndBlock}
                disabled={reportSubmitting}
              >
                {reportSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Submit Report</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    height: 400,
    width: '100%',
    position: 'relative',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 20,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  headerActions: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    gap: 12,
    zIndex: 10,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    marginTop: -30,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameText: {
    fontSize: 26,
    ...fonts.bold,
  },
  idTag: {
    marginTop: 4,
  },
  idText: {
    fontSize: 12,
    color: '#888',
    ...fonts.semibold,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  premiumBadgeText: {
    fontSize: 10,
    ...fonts.bold,
    color: '#3B1E54',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 25,
    padding: 15,
    marginBottom: 30,
  },
  infoItem: {
    width: '50%',
    padding: 10,
  },
  infoLabel: {
    fontSize: 10,
    ...fonts.semibold,
    marginTop: 4,
  },
  infoValue: {
    fontSize: 14,
    ...fonts.bold,
    marginTop: 2,
  },
  detailCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#EDE6F5',
  },
  detailCardTitle: {
    fontSize: 16,
    ...fonts.bold,
    marginBottom: 15,
    borderBottomWidth: 1.5,
    borderBottomColor: '#EDE6F5',
    paddingBottom: 8,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dataRow: {
    width: '48%',
    marginBottom: 12,
  },
  dataLabel: {
    fontSize: 10,
    ...fonts.semibold,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dataValue: {
    fontSize: 14,
    ...fonts.semibold,
  },
  contactSection: {
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 25,
  },
  contactTitle: {
    color: '#D4AF37',
    fontSize: 20,
    ...fonts.bold,
  },
  lockedContainer: {
    alignItems: 'center',
    width: '100%',
  },
  lockedText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    ...fonts.semibold,
    marginBottom: 25,
    textAlign: 'center',
  },
  revealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderRadius: 15,
    gap: 10,
    width: '100%',
  },
  revealButtonText: {
    color: '#3B1E54',
    fontSize: 15,
    ...fonts.bold,
  },
  revealedContainer: {
    width: '100%',
    gap: 15,
  },
  revealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 15,
    borderRadius: 15,
  },
  revealText: {
    color: '#FFF',
    fontSize: 16,
    ...fonts.bold,
  },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 8,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  msgButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectFooterBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectFooterText: {
    color: '#D4AF37',
    fontSize: 11,
    ...fonts.bold,
    letterSpacing: 0.5,
  },
  toastContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(59, 30, 84, 0.96)',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#3B1E54',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFF',
    fontSize: 14,
    ...fonts.semibold,
    letterSpacing: 0.3,
  },
  premiumOverlayFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 30, 84, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 2,
  },
  premiumOverlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    ...fonts.semibold,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  premiumOverlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.gold.main,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: palette.gold.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  premiumOverlayButtonText: {
    color: '#3B1E54',
    fontSize: 14,
    ...fonts.bold,
    letterSpacing: 0.5,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderRadius: 15,
    marginTop: 25,
    marginHorizontal: 25,
    backgroundColor: 'rgba(255, 59, 48, 0.05)',
    borderColor: '#FF3B30',
  },
  reportBtnText: {
    color: '#FF3B30',
    fontSize: 15,
    ...fonts.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#EDE6F5',
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    ...fonts.bold,
    color: '#3B1E54',
  },
  modalScroll: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  reasonLabel: {
    fontSize: 14,
    ...fonts.semibold,
    color: '#3B1E54',
    marginBottom: 12,
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  reasonPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 30, 84, 0.04)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reasonPillActive: {
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
  },
  reasonPillText: {
    fontSize: 12,
    ...fonts.semibold,
    color: '#3B1E54',
  },
  reasonPillTextActive: {
    color: '#FF3B30',
  },
  descLabel: {
    fontSize: 14,
    ...fonts.semibold,
    color: '#3B1E54',
    marginBottom: 8,
  },
  descInput: {
    borderWidth: 1.5,
    borderColor: '#EDE6F5',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1A1A1A',
    ...fonts.medium,
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  proofLabel: {
    fontSize: 14,
    ...fonts.semibold,
    color: '#3B1E54',
    marginBottom: 8,
  },
  proofBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  proofBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#3B1E54',
    borderRadius: 12,
    paddingVertical: 10,
    flex: 1,
    backgroundColor: 'rgba(59, 30, 84, 0.02)',
  },
  proofBtnText: {
    fontSize: 12,
    ...fonts.semibold,
    color: '#3B1E54',
    marginLeft: 6,
  },
  fileList: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
    paddingVertical: 5,
  },
  fileThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDE6F5',
    position: 'relative',
  },
  fileDocBadge: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDE6F5',
    backgroundColor: 'rgba(59, 30, 84, 0.05)',
    justifyContent: 'center',
    position: 'relative',
    padding: 4,
  },
  fileDocName: {
    fontSize: 8,
    color: '#3B1E54',
    ...fonts.semibold,
    textAlign: 'center',
    marginTop: 2,
  },
  removeFileBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  blockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
    paddingVertical: 10,
    borderTopWidth: 1.5,
    borderTopColor: '#EDE6F5',
    borderBottomWidth: 1.5,
    borderBottomColor: '#EDE6F5',
  },
  blockTextContainer: {
    flex: 1,
    marginRight: 15,
  },
  blockTitle: {
    fontSize: 14,
    ...fonts.semibold,
    color: '#3B1E54',
  },
  blockDesc: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  submitModalBtn: {
    height: 52,
    borderRadius: 15,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  submitModalBtnText: {
    fontSize: 15,
    ...fonts.bold,
    color: '#FFFFFF',
  },
  submitModalBtnDisabled: {
    opacity: 0.6,
  },
});
