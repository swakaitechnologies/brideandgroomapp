import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Platform,
  Modal,
  PermissionsAndroid,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { palette } from "../../theme/colors";
import LottieView from "lottie-react-native";
import LinearGradient from "react-native-linear-gradient";
import {
  Edit2,
  Play,
  ChevronRight,
  Crown,
  Clock,
  Sparkles,
  ShieldCheck,
  BadgeCheck,
  AlertCircle,
  Users,
  Eye,
  Ban,
} from "lucide-react-native";
import {
  getDailyPicks,
  getAllProfiles,
  getProfileViewers,
  getProfile,
  getBanners,
  resolvePhotoUrl,
  getKYCStatus,
  getMySubscription,
} from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProfileCard } from "../../components/ProfileCard";
import PermissionsModal from "../../components/PermissionsModal";
import SideDrawer from "../../components/SideDrawer";
import { Skeleton } from "../../components/Skeleton";
import Svg, { Circle } from "react-native-svg";
import { PremiumProfileCard } from "../../components/PremiumProfileCard";
import { fonts } from "@/src/theme";

const { width } = Dimensions.get("window");

// Helper: Get time-of-day greeting
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
};

// Helper: Format relative time
const getRelativeTime = (dateStr: string): string => {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
};

// Mini progress ring component
const ProgressRing = ({ progress, size = 48, strokeWidth = 4, color = palette.gold.main }: { progress: number; size?: number; strokeWidth?: number; color?: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotateZ: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(212, 175, 55, 0.15)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, ...fonts.bold, color }}>{progress}%</Text>
      </View>
    </View>
  );
};

export default function HomeScreen({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useSelector((state: any) => state.auth);
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + 80;
  // Default isDark logic
  const isDark = false;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [premiumMatches, setPremiumMatches] = useState<any[]>([]);
  const [newMatches, setNewMatches] = useState<any[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Theme-aware colors
  const themeBg = isDark ? "#0F0F0F" : "#FFFFFF";
  const textColor = isDark ? "#F0F0F0" : "#1A1A1A";
  const mutedText = isDark ? "#A0A0A0" : "#8E8E93";
  const accentColor = palette.gold.main;
  const deepPurple = "#3B1E54";

  const fetchData = async () => {
    try {
      const [premiumRes, newRes, visitorsRes, profileRes, bannerRes, kycRes, subRes] =
        await Promise.all([
          getDailyPicks().catch(() => null),
          getAllProfiles().catch(() => null),
          getProfileViewers().catch(() => null),
          getProfile().catch(() => null),
          getBanners().catch(() => null),
          getKYCStatus().catch(() => null),
          getMySubscription().catch(() => null),
        ]);

      if (premiumRes?.data?.data || newRes?.data?.data) {
        const premiumData = premiumRes?.data?.data || [];
        const newData = newRes?.data?.data || [];
        const allFetchedProfiles = [
          ...premiumData,
          ...newData
        ];
        const uniqueProfiles = Array.from(new Map(allFetchedProfiles.map((p: any) => [p.userId || p.id, p])).values());
        const premiumOnly = uniqueProfiles.filter((p: any) => p.isPremium === true || p.accountType === 'Premium');
        setPremiumMatches(premiumOnly);
      }

      if (newRes?.data?.data) {
        setNewMatches(newRes.data.data);
      }
      if (visitorsRes?.data?.data) {
        setRecentVisitors(visitorsRes.data.data);
      }
      if (profileRes?.data?.data) {
        setUserProfile(profileRes.data.data);
      }
      if (bannerRes?.data?.data) {
        setBanners(bannerRes.data.data);
      }

      if (kycRes?.data) {
        if (kycRes.data.success && kycRes.data.data) {
          setKycStatus(kycRes.data.data);
        } else if (!kycStatus) {
          setKycStatus({ status: 'not_submitted', selfieStatus: 'not_submitted' });
        }
      }

      if (subRes?.data) {
        if (subRes.data.success && subRes.data.subscription) {
          setSubscription(subRes.data.subscription);
        } else if (!subscription) {
          setSubscription(null);
        }
      }
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Show permissions modal if any of gallery, camera, or location is not granted
  useEffect(() => {
    const checkPermissionsStatus = async () => {
      if (Platform.OS !== "android") return;

      try {
        const hasCamera = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        const hasLocation = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);

        let hasStorage = false;
        if (Number(Platform.Version) < 33) {
          hasStorage = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        } else {
          const readMediaImagesPermission = (PermissionsAndroid.PERMISSIONS as any).READ_MEDIA_IMAGES || "android.permission.READ_MEDIA_IMAGES";
          hasStorage = await PermissionsAndroid.check(readMediaImagesPermission);
        }

        if (!hasCamera || !hasLocation || !hasStorage) {
          setShowPermissions(true);
        }
      } catch (err) {
        console.warn("Error checking permissions:", err);
      }
    };

    const timer = setTimeout(() => {
      checkPermissionsStatus();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Check if first-time registration to show celebration onboarding modal
  useEffect(() => {
    const checkRegistrationCelebration = async () => {
      try {
        const isNewReg = await AsyncStorage.getItem("isNewRegistration");
        if (isNewReg === "true") {
          setShowCelebration(true);
          await AsyncStorage.removeItem("isNewRegistration");
        }
      } catch (err) {
        console.warn("Error reading registration flag:", err);
      }
    };
    checkRegistrationCelebration();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themeBg }} edges={["left", "right"]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: topPadding, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header/Hero Flat Skeleton */}
          <View style={styles.headerFlat}>
            <View style={styles.headerLeft}>
              <Skeleton width={100} height={14} style={{ marginBottom: 8 }} />
              <Skeleton width={180} height={22} style={{ marginBottom: 8 }} />
              <Skeleton width={80} height={14} />
            </View>
            <Skeleton width={70} height={70} borderRadius={35} />
          </View>

          {/* Quick Stats Panel Skeleton */}
          <View style={[styles.statsPanel, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', marginVertical: 10 }]}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                <Skeleton width={40} height={18} style={{ marginBottom: 6 }} />
                <Skeleton width={60} height={10} />
              </View>
            ))}
          </View>

          {/* Premium Banner Skeleton */}
          <View style={{ marginHorizontal: 20, marginVertical: 10 }}>
            <Skeleton width="100%" height={60} borderRadius={16} />
          </View>

          {/* Banner Carousel Skeleton */}
          <View style={[styles.bannerContainer, { marginHorizontal: 20, marginVertical: 10 }]}>
            <Skeleton width="100%" height={120} borderRadius={16} />
          </View>

          {/* Section: Premium Picks Skeleton */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ gap: 6 }}>
                <Skeleton width={120} height={20} />
                <Skeleton width={200} height={12} />
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <View key={i} style={{ marginRight: 16, width: 220, height: 280, borderRadius: 16, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', padding: 12, borderColor: isDark ? '#2C2C2E' : '#E5E5EA', borderWidth: 1 }}>
                  <Skeleton width="100%" height={160} borderRadius={12} style={{ marginBottom: 12 }} />
                  <Skeleton width={120} height={16} style={{ marginBottom: 8 }} />
                  <Skeleton width={150} height={12} style={{ marginBottom: 8 }} />
                  <Skeleton width={80} height={12} />
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Section: New Arrivals Skeleton */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={{ gap: 6 }}>
                <Skeleton width={110} height={20} />
                <Skeleton width={160} height={12} />
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <View key={i} style={{ marginRight: 16, width: 160, height: 220, borderRadius: 16, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', padding: 12, borderColor: isDark ? '#2C2C2E' : '#E5E5EA', borderWidth: 1 }}>
                  <Skeleton width="100%" height={120} borderRadius={12} style={{ marginBottom: 12 }} />
                  <Skeleton width={100} height={14} style={{ marginBottom: 6 }} />
                  <Skeleton width={80} height={10} />
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const navigateToTab = (tabName: string) => {
    if (setActiveTab) {
      setActiveTab(tabName);
    }
  };



  const profileCompletion = userProfile?.profileCompletion || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeBg }} edges={["left", "right"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: topPadding, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accentColor}
            progressViewOffset={topPadding}
          />
        }
      >
        {/* Welcome Header Section (Flat) */}
        <View style={styles.headerFlat}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greetingText, { color: mutedText }]}>
              {getGreeting()},
            </Text>
            <View style={styles.nameRow}>
              <Text style={[styles.userNameText, { color: textColor }]} numberOfLines={1}>
                {userProfile?.firstName || user?.firstName || "Valued"} {userProfile?.lastName || user?.lastName || "Member"}
              </Text>
              {userProfile?.verificationStatus === "approved" && (
                <ShieldCheck size={16} color="#4CAF50" style={{ marginLeft: 6 }} />
              )}
              {userProfile?.isKycVerified && (
                <BadgeCheck size={16} color={accentColor} style={{ marginLeft: 4 }} />
              )}
            </View>
            <View style={styles.idRow}>
              <Text style={[styles.idText, { color: mutedText }]}>
                ID: {userProfile?.customId || user?.customId || "MEMBER-ID"}
              </Text>
            </View>

            <View style={styles.headerButtonsRow}>
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => navigation.navigate("EditProfile")}
                activeOpacity={0.7}
              >
                <Edit2 size={11} color={palette.purple.deep} />
                <Text style={styles.editProfileButtonText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={() => navigation.navigate("MyVideoIntro")}
                activeOpacity={0.7}
              >
                <Play size={11} color={palette.purple.deep} fill={palette.purple.deep} />
                <Text style={styles.editProfileButtonText}>Video Intros</Text>
              </TouchableOpacity>

              {!userProfile?.isKycVerified && (
                <TouchableOpacity
                  style={[
                    styles.kycFlatButton,
                    {
                      borderColor:
                        kycStatus?.status === "pending" || kycStatus?.selfieStatus === "pending"
                          ? "#EF6C00"
                          : "#D32F2F",
                    },
                  ]}
                  onPress={() => navigation.navigate("KYCVerification")}
                >
                  {kycStatus?.status === "pending" || kycStatus?.selfieStatus === "pending" ? (
                    <Clock size={11} color="#EF6C00" />
                  ) : (
                    <AlertCircle size={11} color="#D32F2F" />
                  )}
                  <Text
                    style={[
                      styles.kycFlatButtonText,
                      {
                        color:
                          kycStatus?.status === "pending" || kycStatus?.selfieStatus === "pending"
                            ? "#EF6C00"
                            : "#D32F2F",
                      },
                    ]}
                  >
                    {kycStatus?.status === "pending" || kycStatus?.selfieStatus === "pending"
                      ? "KYC Pending Review"
                      : kycStatus?.status === "rejected" || kycStatus?.selfieStatus === "rejected"
                        ? "KYC Rejected"
                        : "Verify KYC Now"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.avatarWrapper}>
            <ProgressRing progress={profileCompletion} size={70} strokeWidth={3} />
            <Image
              source={{
                uri: resolvePhotoUrl(
                  userProfile?.photos?.find((p: any) => p.isMain === true || p.isMain === 1 || p.isMain === "1")?.url ||
                  userProfile?.photos?.[0]?.url ||
                  `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.email || "default"}`
                )
              }}
              style={styles.avatarImage}
            />
          </View>
        </View>


        {/* Dashboard Quick Stats */}
        <View style={[styles.statsPanel, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
          <TouchableOpacity style={styles.statBox} onPress={() => navigateToTab("Updates")}>
            <Text style={[styles.statNum, { color: textColor }]}>{userProfile?.viewsCount || 0}</Text>
            <Text style={[styles.statLabelText, { color: mutedText }]}>Profile Views</Text>
          </TouchableOpacity>
          <View style={styles.statVerticalDivider} />
          <TouchableOpacity style={styles.statBox} onPress={() => navigateToTab("Updates")}>
            <Text style={[styles.statNum, { color: textColor }]}>{userProfile?.interestsCount || 0}</Text>
            <Text style={[styles.statLabelText, { color: mutedText }]}>Interests</Text>
          </TouchableOpacity>
          <View style={styles.statVerticalDivider} />
          <TouchableOpacity style={styles.statBox} onPress={() => navigateToTab("Updates")}>
            <Text style={[styles.statNum, { color: textColor }]}>{userProfile?.likesCount || 0}</Text>
            <Text style={[styles.statLabelText, { color: mutedText }]}>Likes Received</Text>
          </TouchableOpacity>
        </View>

        {/* Premium Upgrade Nudge (Free users only) */}
        {!subscription && (
          <TouchableOpacity
            style={styles.premiumNudgeCard}
            onPress={() => navigateToTab("Premium")}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#3B1E54', '#5A3280']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumGradient}
            >
              <View style={styles.premiumNudgeLeft}>
                <View style={styles.crownCircle}>
                  <Crown size={16} color={palette.gold.main} fill={palette.gold.main} />
                </View>
                <View style={styles.premiumNudgeTextContainer}>
                  <Text style={styles.premiumNudgeTitle}>Unlock Premium Access</Text>
                  <Text style={styles.premiumNudgeSub}>Get up to 3x more views & direct contacts</Text>
                </View>
              </View>
              <ChevronRight size={18} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}


        {/* Banner Carousel */}
        <View style={styles.bannerContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
          >
            {banners.length > 0 ? (
              banners.map((banner: any) => (
                <TouchableOpacity key={banner.id} style={styles.bannerItem}>
                  <Image
                    source={{ uri: resolvePhotoUrl(banner.imageUrl) }}
                    style={styles.bannerImage}
                  />
                  <View style={[styles.bannerOverlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <Text style={styles.bannerSub}>{banner.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.promoBanner, { backgroundColor: deepPurple }]}>
                <View style={styles.promoContent}>
                  <Sparkles size={32} color={accentColor} />
                  <View style={{ marginLeft: 15 }}>
                    <Text style={styles.promoTitle}>BrideandGroom Special</Text>
                    <Text style={styles.promoSub}>
                      Success stories shared daily
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.promoBtn} onPress={() => navigation.navigate('SubmitStory')}>
                  <Text style={styles.promoBtnText}>Share Story</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>


        {/* Section: Premium Picks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionHeading, { color: textColor }]}>
                Premium Picks
              </Text>
              <Text style={[styles.sectionSub, { color: mutedText }]}>
                Handpicked profiles of premium members
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigateToTab("Matches")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {premiumMatches.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {premiumMatches.map((item: any) => {
                const isBlocked = !!item.isBlockedByMe;
                return (
                  <View key={item.id} style={{ position: "relative", marginRight: 16 }}>
                    <PremiumProfileCard
                      profile={item}
                      isDark={isDark}
                      layout="vertical"
                      onPress={() => {
                        if (!isBlocked) {
                          navigation.navigate("ProfileDetail", { profile: item });
                        }
                      }}
                      style={{ marginRight: 0 }}
                    />
                    {isBlocked && (
                      <View style={[styles.homeBlockedOverlay, { borderRadius: 24 }]}>
                        <Ban size={20} color="#FF3B30" />
                        <Text style={styles.homeBlockedText}>Blocked Profile</Text>
                        <TouchableOpacity
                          onPress={() => navigation.navigate("AccountSetting")}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.homeBlockedLink}>Manage Blocks</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={[styles.emptyStateCard, { backgroundColor: isDark ? '#1E1E1E' : '#FAFAFA' }]}>
              <Sparkles size={36} color={accentColor} style={{ opacity: 0.6 }} />
              <Text style={[styles.emptyStateTitle, { color: textColor }]}>
                Premium picks coming soon
              </Text>
              <Text style={[styles.emptyStateSub, { color: mutedText }]}>
                We're curating the best profiles just for you. Check back later!
              </Text>
            </View>
          )}
        </View>




        {/* Section: New Profiles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionHeading, { color: textColor }]}>
                New Arrivals
              </Text>
              <Text style={[styles.sectionSub, { color: mutedText }]}>
                Recently joined members
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigateToTab("Matches")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {newMatches.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {newMatches.map((item: any) => {
                const isBlocked = !!item.isBlockedByMe;
                return (
                  <View key={item.id} style={{ position: "relative", marginRight: 16 }}>
                    <ProfileCard
                      profile={item}
                      type="grid"
                      isDark={isDark}
                      layout="vertical"
                      style={{ width: 150, marginBottom: 0 }}
                      onPress={() => {
                        if (!isBlocked) {
                          navigation.navigate("ProfileDetail", { profile: item });
                        }
                      }}
                    />
                    {isBlocked && (
                      <View style={[styles.homeBlockedOverlay, { borderRadius: 20 }]}>
                        <Ban size={20} color="#FF3B30" />
                        <Text style={styles.homeBlockedText}>Blocked Profile</Text>
                        <TouchableOpacity
                          onPress={() => navigation.navigate("AccountSetting")}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.homeBlockedLink}>Manage Blocks</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          ) : (
            <View style={[styles.emptyStateCard, { backgroundColor: isDark ? '#1E1E1E' : '#FAFAFA' }]}>
              <Users size={36} color={deepPurple} style={{ opacity: 0.5 }} />
              <Text style={[styles.emptyStateTitle, { color: textColor }]}>
                No new arrivals yet
              </Text>
              <Text style={[styles.emptyStateSub, { color: mutedText }]}>
                New members join every day. Pull down to refresh!
              </Text>
            </View>
          )}
        </View>

        {/* Section: Visitors (with timestamps) */}
        {recentVisitors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionHeading, { color: textColor }]}>
                  Recent Visitors
                </Text>
                <Text style={[styles.sectionSub, { color: mutedText }]}>
                  People who viewed your profile
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {recentVisitors.map((item: any) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.visitorCard}
                  onPress={() => navigation.navigate("ProfileDetail", { profile: item })}
                  activeOpacity={0.8}
                >
                  <View style={styles.visitorAvatarWrapper}>
                    <Image
                      source={{
                        uri: resolvePhotoUrl(
                          (item.photos?.filter(Boolean) || []).find((p: any) => p.isMain === true || p.isMain === 1 || p.isMain === '1')?.url ||
                          (item.photos?.filter(Boolean) || [])[0]?.url ||
                          `https://api.dicebear.com/7.x/avataaars/png?seed=${item.firstName || item.id || 'default'}`
                        )
                      }}
                      style={styles.visitorAvatar}
                    />
                    {(item.accountType === 'Premium' || item.isPremium) && (
                      <View style={[styles.visitorPremiumBadge, { backgroundColor: accentColor }]}>
                        <Crown size={8} color={deepPurple} />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.visitorName, { color: textColor }]} numberOfLines={1}>
                    {item.firstName}
                  </Text>
                  <View style={styles.visitorTimeRow}>
                    <Eye size={10} color={mutedText} />
                    <Text style={[styles.visitorTimeText, { color: mutedText }]}>
                      {getRelativeTime(item.viewedAt || item.updatedAt || item.createdAt)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Brand Footer */}
        <View style={styles.footer}>
          <Image
            source={require("../../../assets/images/made-with-love.png")}
            style={styles.madeWithLoveLogo}
            resizeMode="contain"
          />
        </View>
      </ScrollView>

      {/* Permissions Modal */}
      <PermissionsModal
        visible={showPermissions}
        onDismiss={() => setShowPermissions(false)}
      />

      {/* Side Navigation Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        setActiveTab={setActiveTab}
      />

      {/* First-time Registration Celebration Modal */}
      <Modal
        visible={showCelebration}
        transparent
        animationType="fade"
      >
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationCard}>
            <LottieView
              source={require('../../../assets/animations/c22b3edc-116e-11ee-b29e-6b53b36a56ea.json')}
              autoPlay
              loop={true}
              style={styles.celebrationLottie}
            />
            <Text style={styles.celebrationTitle}>Welcome to Bride & Groom! 🎉</Text>
            <Text style={styles.celebrationSub}>
              We are thrilled to help you find your perfect companion. Let's begin this beautiful journey together!
            </Text>
            <TouchableOpacity
              style={styles.celebrationBtn}
              onPress={() => setShowCelebration(false)}
            >
              <LinearGradient
                colors={[deepPurple, '#7B1FA2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.celebrationBtnGradient}
              >
                <Text style={styles.celebrationBtnText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerFlat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 16,
  },
  greetingText: {
    fontSize: 13,
    ...fonts.medium,
    opacity: 0.6,
  },
  userNameText: {
    fontSize: 20,
    ...fonts.bold,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  idRow: {
    marginTop: 4,
  },
  idText: {
    fontSize: 12,
    ...fonts.semibold,
  },
  kycFlatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  kycFlatButtonText: {
    fontSize: 10,
    ...fonts.semibold,
  },
  avatarWrapper: {
    position: 'relative',
    width: 76,
    height: 76,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    position: 'absolute',
  },
  headerButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 30, 84, 0.15)',
    backgroundColor: '#F6F2FC',
    alignSelf: 'flex-start',
  },
  editProfileButtonText: {
    fontSize: 10,
    ...fonts.semibold,
    color: '#3B1E54',
  },
  statsPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 30, 84, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 15,
    ...fonts.bold,
  },
  statLabelText: {
    fontSize: 9,
    marginTop: 2,
    ...fonts.semibold,
  },
  statVerticalDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(59, 30, 84, 0.08)',
  },
  premiumNudgeCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#3B1E54',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  premiumGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  premiumNudgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  crownCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumNudgeTextContainer: {
    flex: 1,
  },
  premiumNudgeTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    ...fonts.bold,
  },
  premiumNudgeSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    marginTop: 2,
  },

  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 10,
  },
  quickActionPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 30, 84, 0.06)',
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    ...fonts.semibold,
  },

  // Banner
  bannerContainer: {
    marginTop: 24,
    marginBottom: 30,
  },
  bannerItem: {
    width: width - 40,
    height: 180,
    marginHorizontal: 20,
    borderRadius: 25,
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: "flex-end",
    padding: 20,
  },
  bannerTitle: {
    color: "#FFF",
    fontSize: 20,
    ...fonts.bold,
  },
  bannerSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    marginTop: 4,
  },
  promoBanner: {
    width: width - 40,
    height: 180,
    marginHorizontal: 20,
    borderRadius: 25,
    padding: 25,
    justifyContent: "center",
  },
  promoContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  promoTitle: {
    color: "#FFF",
    fontSize: 22,
    ...fonts.bold,
  },
  promoSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    marginTop: 4,
  },
  promoBtn: {
    backgroundColor: palette.gold.main,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 20,
  },
  promoBtnText: {
    color: "#3B1E54",
    ...fonts.bold,
    fontSize: 13,
  },

  // Sections
  section: {
    marginBottom: 35,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 25,
    marginBottom: 15,
  },
  sectionHeading: {
    fontSize: 22,
    ...fonts.bold,
    letterSpacing: -0.5,
  },
  sectionSub: {
    fontSize: 13,
    marginTop: 2,
  },
  seeAll: {
    color: palette.gold.main,
    fontSize: 14,
    ...fonts.semibold,
  },
  newProfilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  loadMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    gap: 5,
  },
  loadMoreText: {
    color: palette.gold.main,
    fontSize: 14,
    ...fonts.semibold,
  },

  // Empty States
  emptyStateCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  emptyStateTitle: {
    fontSize: 15,
    ...fonts.bold,
    marginTop: 14,
  },
  emptyStateSub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: '80%',
  },

  // Visitors with timestamps
  visitorCard: {
    alignItems: 'center',
    marginRight: 18,
    width: 75,
  },
  visitorAvatarWrapper: {
    position: 'relative',
  },
  visitorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#F0F0F0',
  },
  visitorPremiumBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  visitorName: {
    fontSize: 12,
    ...fonts.semibold,
    marginTop: 8,
    textAlign: 'center',
  },
  visitorTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  visitorTimeText: {
    fontSize: 9,
    ...fonts.medium,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  madeWithLoveLogo: {
    width: 300,
    height: 180,
  },
  copyright: {
    fontSize: 10,
    marginTop: 25,
  },
  // ProfileCard styles
  cardContainer: {
    borderRadius: 20,
    overflow: "hidden",
    width: 160,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  cardImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#EEEEEE",
  },
  cardInfo: {
    padding: 12,
  },
  cardName: {
    fontSize: 14,
    ...fonts.semibold,
  },
  cardCity: {
    fontSize: 12,
    marginTop: 2,
  },
  // Permissions Modal styles
  permissionsOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionsContent: {
    backgroundColor: palette.neutral.white,
    borderRadius: 25,
    padding: 30,
    alignItems: "center",
    width: "90%",
  },
  permissionsTitle: {
    fontSize: 20,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginBottom: 10,
  },
  permissionsDesc: {
    fontSize: 14,
    color: palette.purple.muted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  primaryButton: {
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
  },
  primaryButtonText: {
    color: palette.purple.deep,
    ...fonts.semibold,
    letterSpacing: 1,
  },
  outlineButton: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: palette.purple.border,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  outlineButtonText: {
    color: palette.purple.deep,
    ...fonts.semibold,
  },
  // Celebration Onboarding styles
  celebrationOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 1000,
  },
  celebrationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  celebrationLottie: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  celebrationTitle: {
    fontSize: 22,
    ...fonts.bold,
    color: '#3B1E54',
    textAlign: 'center',
    marginBottom: 12,
  },
  celebrationSub: {
    fontSize: 14,
    ...fonts.medium,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  celebrationBtn: {
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    width: '100%',
  },
  celebrationBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationBtnText: {
    color: '#FFF',
    fontSize: 15,
    ...fonts.semibold,
  },
  homeBlockedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 10, 25, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    zIndex: 10,
  },
  homeBlockedText: {
    fontSize: 11,
    ...fonts.semibold,
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 4,
  },
  homeBlockedLink: {
    fontSize: 10,
    ...fonts.bold,
    color: "#D4AF37",
    textDecorationLine: "underline",
    textAlign: "center",
  },
  reelsRowContainer: {
    marginVertical: 15,
    backgroundColor: 'transparent',
  },
  reelsRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 6,
  },
  reelsRowTitle: {
    fontSize: 14,
    ...fonts.bold,
    color: '#3B1E54',
  },
  reelsScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  reelBubbleWrapper: {
    alignItems: 'center',
    gap: 4,
    width: 68,
  },
  ownReelOutline: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E8E0F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  addReelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B1E54',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  matchReelOutline: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  innerReelCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  reelBubbleAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  playReelBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#D4AF37',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  reelBubbleName: {
    fontSize: 10,
    ...fonts.semibold,
    color: '#7E6B8F',
    textAlign: 'center',
    width: '100%',
  },
});
