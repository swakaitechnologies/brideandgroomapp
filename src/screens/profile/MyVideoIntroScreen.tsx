import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  PermissionsAndroid,
  Linking,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft, Video, Trash2, Play, Pause,
  ShieldAlert, Check, X, Camera, Info, Sparkles, Lock, ShieldCheck, Clock, Gift
} from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { getProfile, getMySubscription, uploadIntroVideo, deleteIntroVideo } from '../../services/api';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { showToast } from '../../utils/toast';
import { fonts } from '@/src/theme';
import LinearGradient from 'react-native-linear-gradient';
import VideoPlayer from 'react-native-video';

const { width } = Dimensions.get('window');

export default function MyVideoIntroScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isDark = false;

  // Theme styling tokens
  const themeBg = isDark ? '#0A0A0A' : '#F8F7FF';
  const cardBg = isDark ? '#1A1A1A' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#3B1E54';
  const mutedText = isDark ? '#AAAAAA' : '#7E6B8F';
  const accentGold = palette.gold.main;
  const deepPurple = '#3B1E54';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [hasVideoIntroFeature, setHasVideoIntroFeature] = useState(false);
  const [videoPaused, setVideoPaused] = useState(true);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkEligibility(false);
    setRefreshing(false);
  }, []);

  const checkEligibility = async (showScreenLoader = true) => {
    try {
      if (showScreenLoader) {
        setLoading(true);
      }
      const [profileRes, subRes] = await Promise.all([
        getProfile(),
        getMySubscription()
      ]);

      if (profileRes.data.success) {
        setProfile(profileRes.data.data);
      }

      if (subRes.data.success && subRes.data.subscription) {
        setSubscription(subRes.data.subscription);
        const plan = subRes.data.subscription.plan;
        const features = plan && Array.isArray(plan.features) ? plan.features : [];
        if (features.includes('video_intro')) {
          setHasVideoIntroFeature(true);
        } else {
          setHasVideoIntroFeature(false);
        }
      } else {
        setSubscription(null);
        setHasVideoIntroFeature(false);
      }
    } catch (error) {
      console.error("Check Video Eligibility Error:", error);
      showToast("Error checking subscription status.");
    } finally {
      if (showScreenLoader) {
        setLoading(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkEligibility();
    }, [])
  );

  const handleUploadFile = async (asset: any) => {
    setUploading(true);
    try {
      const formData = new FormData();
      const fileData = {
        uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
        type: asset.type || 'video/mp4',
        name: asset.fileName || `video_${Date.now()}.mp4`,
      };

      formData.append('video', fileData as any);

      const response = await uploadIntroVideo(formData);
      if (response.data.success) {
        showToast("Video uploaded and is pending moderation review.");
        await checkEligibility();
      } else {
        showToast(response.data.message || "Failed to upload video.");
      }
    } catch (error: any) {
      console.error("Upload video error:", error);
      showToast("Failed to upload video. Ensure it is a valid format.");
    } finally {
      setUploading(false);
    }
  };

  const handleLaunchCamera = async () => {
    if (Platform.OS === 'android') {
      try {
        const hasCameraPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (!hasCameraPermission) {
          const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
          if (status !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert("Permission Denied", "Camera permission is required to record video. Please enable it in Settings.");
            return;
          }
        }
      } catch (err) {
        console.warn("Camera permission check error:", err);
      }
    }

    try {
      const result = await launchCamera({
        mediaType: 'video',
        videoQuality: 'high',
        durationLimit: 15,
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert("Error", result.errorMessage || "Camera error occurred.");
        return;
      }

      const asset = result.assets?.[0];
      if (asset) {
        await handleUploadFile(asset);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not access camera.");
    }
  };

  const handleLaunchLibrary = async () => {
    if (Platform.OS === 'android') {
      try {
        let hasStoragePermission = false;
        let storagePermissionString = '';
        if (Number(Platform.Version) < 33) {
          storagePermissionString = PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;
        } else {
          storagePermissionString = (PermissionsAndroid.PERMISSIONS as any).READ_MEDIA_VIDEO || 'android.permission.READ_MEDIA_VIDEO';
        }

        hasStoragePermission = await PermissionsAndroid.check(storagePermissionString as any);
        if (!hasStoragePermission) {
          const status = await PermissionsAndroid.request(storagePermissionString as any);
          if (status !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert("Permission Denied", "Storage permission is required to select video. Please enable it in Settings.");
            return;
          }
        }
      } catch (err) {
        console.warn("Storage permission check error:", err);
      }
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'video',
        videoQuality: 'high',
      });

      if (result.didCancel) return;
      if (result.errorCode) {
        Alert.alert("Error", result.errorMessage || "Gallery error occurred.");
        return;
      }

      const asset = result.assets?.[0];
      if (asset) {
        await handleUploadFile(asset);
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not access gallery.");
    }
  };

  const handleDeleteVideo = () => {
    Alert.alert(
      "Delete Video Intro",
      "Are you sure you want to remove your video introduction reel?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              const res = await deleteIntroVideo();
              if (res.data.success) {
                showToast("Video deleted successfully.");
                await checkEligibility();
              } else {
                showToast(res.data.message || "Failed to delete video.");
              }
            } catch (err) {
              console.error("Delete video intro error:", err);
              showToast("Failed to delete video intro.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: themeBg }]}>
        <ActivityIndicator size="large" color={palette.purple.deep} />
      </View>
    );
  }

  // 1. Locked Feature State: Redirect user to Premium Plans
  if (!hasVideoIntroFeature) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeBg }]} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBarBtn}>
            <ArrowLeft size={22} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: textColor }]}>Video Intro Reel</Text>
          <View style={styles.topBarBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.lockedScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[palette.purple.deep]}
              tintColor={palette.purple.deep}
            />
          }
        >
          <View style={styles.lockedCard}>
            <View style={styles.iconOutline}>
              <Lock size={44} color={accentGold} />
            </View>

            <Text style={[styles.lockedTitle, { color: textColor }]}>Premium Feature Locked</Text>
            
            <Text style={styles.lockedDescription}>
              Upload a short 15-second voice/video greeting to stand out! Visual intros instantly build compatibility by letting others see your style, posture, and speech.
            </Text>

            <View style={styles.benefitsContainer}>
              <View style={styles.benefitRow}>
                <Sparkles size={18} color={accentGold} />
                <Text style={[styles.benefitText, { color: textColor }]}>3x More Profile Interactions</Text>
              </View>
              <View style={styles.benefitRow}>
                <Sparkles size={18} color={accentGold} />
                <Text style={[styles.benefitText, { color: textColor }]}>Instantly Verifies Profile Trust</Text>
              </View>
              <View style={styles.benefitRow}>
                <Sparkles size={18} color={accentGold} />
                <Text style={[styles.benefitText, { color: textColor }]}>Celestial Premium Diamond & Platinum Exclusive</Text>
              </View>
            </View>

            {/* Referral Promotion Callout */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(214, 175, 55, 0.08)',
              padding: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(214, 175, 55, 0.3)',
              marginBottom: 20,
              width: '100%',
              gap: 10
            }}>
              <Gift size={22} color="#D4AF37" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, ...fonts.bold, color: textColor }}>Get Premium Free!</Text>
                <Text style={{ fontSize: 11, color: mutedText, marginTop: 2 }}>
                  Invite a friend using your referral code and get 15 days of free Premium!
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate("ReferralDashboard")}
                style={{
                  backgroundColor: '#3B1E54',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 11, ...fonts.bold }}>Invite</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: deepPurple }]}
              onPress={() => navigation.navigate("Tabs", { screen: "Premium" })}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#3B1E54', '#663B8F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBtn}
              >
                <Sparkles size={18} color={accentGold} style={{ marginRight: 8 }} />
                <Text style={styles.upgradeBtnText}>Upgrade to Premium</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 2. Active Premium Feature State
  const hasVideo = !!profile?.introVideoUrl;
  const status = profile?.introVideoStatus || 'pending';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeBg }]} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.topBarBtn}>
          <ArrowLeft size={22} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: textColor }]}>My Video Intro</Text>
        <View style={styles.topBarBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[palette.purple.deep]}
            tintColor={palette.purple.deep}
          />
        }
      >
        {/* Status Badge */}
        {hasVideo && (
          <View style={styles.statusSection}>
            {status === 'pending' && (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 179, 0, 0.12)', borderColor: '#FFA000', borderWidth: 1 }]}>
                <Clock size={16} color="#FFA000" />
                <Text style={[styles.statusText, { color: '#E65100' }]}>Moderation Pending Review</Text>
              </View>
            )}
            {status === 'approved' && (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(76, 175, 80, 0.12)', borderColor: '#4CAF50', borderWidth: 1 }]}>
                <ShieldCheck size={16} color="#4CAF50" />
                <Text style={[styles.statusText, { color: '#2E7D32' }]}>Approved & Active on Profile</Text>
              </View>
            )}
            {status === 'rejected' && (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(244, 67, 54, 0.12)', borderColor: '#F44336', borderWidth: 1 }]}>
                <ShieldAlert size={16} color="#F44336" />
                <Text style={[styles.statusText, { color: '#C62828' }]}>Rejected - Does not meet guidelines</Text>
              </View>
            )}
          </View>
        )}

        {/* Video Player / Placeholder */}
        <View style={[styles.videoContainer, { backgroundColor: cardBg, borderColor: '#E8E0F0', borderWidth: 1 }]}>
          {hasVideo ? (
            <View style={styles.videoPlayerWrapper}>
              <VideoPlayer
                source={{ uri: profile.introVideoUrl }}
                style={styles.nativeVideoPlayer}
                controls={true}
                resizeMode="contain"
                paused={videoPaused}
                onEnd={() => setVideoPaused(true)}
              />
              {videoPaused && (
                <TouchableOpacity
                  style={styles.playOverlayBtn}
                  onPress={() => setVideoPaused(false)}
                >
                  <Play size={32} color="#FFFFFF" fill="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.placeholderWrapper}>
              <Video size={48} color={mutedText} />
              <Text style={[styles.placeholderTitle, { color: textColor }]}>No Intro Video Yet</Text>
              <Text style={styles.placeholderSubtitle}>
                Record or upload a short 15-second voice/video introduction story on your profile.
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {uploading ? (
          <View style={styles.uploadingBox}>
            <ActivityIndicator size="small" color={deepPurple} />
            <Text style={[styles.uploadingText, { color: textColor }]}>Optimizing & Uploading Video...</Text>
          </View>
        ) : (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.primaryActionBtn, { backgroundColor: deepPurple }]}
              onPress={handleLaunchCamera}
              activeOpacity={0.8}
            >
              <Camera size={20} color="#FFFFFF" />
              <Text style={styles.primaryActionBtnText}>Record 15s Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.secondaryActionBtn, { borderColor: deepPurple, borderWidth: 1.5 }]}
              onPress={handleLaunchLibrary}
              activeOpacity={0.8}
            >
              <Video size={20} color={deepPurple} />
              <Text style={[styles.secondaryActionBtnText, { color: deepPurple }]}>Select From Gallery</Text>
            </TouchableOpacity>

            {hasVideo && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteActionBtn]}
                onPress={handleDeleteVideo}
                activeOpacity={0.8}
              >
                <Trash2 size={20} color="#E53935" />
                <Text style={styles.deleteActionBtnText}>Remove Video</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Guidelines section */}
        <View style={[styles.guidelinesCard, { backgroundColor: cardBg }]}>
          <View style={styles.guidelinesHeader}>
            <Info size={16} color={accentGold} />
            <Text style={[styles.guidelinesTitle, { color: textColor }]}>Moderation Guidelines</Text>
          </View>
          <Text style={styles.guidelinesText}>
            • Video must be strictly under 15 seconds.{'\n'}
            • Speak clearly and present yourself confidently.{'\n'}
            • Ensure good lighting and a quiet background.{'\n'}
            • Inappropriate language, commercial advertisements, or phone numbers in the recording will result in immediate rejection.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 30, 84, 0.08)',
    backgroundColor: '#FFFFFF',
  },
  topBarBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    ...fonts.bold,
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 40,
  },
  statusSection: {
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 13,
    ...fonts.semibold,
  },
  videoContainer: {
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 25,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  videoPlayerWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#000000',
  },
  nativeVideoPlayer: {
    width: '100%',
    height: '100%',
  },
  playOverlayBtn: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 64,
    height: 64,
    borderRadius: 32,
    marginTop: -32,
    marginLeft: -32,
    backgroundColor: 'rgba(59, 30, 84, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D4AF37',
  },
  placeholderWrapper: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  placeholderTitle: {
    fontSize: 18,
    ...fonts.bold,
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderSubtitle: {
    fontSize: 13,
    color: '#7E6B8F',
    textAlign: 'center',
    lineHeight: 18,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 25,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryActionBtn: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...fonts.bold,
  },
  secondaryActionBtn: {
    backgroundColor: 'transparent',
  },
  secondaryActionBtnText: {
    fontSize: 15,
    ...fonts.bold,
  },
  deleteActionBtn: {
    backgroundColor: 'rgba(229, 57, 53, 0.08)',
    marginTop: 8,
  },
  deleteActionBtnText: {
    color: '#E53935',
    fontSize: 15,
    ...fonts.bold,
  },
  uploadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8E0F0',
    marginBottom: 25,
  },
  uploadingText: {
    fontSize: 14,
    ...fonts.semibold,
  },
  guidelinesCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 30, 84, 0.06)',
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  guidelinesTitle: {
    fontSize: 14,
    ...fonts.bold,
  },
  guidelinesText: {
    fontSize: 12,
    color: '#7E6B8F',
    lineHeight: 18,
  },
  lockedScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  lockedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 30, 84, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconOutline: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(214, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#D4AF37',
  },
  lockedTitle: {
    fontSize: 22,
    ...fonts.bold,
    textAlign: 'center',
    marginBottom: 12,
  },
  lockedDescription: {
    fontSize: 14,
    color: '#7E6B8F',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  benefitsContainer: {
    width: '100%',
    backgroundColor: '#F9F7FF',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitText: {
    fontSize: 13,
    ...fonts.semibold,
  },
  upgradeBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...fonts.bold,
  },
});
