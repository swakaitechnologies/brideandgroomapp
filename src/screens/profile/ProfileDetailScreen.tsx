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
  View as RNView,
  Text as RNText,
  Linking,
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
  Check,
  FileText,
  Plus,
  Play,
  PlayCircle,
  Globe,
  Eye,
  Users,
} from 'lucide-react-native';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';
import { Text, View } from '@/components/Themed';
import { palette } from '../../theme/colors';
import LinearGradient from 'react-native-linear-gradient';
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

const FacebookIcon = ({ size = 18, color = '#1877F2' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      fill={color}
    />
  </Svg>
);

const InstagramIcon = ({ size = 18, color = '#E4405F' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <Rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <Circle cx="12" cy="12" r="4" />
    <Line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </Svg>
);

const LinkedinIcon = ({ size = 18, color = '#0A66C2' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
      fill={color}
    />
  </Svg>
);



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
  const scrollViewRef = React.useRef<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'family' | 'preferences'>('overview');

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
        const data = res.data.data;
        const isMobileUnmasked = data.mobile && data.mobile.trim() !== '' && !data.mobile.startsWith('********') && data.mobile !== 'Hidden';
        const isEmailUnmasked = data.email && data.email.trim() !== '' && !data.email.startsWith('********') && data.email !== 'Hidden';
        if (data.isContactRevealed || isMobileUnmasked || isEmailUnmasked) {
          setContactRevealed(true);
          setRevealedData({
            mobile: data.mobile || 'Verified',
            email: data.email || 'Verified',
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

  const parseArrayOrString = (val: any): string => {
    if (!val) return '';
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return parsed.join(', ');
      } catch {
        // Not a JSON string
      }
      return val;
    }
    return String(val);
  };

  const DataRow = ({ label, value, fullWidth }: { label: string; value: any; fullWidth?: boolean }) => {
    if (value === undefined || value === null || value === '') return null;
    let displayValue =
      typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
    return (
      <View style={[styles.dataRow, fullWidth && { width: '100%' }]}>
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
        ref={scrollViewRef}
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
          
          {/* Quick-Facts Overlap Header Card */}
          <View style={[styles.quickHeaderCard, { backgroundColor: cardBg, borderColor: isDark ? '#333' : '#EDE6F5', shadowColor: deepPurple }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={[styles.nameText, { color: textColor }]}>
                    {`${currentProfile.firstName || ''} ${currentProfile.lastName || ''}`.trim()}{profileAge ? `, ${profileAge}` : ''}
                  </Text>
                  {currentProfile.verificationStatus === 'approved' && (
                    <ShieldCheck size={22} color="#4CAF50" />
                  )}
                  {(currentProfile.isKycVerified || currentProfile.user?.isIdentityVerified) && (
                    <View style={styles.badgeKyc}>
                      <Text style={styles.badgeTextKyc}>KYC</Text>
                    </View>
                  )}
                  {currentProfile.user?.isSocialVerified && (
                    <View style={styles.badgeSocial}>
                      <Text style={styles.badgeTextSocial}>SOCIAL</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.idText, { marginTop: 4 }]}>ID: {currentProfile.customId || 'N/A'}</Text>
              </View>
              {(currentProfile.isPremium || currentProfile.accountType === 'Premium') && (
                <View style={[styles.premiumHeaderBadge, { backgroundColor: accentGold }]}>
                  <Crown size={12} color={deepPurple} />
                  <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                </View>
              )}
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#333' : '#EDE6F5', paddingTop: 10 }}>
              <View style={[styles.statusDot, { backgroundColor: isOnline ? '#4CAF50' : '#BDBDBD' }]} />
              <Text style={{ fontSize: 11, ...fonts.semibold, color: isOnline ? '#4CAF50' : mutedText }}>
                {isOnline ? 'Online Now' : lastSeen ? `Active ${lastSeen}` : 'Offline'}
              </Text>
            </View>
          </View>

          {/* Horizontal Highlights Scroll Chips */}
          <View style={{ marginVertical: 15 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
            >
              {[
                currentProfile.dob && { label: `${profileAge} Years`, icon: <User size={13} color={accentGold} /> },
                currentProfile.height && { label: currentProfile.height, icon: <User size={13} color={accentGold} /> },
                currentProfile.religion && { label: `${currentProfile.religion}${currentProfile.caste ? ` (${currentProfile.caste})` : ''}`, icon: <Globe size={13} color={accentGold} /> },
                currentProfile.profession && { label: currentProfile.profession, icon: <Briefcase size={13} color={accentGold} /> },
                currentProfile.city && { label: currentProfile.city, icon: <MapPin size={13} color={accentGold} /> },
                currentProfile.maritalStatus && { label: currentProfile.maritalStatus, icon: <Heart size={13} color={accentGold} /> },
                currentProfile.motherTongue && { label: currentProfile.motherTongue, icon: <Languages size={13} color={accentGold} /> }
              ].filter(Boolean).map((chip: any, index) => (
                <View key={index} style={[styles.highlightChip, { backgroundColor: cardBg, borderColor: isDark ? '#333' : '#EDE6F5' }]}>
                  {chip.icon}
                  <Text style={[styles.highlightChipText, { color: textColor }]}>{chip.label}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Icon-Based Segmented Tab Navigator */}
          <View style={[styles.tabContainer, { backgroundColor: cardBg, borderColor: isDark ? '#333' : '#EDE6F5' }]}>
            {[
              { id: 'overview', label: 'Overview', icon: <Eye size={16} /> },
              { id: 'personal', label: 'Personal', icon: <User size={16} /> },
              { id: 'family', label: 'Background', icon: <Users size={16} /> },
              { id: 'preferences', label: 'Preferences', icon: <Heart size={16} /> }
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const activeColor = '#FFFFFF';
              const inactiveColor = mutedText;
              const tabIcon = React.cloneElement(tab.icon, { color: isActive ? activeColor : inactiveColor });
              
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tabButton, isActive && { backgroundColor: deepPurple }]}
                  onPress={() => {
                    setActiveTab(tab.id as any);
                    scrollViewRef.current?.scrollTo({ y: 380, animated: true });
                  }}
                >
                  {tabIcon}
                  <Text style={[styles.tabText, { color: isActive ? activeColor : inactiveColor, marginTop: 4 }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Tab Content Rendering */}
          {activeTab === 'overview' && (
            <>
              {/* Section: Profile Trust Score */}
              {currentProfile.trustScore !== undefined && (
                <View style={styles.detailCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 }}>
                    <ShieldCheck size={22} color={palette.gold.main} />
                    <Text style={[styles.detailCardTitle, { color: deepPurple, marginBottom: 0, borderBottomWidth: 0, paddingBottom: 0 }]}>
                      Profile Trust Score
                    </Text>
                    <View style={{
                      backgroundColor: 'rgba(214, 175, 55, 0.1)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 10,
                      marginLeft: 'auto'
                    }}>
                      <Text style={{ fontSize: 13, ...fonts.bold, color: palette.gold.main }}>
                        {currentProfile.trustScore}%
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={{ height: 8, backgroundColor: isDark ? '#333' : '#EDE6F5', borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
                    <View style={{ height: '100%', width: `${currentProfile.trustScore}%`, backgroundColor: palette.gold.main, borderRadius: 4 }} />
                  </View>

                  {/* Checklist Grid */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
                    {[
                      {
                        label: 'KYC Document',
                        verified: !!(currentProfile.isKycVerified || currentProfile.user?.isIdentityVerified)
                      },
                      {
                        label: 'Mobile Number',
                        verified: !!currentProfile.user?.isMobileVerified
                      },
                      {
                        label: 'Email Address',
                        verified: !!currentProfile.user?.isEmailVerified
                      },
                      {
                        label: 'Multiple Photos',
                        verified: !!(currentProfile.photos && currentProfile.photos.length >= 2)
                      },
                      {
                        label: 'Detailed Bio',
                        verified: !!(currentProfile.bio && currentProfile.bio.length >= 100)
                      },
                      {
                        label: 'Social Profiles',
                        verified: !!(currentProfile.user?.isSocialVerified || (currentProfile.socialLinks && Object.keys(currentProfile.socialLinks).length > 0))
                      }
                    ].map((item, index) => (
                      <View
                        key={index}
                        style={{
                          width: '48%',
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: cardBg,
                          padding: 10,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: isDark ? '#333' : '#EDE6F5',
                          gap: 8
                        }}
                      >
                        <View style={{
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          backgroundColor: item.verified ? '#E8F5E9' : '#FFEBEE',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {item.verified ? (
                            <Check size={10} color="#2E7D32" />
                          ) : (
                            <X size={10} color="#C62828" />
                          )}
                        </View>
                        <Text style={{ fontSize: 11, ...fonts.semibold, color: textColor }}>
                          {item.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Section: 15-Sec Intro Video Reel */}
              {currentProfile.introVideoUrl ? (
                subscription ? (
                  <RNView style={[styles.detailCard, { padding: 0, overflow: 'hidden', backgroundColor: 'transparent' }]}>
                    <LinearGradient
                      colors={['#3B1E54', '#D4AF37']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ padding: 1.5, borderRadius: 20 }}
                    >
                      <RNView style={{ backgroundColor: cardBg, borderRadius: 19, padding: 16 }}>
                        <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, backgroundColor: 'transparent' }}>
                          <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'transparent' }}>
                            <PlayCircle size={22} color={palette.gold.main} />
                            <RNText style={[styles.detailCardTitle, { color: deepPurple, marginBottom: 0 }]}>
                              1-Minute Intro Video
                            </RNText>
                          </RNView>
                          <RNView style={{ backgroundColor: 'rgba(214, 175, 55, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                            <RNText style={{ fontSize: 10, ...fonts.bold, color: palette.gold.main }}>PREMIUM REEL</RNText>
                          </RNView>
                        </RNView>

                        <RNText style={{ fontSize: 13, color: mutedText, lineHeight: 18, marginBottom: 16 }}>
                          Watch a short voice/video greeting from this candidate to hear their voice, speech style, and expression.
                        </RNText>

                        <TouchableOpacity
                          style={{
                            height: 180,
                            borderRadius: 12,
                            overflow: 'hidden',
                            position: 'relative',
                            backgroundColor: '#1E1E1E',
                          }}
                          onPress={() => {
                            if (currentProfile.introVideoUrl) {
                              Linking.openURL(currentProfile.introVideoUrl).catch(err => {
                                console.error("Failed to play video:", err);
                              });
                            }
                          }}
                          activeOpacity={0.9}
                        >
                          {/* Placeholder cover image with blur overlay */}
                          <Image
                            source={{
                              uri: resolvePhotoUrl(
                                currentProfile.photos?.find((p: any) => p.isMain === true || p.isMain === 1 || p.isMain === "1")?.url ||
                                currentProfile.photos?.[0]?.url ||
                                `https://api.dicebear.com/7.x/avataaars/png?seed=${currentProfile.email || 'intro'}`
                              )
                            }}
                            style={{ width: '100%', height: '100%', opacity: 0.6 }}
                            blurRadius={10}
                          />

                          {/* Centered Play Button Overlay */}
                          <RNView style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: 'transparent',
                          }}>
                            <RNView style={{
                              width: 60,
                              height: 60,
                              borderRadius: 30,
                              backgroundColor: 'rgba(59, 30, 84, 0.85)',
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderWidth: 2,
                              borderColor: palette.gold.main,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.3,
                              shadowRadius: 6,
                              elevation: 5,
                            }}>
                              <Play size={24} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 3 }} />
                            </RNView>
                            <RNText style={{ color: '#FFFFFF', ...fonts.bold, fontSize: 13, marginTop: 10, textShadowColor: 'rgba(0,0,0,0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
                              Play Intro Video (1 min)
                            </RNText>
                          </RNView>
                        </TouchableOpacity>
                      </RNView>
                    </LinearGradient>
                  </RNView>
                ) : (
                  <RNView style={[styles.detailCard, { padding: 0, overflow: 'hidden', backgroundColor: 'transparent' }]}>
                    <LinearGradient
                      colors={['#E5E5EA', '#8E8E93']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ padding: 1.5, borderRadius: 20 }}
                    >
                      <RNView style={{ backgroundColor: cardBg, borderRadius: 19, padding: 16 }}>
                        <RNView style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, backgroundColor: 'transparent' }}>
                          <RNView style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'transparent' }}>
                            <Lock size={20} color="#8E8E93" />
                            <RNText style={[styles.detailCardTitle, { color: textColor, marginBottom: 0, opacity: 0.7 }]}>
                              Intro Video Locked
                            </RNText>
                          </RNView>
                          <RNView style={{ backgroundColor: 'rgba(142, 142, 147, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                            <RNText style={{ fontSize: 10, ...fonts.bold, color: '#8E8E93' }}>PREMIUM ONLY</RNText>
                          </RNView>
                        </RNView>

                        <RNText style={{ fontSize: 13, color: mutedText, lineHeight: 18, marginBottom: 16 }}>
                          Watch a short voice/video greeting from this candidate to hear their voice, speech style, and expression.
                        </RNText>

                        <TouchableOpacity
                          style={{
                            height: 180,
                            borderRadius: 12,
                            overflow: 'hidden',
                            position: 'relative',
                            backgroundColor: '#1E1E1E',
                          }}
                          onPress={() => {
                            navigation.navigate("Tabs", { screen: "Premium" });
                          }}
                          activeOpacity={0.9}
                        >
                          {/* Blurred placeholder cover image */}
                          <Image
                            source={{
                              uri: resolvePhotoUrl(
                                currentProfile.photos?.find((p: any) => p.isMain === true || p.isMain === 1 || p.isMain === "1")?.url ||
                                currentProfile.photos?.[0]?.url ||
                                `https://api.dicebear.com/7.x/avataaars/png?seed=${currentProfile.email || 'intro'}`
                              )
                            }}
                            style={{ width: '100%', height: '100%', opacity: 0.3 }}
                            blurRadius={15}
                          />

                          {/* Centered Lock Overlay */}
                          <RNView style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            justifyContent: 'center',
                            alignItems: 'center',
                            backgroundColor: 'rgba(0,0,0,0.4)',
                          }}>
                            <RNView style={{
                              width: 60,
                              height: 60,
                              borderRadius: 30,
                              backgroundColor: 'rgba(59, 30, 84, 0.9)',
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderWidth: 2,
                              borderColor: palette.gold.main,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.3,
                              shadowRadius: 6,
                              elevation: 5,
                            }}>
                              <Lock size={24} color={palette.gold.main} />
                            </RNView>
                            <RNText style={{ color: '#FFFFFF', ...fonts.bold, fontSize: 13, marginTop: 10 }}>
                              Play Intro Video (Locked)
                            </RNText>
                            <RNText style={{ color: palette.gold.main, ...fonts.medium, fontSize: 11, marginTop: 4 }}>
                              Upgrade to Premium to Unlock
                            </RNText>
                          </RNView>
                        </TouchableOpacity>
                      </RNView>
                    </LinearGradient>
                  </RNView>
                )
              ) : null}

              {/* Section: Personal Info & Hobbies */}
              <View style={styles.detailCard}>
                <Text style={[styles.detailCardTitle, { color: deepPurple }]}>
                  About & Hobbies
                </Text>
                <View style={styles.dataGrid}>
                  <DataRow label="Hobby" value={currentProfile.hobby} fullWidth={true} />
                  <DataRow label="Hobbies List" value={currentProfile.hobbies} fullWidth={true} />
                  <DataRow label="Bio" value={currentProfile.bio} fullWidth={true} />
                </View>
              </View>

              {/* Contact Section */}
              <View style={{ marginVertical: 10 }}>
                {contactRevealed ? (
                  <View style={[styles.contactSection, { backgroundColor: deepPurple }]}>
                    <View style={styles.contactHeader}>
                      <Phone size={24} color={accentGold} />
                      <Text style={styles.contactTitle}>Contact Details</Text>
                    </View>
                    <View style={styles.revealedContainer}>
                      <View style={styles.revealItem}>
                        <Phone size={18} color={accentGold} />
                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.revealText}>{revealedData?.mobile}</Text>
                          <View style={{
                            backgroundColor: currentProfile.user?.isMobileVerified ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6
                          }}>
                            <Text style={{ fontSize: 9, ...fonts.bold, color: currentProfile.user?.isMobileVerified ? '#4CAF50' : '#FF9800' }}>
                              {currentProfile.user?.isMobileVerified ? 'VERIFIED' : 'PENDING'}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View style={styles.revealItem}>
                        <Mail size={18} color={accentGold} />
                        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.revealText}>{revealedData?.email}</Text>
                          <View style={{
                            backgroundColor: currentProfile.user?.isEmailVerified ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6
                          }}>
                            <Text style={{ fontSize: 9, ...fonts.bold, color: currentProfile.user?.isEmailVerified ? '#4CAF50' : '#FF9800' }}>
                              {currentProfile.user?.isEmailVerified ? 'VERIFIED' : 'PENDING'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {(currentProfile.user?.nomineeName || currentProfile.user?.nomineeContact) && (
                        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 15, marginTop: 5 }}>
                          <Text style={{ color: accentGold, fontSize: 13, ...fonts.bold, marginBottom: 10 }}>Nominee Contact Details</Text>
                          {currentProfile.user?.nomineeName ? (
                            <View style={[styles.revealItem, { backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 8 }]}>
                              <User size={18} color={accentGold} />
                              <Text style={styles.revealText}>{currentProfile.user?.nomineeName}</Text>
                            </View>
                          ) : null}
                          {currentProfile.user?.nomineeContact ? (
                            <View style={[styles.revealItem, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                              <Phone size={18} color={accentGold} />
                              <Text style={styles.revealText}>{currentProfile.user?.nomineeContact}</Text>
                            </View>
                          ) : null}
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <LinearGradient
                    colors={['#3B1E54', '#8C52FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.premiumLockCard}
                  >
                    <View style={styles.premiumLockInner}>
                      <View style={styles.lockIconCircle}>
                        <Lock size={26} color={accentGold} />
                      </View>
                      <Text style={styles.premiumLockTitle}>Contact Details Secured</Text>
                      <Text style={styles.premiumLockDesc}>
                        Upgrade your plan or use a premium reveal key to unlock verified mobile number and email.
                      </Text>
                      <TouchableOpacity
                        style={[styles.premiumRevealBtn, { backgroundColor: accentGold }]}
                        onPress={handleReveal}
                        disabled={loading}
                      >
                        {loading ? (
                          <ActivityIndicator color={deepPurple} size="small" />
                        ) : (
                          <>
                            <Zap size={16} color={deepPurple} />
                            <Text style={styles.premiumRevealBtnText}>
                              Reveal Contact (Remaining: {subscription?.plan?.maxContacts === -1
                                ? 'Unlimited'
                                : (subscription?.plan?.maxContacts ?? 0) - (subscription?.contactsUsed ?? 0)} left)
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                )}
              </View>

              {/* Section: Social Profiles */}
              {currentProfile.socialLinks && Object.values(currentProfile.socialLinks).some(Boolean) && (
                <View style={[styles.detailCard, { marginTop: 20 }]}>
                  <Text style={[styles.detailCardTitle, { color: deepPurple }]}>
                    Social Profiles
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 15, flexWrap: 'wrap', marginTop: 5 }}>
                    {Object.entries(currentProfile.socialLinks).map(([key, value]) => {
                      if (!value || typeof value !== 'string' || value.trim() === '') return null;
                      let iconElement = <Globe size={18} color="#333" />;
                      const label = key.toUpperCase();
                      
                      if (key.toLowerCase().includes('facebook')) {
                        iconElement = <FacebookIcon size={18} color="#1877F2" />;
                      } else if (key.toLowerCase().includes('instagram')) {
                        iconElement = <InstagramIcon size={18} color="#E4405F" />;
                      } else if (key.toLowerCase().includes('linkedin')) {
                        iconElement = <LinkedinIcon size={18} color="#0A66C2" />;
                      }
                      
                      return (
                        <TouchableOpacity
                          key={key}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: cardBg,
                            borderWidth: 1.5,
                            borderColor: isDark ? '#333' : '#EDE6F5',
                            paddingVertical: 10,
                            paddingHorizontal: 16,
                            borderRadius: 14,
                            gap: 8,
                          }}
                          onPress={() => {
                            const url = value.startsWith('http') ? value : `https://${value}`;
                            Linking.openURL(url).catch(err => {
                              console.error("Failed to open link:", err);
                            });
                          }}
                        >
                          {iconElement}
                          <Text style={{ fontSize: 13, ...fonts.bold, color: textColor }}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          )}

          {activeTab === 'personal' && (
            <>
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
            </>
          )}

          {activeTab === 'family' && (
            <>
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
                    fullWidth={true}
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
                  <DataRow label="Family Values" value={currentProfile.familyValues} />
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
            </>
          )}

          {activeTab === 'preferences' && (
            <>
              {/* Section: Partner Preferences */}
              <View style={styles.detailCard}>
                <Text style={[styles.detailCardTitle, { color: deepPurple }]}>
                  Partner Preferences
                </Text>
                <View style={styles.dataGrid}>
                  <DataRow
                    label="Expectations"
                    value={currentProfile.expectations}
                    fullWidth={true}
                  />
                  <DataRow label="Looking For" value={currentProfile.lookingFor} fullWidth={true} />
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
                    fullWidth={true}
                  />
                </View>
              </View>

              {/* Section: Desired Partner Criteria */}
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
                      value={parseArrayOrString(partnerPref.maritalStatus)}
                    />
                    <DataRow label="Diet" value={partnerPref.diet} />
                    <DataRow label="Education" value={partnerPref.education} />
                    <DataRow
                      label="Work Sector"
                      value={parseArrayOrString(partnerPref.workSector)}
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
            </>
          )}

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
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
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
    paddingBottom: 10,
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
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    marginVertical: 15,
    padding: 4,
    borderWidth: 1.5,
    justifyContent: 'space-between',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: {
    fontSize: 10,
    ...fonts.bold,
  },
  quickHeaderCard: {
    marginTop: -40,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  badgeKyc: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeTextKyc: {
    fontSize: 10,
    ...fonts.bold,
    color: '#2E7D32',
  },
  badgeSocial: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeTextSocial: {
    fontSize: 10,
    ...fonts.bold,
    color: '#1976D2',
  },
  premiumHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  highlightChipText: {
    fontSize: 11,
    ...fonts.bold,
  },
  premiumLockCard: {
    borderRadius: 24,
    padding: 2,
    overflow: 'hidden',
    shadowColor: '#3B1E54',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  premiumLockInner: {
    backgroundColor: 'rgba(59, 30, 84, 0.9)',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
  },
  lockIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  premiumLockTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    ...fonts.bold,
    textAlign: 'center',
    marginBottom: 8,
  },
  premiumLockDesc: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  premiumRevealBtn: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  premiumRevealBtnText: {
    fontSize: 12,
    ...fonts.bold,
    color: '#3B1E54',
  },
});
