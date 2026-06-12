import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import VideoPlayer from 'react-native-video';
import {
  ArrowLeft, Heart, Play, Pause, User, MapPin, Briefcase, BadgeCheck, Star, MessageCircle, Lock
} from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { fonts } from '@/src/theme';
import { resolvePhotoUrl, getVideoReels, sendInterest, getMySubscription } from '../../services/api';
import { showToast } from '../../utils/toast';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function VideoReelsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [reels, setReels] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pausedMap, setPausedMap] = useState<{ [key: number]: boolean }>({});
  const [interestSentMap, setInterestSentMap] = useState<{ [key: string]: boolean }>({});

  const listRef = useRef<FlatList>(null);

  const [isPremium, setIsPremium] = useState(false);
  const [checkingSub, setCheckingSub] = useState(true);

  useEffect(() => {
    const initScreen = async () => {
      try {
        const subRes = await getMySubscription();
        const premium = !!(subRes.data?.success && subRes.data?.subscription);
        setIsPremium(premium);

        if (premium) {
          const passedReels = route.params?.reels;
          const startIndex = route.params?.startIndex || 0;

          if (passedReels && passedReels.length > 0) {
            setReels(passedReels);
            setActiveIndex(startIndex);
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index: startIndex, animated: false });
            }, 100);
          } else {
            await loadReels();
          }
        }
      } catch (err) {
        console.error("Init VideoReels Screen Error:", err);
      } finally {
        setCheckingSub(false);
      }
    };

    initScreen();
  }, [route.params]);

  const loadReels = async () => {
    setLoading(true);
    try {
      const res = await getVideoReels();
      if (res.data?.success && res.data?.data) {
        setReels(res.data.data);
      } else {
        showToast("No video reels found.");
      }
    } catch (err) {
      console.error("Load Reels Error:", err);
      showToast("Error loading reels.");
    } finally {
      setLoading(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      const index = viewableItems[0].index;
      setActiveIndex(index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80,
  }).current;

  const handleTogglePlay = (index: number) => {
    setPausedMap((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleSendInterest = async (profile: any) => {
    const receiverId = profile.userId || profile.id;
    if (!receiverId) return;

    if (interestSentMap[receiverId]) {
      showToast("Interest already sent to this profile! 💖");
      return;
    }

    try {
      const res = await sendInterest(receiverId);
      if (res.data?.success) {
        setInterestSentMap(prev => ({ ...prev, [receiverId]: true }));
        showToast("Interest Sent successfully! 💖");
      } else {
        showToast(res.data?.message || "Failed to send interest.");
      }
    } catch (err) {
      console.warn("Failed to send interest from reels:", err);
      showToast("Failed to send interest.");
    }
  };

  const handleNavigateProfile = (profile: any) => {
    navigation.navigate('ProfileDetail', { profile });
  };

  const renderReelItem = ({ item, index }: { item: any; index: number }) => {
    const isCurrentActive = activeIndex === index;
    const isPaused = pausedMap[index] || !isCurrentActive || !isFocused;
    const mainPhoto = item.photos?.find((p: any) => p.isMain === true || p.isMain === 1 || p.isMain === "1")?.url || item.photos?.[0]?.url;
    const isInterestSent = interestSentMap[item.userId || item.id] || false;

    return (
      <View style={[styles.reelContainer, { height: height }]}>
        {/* Background Video Player */}
        {item.introVideoUrl ? (
          <TouchableOpacity
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            onPress={() => handleTogglePlay(index)}
          >
            <VideoPlayer
              source={{ uri: resolvePhotoUrl(item.introVideoUrl) }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
              paused={isPaused}
              repeat={true}
              playInBackground={false}
              playWhenInactive={false}
              ignoreSilentSwitch="ignore"
            />
            {/* Dark bottom vignette */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
              style={styles.bottomVignette}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>No video available</Text>
          </View>
        )}

        {/* Top Header Row */}
        <SafeAreaView style={styles.topHeader} edges={['top']}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Video Intros</Text>
          <View style={{ width: 40 }} />
        </SafeAreaView>

        {/* Play/Pause Indicator Overlay */}
        {pausedMap[index] && isCurrentActive && (
          <View style={styles.playPauseOverlay} pointerEvents="none">
            <Play size={48} color="rgba(255, 255, 255, 0.7)" fill="rgba(255, 255, 255, 0.3)" />
          </View>
        )}

        {/* Right Sidebar Controls */}
        <View style={styles.rightSidebar}>
          {/* Avatar Link */}
          <TouchableOpacity
            style={styles.sidebarAvatarWrapper}
            onPress={() => handleNavigateProfile(item)}
            activeOpacity={0.8}
          >
            <Image
              source={{
                uri: resolvePhotoUrl(mainPhoto || `https://api.dicebear.com/7.x/avataaars/png?seed=${item.firstName}`)
              }}
              style={styles.sidebarAvatar}
            />
            <View style={styles.sidebarPlusBadge}>
              <BadgeCheck size={10} color="#FFFFFF" fill={palette.gold.main} />
            </View>
          </TouchableOpacity>

          {/* Quick Connect / Heart Button */}
          <TouchableOpacity
            style={[styles.sidebarBtn, isInterestSent && styles.sidebarBtnConnected]}
            onPress={() => handleSendInterest(item)}
            activeOpacity={0.8}
          >
            <Heart size={26} color={isInterestSent ? '#FFFFFF' : '#FF3B30'} fill={isInterestSent || item.interestSentByMe ? '#FF3B30' : 'none'} />
            <Text style={styles.sidebarBtnLabel}>{isInterestSent ? 'Sent' : 'Connect'}</Text>
          </TouchableOpacity>

          {/* Detailed Profile Icon Button */}
          <TouchableOpacity
            style={styles.sidebarBtn}
            onPress={() => handleNavigateProfile(item)}
            activeOpacity={0.8}
          >
            <User size={26} color="#FFFFFF" />
            <Text style={styles.sidebarBtnLabel}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Left Info Panel */}
        <View style={[styles.bottomInfoPanel, { paddingBottom: insets.bottom + 40 }]}>
          <TouchableOpacity
            onPress={() => handleNavigateProfile(item)}
            activeOpacity={0.8}
            style={styles.infoNameRow}
          >
            <Text style={styles.infoNameText}>
              {item.firstName} {item.lastName || ''}, {item.age || '26'}
            </Text>
            {item.isKycVerified && (
              <BadgeCheck size={18} color={palette.gold.main} fill={palette.gold.main} />
            )}
            {item.isPremium && (
              <View style={styles.premiumBadge}>
                <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.infoMetaRow}>
            <Briefcase size={14} color="rgba(255, 255, 255, 0.8)" style={{ marginRight: 6 }} />
            <Text style={styles.infoMetaText} numberOfLines={1}>
              {item.profession || 'Profession'}{item.highestDegree ? ` • ${item.highestDegree}` : ''}
            </Text>
          </View>

          <View style={styles.infoMetaRow}>
            <MapPin size={14} color="rgba(255, 255, 255, 0.8)" style={{ marginRight: 6 }} />
            <Text style={styles.infoMetaText} numberOfLines={1}>
              {item.city || 'Location'}{item.state ? `, ${item.state}` : ''}
            </Text>
          </View>

          {item.bio ? (
            <Text style={styles.infoBioText} numberOfLines={2}>
              {item.bio}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  if (checkingSub || loading) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color={palette.gold.main} />
        <Text style={styles.loadingText}>
          {checkingSub ? "Checking subscription..." : "Fetching video intros..."}
        </Text>
      </View>
    );
  }

  if (!isPremium) {
    return (
      <View style={styles.paywallContainer}>
        <StatusBar barStyle="light-content" />
        <SafeAreaView style={styles.paywallContent} edges={['top', 'left', 'right', 'bottom']}>
          {/* Back button */}
          <TouchableOpacity style={styles.paywallBackBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.paywallLockCard}>
            <View style={styles.paywallIconOutline}>
              <Lock size={44} color={palette.gold.main} />
            </View>

            <Text style={styles.paywallTitle}>Unlock Video Intros</Text>
            
            <Text style={styles.paywallDescription}>
              Watch short 1-minute visual introductions from matching candidates to quickly understand their style, voice, and expression.
            </Text>

            <View style={styles.paywallBenefits}>
              <View style={styles.paywallBenefitRow}>
                <Star size={18} color={palette.gold.main} />
                <Text style={styles.paywallBenefitText}>3x more profile responses</Text>
              </View>
              <View style={styles.paywallBenefitRow}>
                <Star size={18} color={palette.gold.main} />
                <Text style={styles.paywallBenefitText}>Direct visual compatibility check</Text>
              </View>
              <View style={styles.paywallBenefitRow}>
                <Star size={18} color={palette.gold.main} />
                <Text style={styles.paywallBenefitText}>Available on Diamond & Platinum plans</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.paywallUpgradeBtn}
              onPress={() => {
                navigation.navigate("Tabs", { screen: "Premium" });
              }}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#3B1E54', '#663B8F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.paywallUpgradeBtnGradient}
              >
                <Star size={18} color={palette.gold.main} style={{ marginRight: 8 }} />
                <Text style={styles.paywallUpgradeBtnText}>Upgrade to Premium</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {reels.length > 0 ? (
        <FlatList
          ref={listRef}
          data={reels}
          renderItem={renderReelItem}
          keyExtractor={(item) => item.userId || item.id}
          pagingEnabled={true}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onScrollToIndexFailed={(info) => {
            console.log("Scroll to index failed:", info);
          }}
          getItemLayout={(data, index) => ({
            length: height,
            offset: height * index,
            index,
          })}
        />
      ) : (
        <View style={styles.centeredContainer}>
          <Text style={styles.noReelsText}>No video intros available right now.</Text>
          <TouchableOpacity style={styles.goBackBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.goBackBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
    ...fonts.medium,
  },
  noReelsText: {
    color: '#8E8E93',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    ...fonts.medium,
  },
  goBackBtn: {
    backgroundColor: '#3B1E54',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: palette.gold.main,
  },
  goBackBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    ...fonts.bold,
  },
  reelContainer: {
    width: width,
    backgroundColor: '#000000',
  },
  bottomVignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
  },
  errorContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  errorText: {
    color: '#8E8E93',
    fontSize: 14,
    ...fonts.medium,
  },
  topHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    ...fonts.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  playPauseOverlay: {
    position: 'absolute',
    top: '40%',
    left: '42%',
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightSidebar: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    alignItems: 'center',
    gap: 20,
    zIndex: 10,
  },
  sidebarAvatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  sidebarAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  sidebarPlusBadge: {
    position: 'absolute',
    bottom: -4,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  sidebarBtnConnected: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    paddingVertical: 4,
  },
  sidebarBtnLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    ...fonts.semibold,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomInfoPanel: {
    position: 'absolute',
    left: 16,
    bottom: 0,
    right: 80,
    zIndex: 10,
  },
  infoNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoNameText: {
    color: '#FFFFFF',
    fontSize: 20,
    ...fonts.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D4AF37',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    ...fonts.bold,
  },
  infoMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoMetaText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    ...fonts.medium,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  infoBioText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    lineHeight: 18,
    ...fonts.medium,
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  paywallContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paywallContent: {
    flex: 1,
    width: '100%',
    padding: 24,
    justifyContent: 'center',
    position: 'relative',
  },
  paywallBackBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  paywallLockCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(214, 175, 55, 0.3)',
  },
  paywallIconOutline: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(214, 175, 55, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: palette.gold.main,
  },
  paywallTitle: {
    fontSize: 22,
    ...fonts.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  paywallDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  paywallBenefits: {
    width: '100%',
    backgroundColor: 'rgba(59, 30, 84, 0.2)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(214, 175, 55, 0.15)',
  },
  paywallBenefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paywallBenefitText: {
    fontSize: 13,
    ...fonts.semibold,
    color: '#FFFFFF',
  },
  paywallUpgradeBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
  },
  paywallUpgradeBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  paywallUpgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    ...fonts.bold,
  },
});
