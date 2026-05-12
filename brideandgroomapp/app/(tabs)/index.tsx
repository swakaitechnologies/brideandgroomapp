import React, { useEffect, useState, useMemo } from "react";
import {
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { Text, View } from "@/components/Themed";
import {
  Plus,
  BadgeCheck,
  Edit3,
  RefreshCcw,
  ChevronRight,
  Crown,
  Clock,
  UserPlus,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  Camera,
  Heart,
  MessageCircle,
  Zap,
  Star,
} from "lucide-react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";
import { palette } from "@/src/theme/colors";
import { router } from "expo-router";
import {
  getDailyPicks,
  getAllProfiles,
  getProfileViewers,
  getProfile,
  getBanners,
} from "@/src/services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileCard } from "@/components/ProfileCard";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { mode } = useSelector((state: RootState) => state.theme);
  const isDark = mode === "dark";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [premiumMatches, setPremiumMatches] = useState<any[]>([
    {
      id: "d1",
      firstName: "Priya",
      age: 24,
      city: "Mumbai",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
    {
      id: "d2",
      firstName: "Ananya",
      age: 26,
      city: "Delhi",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
  ]);
  const [newMatches, setNewMatches] = useState<any[]>([
    {
      id: "n1",
      firstName: "Rahul",
      age: 28,
      city: "Pune",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
    {
      id: "n2",
      firstName: "Sneha",
      age: 25,
      city: "Bangalore",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
    {
      id: "n3",
      firstName: "Vikram",
      age: 29,
      city: "Chennai",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
    {
      id: "n4",
      firstName: "Kavya",
      age: 24,
      city: "Hyderabad",
      photos: [
        {
          url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
        },
      ],
    },
  ]);
  const [recentVisitors, setRecentVisitors] = useState<any[]>([
    {
      id: "v1",
      firstName: "Aarav",
      photos: [
        { url: "https://api.dicebear.com/7.x/avataaars/png?seed=Aarav" },
      ],
    },
    {
      id: "v2",
      firstName: "Ishani",
      photos: [
        { url: "https://api.dicebear.com/7.x/avataaars/png?seed=Ishani" },
      ],
    },
    {
      id: "v3",
      firstName: "Kabir",
      photos: [
        { url: "https://api.dicebear.com/7.x/avataaars/png?seed=Kabir" },
      ],
    },
  ]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [banners, setBanners] = useState<any[]>([]);

  // Theme-aware colors
  const themeBg = isDark ? "#0F0F0F" : "#FFFFFF";
  const cardBg = isDark ? "#1E1E1E" : "#FFFFFF";
  const textColor = isDark ? "#F0F0F0" : "#1A1A1A";
  const mutedText = isDark ? "#A0A0A0" : "#8E8E93";
  const accentColor = palette.gold.main;
  const deepPurple = "#3B1E54";

  const fetchData = async () => {
    try {
      const [premiumRes, newRes, visitorsRes, profileRes, bannerRes] =
        await Promise.all([
          getDailyPicks().catch(() => ({ data: { data: [] } })),
          getAllProfiles().catch(() => ({ data: { data: [] } })),
          getProfileViewers().catch(() => ({ data: { data: [] } })),
          getProfile().catch(() => ({ data: { data: null } })),
          getBanners().catch(() => ({ data: { data: [] } })),
        ]);

      setPremiumMatches(
        premiumRes.data.data?.length > 0
          ? premiumRes.data.data
          : premiumMatches,
      );
      setNewMatches(
        newRes.data.data?.length > 0 ? newRes.data.data : newMatches,
      );
      setRecentVisitors(
        visitorsRes.data.data?.length > 0
          ? visitorsRes.data.data
          : recentVisitors,
      );
      setUserProfile(profileRes.data.data || null);
      setBanners(bannerRes.data.data || []);
    } catch (error) {
      console.error("Error fetching home data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getProfileCompletion = () => {
    let total = 6;
    let completed = 0;
    if (userProfile?.photos?.length > 0) completed++;
    if (userProfile?.bio) completed++;
    if (userProfile?.profession) completed++;
    if (userProfile?.highestDegree) completed++;
    if (userProfile?.city) completed++;
    if (userProfile?.religion) completed++;
    return Math.round((completed / total) * 100);
  };

  const profileCompletion = getProfileCompletion();

  if (loading && !refreshing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: themeBg,
        }}
      >
        <ActivityIndicator size="large" color={accentColor} />
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: themeBg }}
      edges={["left", "right"]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={accentColor}
          />
        }
      >
        {/* Hero Section: Premium Profile Card */}
        <View style={styles.heroContainer}>
          <View
            style={[
              styles.heroCard,
              { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" },
            ]}
          >
            <View style={styles.heroHeader}>
              <View style={styles.heroAvatarContainer}>
                <Image
                  source={{
                    uri:
                      userProfile?.photos?.[0]?.url ||
                      `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.email}`,
                  }}
                  style={styles.heroAvatar}
                />
                <View
                  style={[styles.heroBadge, { backgroundColor: accentColor }]}
                >
                  <Crown size={12} color={deepPurple} />
                </View>
              </View>
              <View style={styles.heroInfo}>
                <Text style={[styles.heroWelcome, { color: mutedText }]}>
                  Welcome back,
                </Text>
                <Text style={[styles.heroName, { color: textColor }]}>
                  {user?.firstName || "Valued"} {user?.lastName || "Member"}
                </Text>
                <View style={styles.heroIdTag}>
                  <Text style={[styles.heroIdText, { color: accentColor }]}>
                    ID: {userProfile?.customId || "MEMBER-ID"}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={() => router.push("/edit-profile")}
              >
                <Edit3 size={18} color={accentColor} />
              </TouchableOpacity>
            </View>

            <View style={styles.heroStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: textColor }]}>
                  128
                </Text>
                <Text style={[styles.statLabel, { color: mutedText }]}>
                  Views
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: textColor }]}>42</Text>
                <Text style={[styles.statLabel, { color: mutedText }]}>
                  Interests
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
              onPress={() => router.push("/(tabs)/premium")}
            >
              <Zap size={16} color={deepPurple} />
              <Text style={styles.premiumText}>
                Get 3x more responses with Premium
              </Text>
              <ArrowRight size={14} color={deepPurple} />
            </TouchableOpacity>
          </View>
        </View>

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
                    source={{ uri: banner.imageUrl }}
                    style={styles.bannerImage}
                  />
                  <View
                    style={[
                      styles.bannerOverlay,
                      { backgroundColor: "rgba(0,0,0,0.5)" },
                    ]}
                  >
                    <Text style={styles.bannerTitle}>{banner.title}</Text>
                    <Text style={styles.bannerSub}>{banner.subtitle}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View
                style={[styles.promoBanner, { backgroundColor: deepPurple }]}
              >
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
                Handpicked profiles for you
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(tabs)/matches")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {premiumMatches.map((item: any) => (
              <ProfileCard
                key={item.id}
                profile={item}
                type="grid"
                isDark={isDark}
                onPress={() => router.push("/(tabs)/matches")}
                style={{ marginRight: 16 }}
              />
            ))}
          </ScrollView>
        </View>

        {/* Section: New Profiles (Grid Layout) */}
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
          <View style={styles.newProfilesGrid}>
            {newMatches.slice(0, 4).map((item: any) => (
              <ProfileCard
                key={item.id}
                profile={item}
                type="grid"
                isDark={isDark}
                onPress={() => router.push("/(tabs)/matches")}
              />
            ))}
          </View>
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={() => router.push("/(tabs)/matches")}
          >
            <Text style={styles.loadMoreText}>View All New Profiles</Text>
            <ChevronRight size={16} color={accentColor} />
          </TouchableOpacity>
        </View>

        {/* Section: Visitors */}
        {recentVisitors.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionHeading, { color: textColor }]}>
                Recent Visitors
              </Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20 }}
            >
              {recentVisitors.map((item: any) => (
                <ProfileCard
                  key={item.id}
                  profile={item}
                  type="grid"
                  isDark={isDark}
                  onPress={() => router.push("/(tabs)/matches")}
                  style={{ marginRight: 16 }}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Brand Footer */}
        <View style={styles.footer}>
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={[styles.footerTagline, { color: mutedText }]}>
            Designed for meaningful connections
          </Text>
          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialIcon}>
              <FontAwesome name="instagram" size={18} color={mutedText} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <FontAwesome name="facebook" size={18} color={mutedText} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}>
              <FontAwesome name="twitter" size={18} color={mutedText} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.copyright, { color: mutedText }]}>
            © 2026 Bride and Groom Matrimony
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 30,
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
    fontWeight: "500",
  },
  heroName: {
    fontSize: 20,
    fontWeight: "800",
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
    fontWeight: "700",
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
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    marginTop: 2,
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
    fontWeight: "700",
    marginLeft: 10,
  },
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
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    padding: 20,
  },
  bannerTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
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
    fontWeight: "800",
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
    fontWeight: "800",
    fontSize: 13,
  },
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
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  sectionSub: {
    fontSize: 13,
    marginTop: 2,
  },
  seeAll: {
    color: palette.gold.main,
    fontSize: 14,
    fontWeight: "700",
  },
  newProfilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 15,
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
    fontWeight: "700",
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerLogo: {
    width: 150,
    height: 50,
    opacity: 0.5,
  },
  footerTagline: {
    fontSize: 12,
    marginTop: 10,
    fontStyle: "italic",
  },
  socialRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 20,
  },
  socialIcon: {
    padding: 5,
  },
  copyright: {
    fontSize: 10,
    marginTop: 25,
  },
});
