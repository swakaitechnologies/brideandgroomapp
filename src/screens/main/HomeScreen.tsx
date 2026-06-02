import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Modal,
  PermissionsAndroid,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { palette } from "../../theme/colors";
import {
  Plus,
  Edit2,
  ChevronRight,
  Crown,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  BadgeCheck,
  AlertCircle,
  Zap,
  Search,
  MessageCircle,
  Camera,
  Star,
  Users,
  Heart,
  Eye,
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
import Svg, { Circle } from "react-native-svg";
import { PremiumProfileCard } from "../../components/PremiumProfileCard";
import { fonts } from "@/src/theme";
import { showToast } from "../../utils/toast";

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
          getDailyPicks().catch(() => ({ data: { data: [] } })),
          getAllProfiles().catch(() => ({ data: { data: [] } })),
          getProfileViewers().catch(() => ({ data: { data: [] } })),
          getProfile().catch(() => ({ data: { data: null } })),
          getBanners().catch(() => ({ data: { data: [] } })),
          getKYCStatus().catch(() => ({ data: { data: null } })),
          getMySubscription().catch(() => ({ data: { success: false } })),
        ]);

      const allFetchedProfiles = [
        ...(premiumRes.data.data || []),
        ...(newRes.data.data || [])
      ];
      const uniqueProfiles = Array.from(new Map(allFetchedProfiles.map((p: any) => [p.userId || p.id, p])).values());
      const premiumOnly = uniqueProfiles.filter((p: any) => p.isPremium === true || p.accountType === 'Premium');

      setPremiumMatches(premiumOnly);
      setNewMatches(newRes.data.data || []);
      setRecentVisitors(visitorsRes.data.data || []);
      setUserProfile(profileRes.data.data || null);
      setBanners(bannerRes.data.data || []);

      if (kycRes && kycRes.data && kycRes.data.success) {
        setKycStatus(kycRes.data.data || { status: kycRes.data.status || 'not_submitted' });
      } else {
        setKycStatus({ status: 'not_submitted', selfieStatus: 'not_submitted' });
      }

      if (subRes?.data?.success && subRes.data.subscription) {
        setSubscription(subRes.data.subscription);
      } else {
        setSubscription(null);
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
    }, [])
  );

  // Show permissions modal if any of gallery, camera, or location is not granted
  useEffect(() => {
    // Trigger toast notification on mount
    showToast("Welcome back! Your dashboard has loaded.", "Dashboard Updated");

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: themeBg }]}>
        <ActivityIndicator size="large" color={accentColor} />
      </View>
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
        {/* Hero Section: Premium Profile Card */}
        <View style={styles.heroContainer}>
          <View style={[styles.heroCard, { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }]}>
            <View style={styles.heroHeader}>
              <TouchableOpacity
                style={styles.heroAvatarContainer}
                onPress={() => setIsDrawerOpen(true)}
                activeOpacity={0.8}
              >
                <Image
                  source={{
                    uri: resolvePhotoUrl(
                      userProfile?.photos?.find((p: any) => p.isMain === true || p.isMain === 1 || p.isMain === "1")?.url ||
                      userProfile?.photos?.[0]?.url ||
                      `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.email || "default"}`
                    )
                  }}
                  style={[
                    styles.heroAvatar,
                    subscription ? { borderColor: accentColor } : { borderColor: '#E0E0E0' }
                  ]}
                />
                {subscription && (
                  <View style={[styles.heroBadge, { backgroundColor: accentColor }]}>
                    <Crown size={12} color={deepPurple} />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.heroInfo}>
                <Text style={[styles.heroWelcome, { color: mutedText }]}>
                  {getGreeting()},
                </Text>
                <View style={styles.heroNameRow}>
                  <Text style={[styles.heroName, { color: textColor }]} numberOfLines={1}>
                    {userProfile?.firstName || user?.firstName || "Valued"} {userProfile?.lastName || user?.lastName || "Member"}
                  </Text>
                  {userProfile?.verificationStatus === "approved" && (
                    <ShieldCheck size={18} color="#4CAF50" style={{ marginLeft: 6 }} />
                  )}
                  {userProfile?.isKycVerified && (
                    <BadgeCheck size={18} color={accentColor} style={{ marginLeft: 4 }} />
                  )}
                </View>
                <View style={styles.heroIdTag}>
                  <Text style={[styles.heroIdText, { color: accentColor }]}>
                    ID: {userProfile?.customId || "MEMBER-ID"}
                  </Text>
                </View>

                {!userProfile?.isKycVerified && (
                  <TouchableOpacity
                    style={[styles.kycButton, { borderColor: accentColor + "40" }]}
                    onPress={() => navigation.navigate("KYCVerification")}
                  >
                    {(kycStatus?.status === "pending" || kycStatus?.selfieStatus === "pending") ? (
                      <Clock size={12} color="#EF6C00" />
                    ) : (
                      <AlertCircle size={12} color="#D32F2F" />
                    )}
                    <Text style={[styles.kycButtonText, { color: (kycStatus?.status === "pending" || kycStatus?.selfieStatus === "pending") ? "#EF6C00" : "#D32F2F" }]}>
                      {(kycStatus?.status === "pending" || kycStatus?.selfieStatus === "pending") ? "KYC Pending Review" :
                        (kycStatus?.status === "rejected" || kycStatus?.selfieStatus === "rejected") ? "KYC Rejected - Try Again" : "Verify KYC Now"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => navigation.navigate("EditProfile")}
              >
                <Edit2 size={18} color={accentColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.heroStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {userProfile?.viewsCount || 0}
                </Text>
                <Text style={[styles.statLabel, { color: mutedText }]}>
                  Views
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {userProfile?.interestsCount || 0}
                </Text>
                <Text style={[styles.statLabel, { color: mutedText }]}>
                  Interests
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {userProfile?.likesCount || 0}
                </Text>
                <Text style={[styles.statLabel, { color: mutedText }]}>
                  Likes
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: textColor }]}>
                  {profileCompletion}%
                </Text>
                <Text style={[styles.statLabel, { color: mutedText }]}>
                  Complete
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.premiumBanner}
              onPress={() => navigateToTab("Premium")}
            >
              <Zap size={16} color={deepPurple} />
              <Text style={styles.premiumText}>
                Get 3x more responses with Premium
              </Text>
              <ArrowRight size={14} color={deepPurple} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Completion Nudge — only if < 80% */}
        {profileCompletion < 80 && (
          <TouchableOpacity
            style={[styles.completionCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}
            onPress={() => navigation.navigate("EditProfile")}
            activeOpacity={0.85}
          >
            <ProgressRing progress={profileCompletion} />
            <View style={styles.completionInfo}>
              <Text style={[styles.completionTitle, { color: textColor }]}>
                Complete your profile
              </Text>
              <Text style={[styles.completionSub, { color: mutedText }]}>
                {profileCompletion < 40
                  ? "Profiles with more details get 5× more views"
                  : profileCompletion < 60
                    ? "You're getting there! Add a few more details"
                    : "Almost done — just a little more to go!"}
              </Text>
            </View>
            <ChevronRight size={18} color={mutedText} />
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
                <TouchableOpacity style={styles.promoBtn}>
                  <Text style={styles.promoBtnText}>View Stories</Text>
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
              {premiumMatches.map((item: any) => (
                <PremiumProfileCard
                  key={item.id}
                  profile={item}
                  isDark={isDark}
                  onPress={() => navigation.navigate("ProfileDetail", { profile: item })}
                  style={{ marginRight: 16 }}
                />
              ))}
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
          </View>
          {newMatches.length > 0 ? (
            <>
              <View style={styles.newProfilesGrid}>
                {newMatches.slice(0, 4).map((item: any) => (
                  <ProfileCard
                    key={item.id}
                    profile={item}
                    type="grid"
                    isDark={isDark}
                    onPress={() => navigation.navigate("ProfileDetail", { profile: item })}
                    style={{ width: (width - 50) / 2, marginBottom: 15 }}
                  />
                ))}
              </View>
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={() => navigateToTab("Matches")}
              >
                <Text style={styles.loadMoreText}>View All New Profiles</Text>
                <ChevronRight size={16} color={accentColor} />
              </TouchableOpacity>
            </>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 20,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 25,
      },
      android: { elevation: 4 },
    }),
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroAvatarContainer: {
    position: "relative",
  },
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: palette.gold.main,
  },
  heroBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  heroInfo: {
    flex: 1,
    marginLeft: 15,
  },
  heroWelcome: {
    fontSize: 12,
    ...fonts.medium,
  },
  heroNameRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 10,
  },
  heroName: {
    fontSize: 14,
    ...fonts.bold,
    maxWidth: "85%",
  },
  kycButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  kycButtonText: {
    fontSize: 11,
    ...fonts.semibold,
  },
  heroIdTag: {
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  heroIdText: {
    fontSize: 10,
    ...fonts.semibold,
  },
  editProfileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(59, 30, 84, 0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
    marginTop: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(59, 30, 84, 0.05)",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    ...fonts.bold,
  },
  statLabel: {
    fontSize: 10,
    ...fonts.medium,
    marginTop: 2,
    lineHeight: 14,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(59, 30, 84, 0.1)",
    alignSelf: "center",
  },
  premiumBanner: {
    backgroundColor: palette.gold.main,
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
  },
  premiumText: {
    flex: 1,
    color: "#3B1E54",
    fontSize: 12,
    ...fonts.semibold,
    marginLeft: 10,
  },

  // Profile Completion Nudge
  completionCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.25)',
    ...Platform.select({
      ios: { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 2 },
    }),
  },
  completionInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  completionTitle: {
    fontSize: 14,
    ...fonts.bold,
  },
  completionSub: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
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
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  madeWithLoveLogo: {
    width: '100%',
    height: 140,
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
    backgroundColor: "rgba(0,0,0,0.5)",
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
});
