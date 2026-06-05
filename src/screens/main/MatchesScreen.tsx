import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  Alert,
  PanResponder,
  Animated,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { 
  Heart, 
  Sparkles, 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Star, 
  Crown, 
  Eye, 
  User, 
  X,
  ChevronRight,
  UserCheck,
  Info,
  BadgeCheck,
  Briefcase,
  Ban,
} from "lucide-react-native";
import { palette } from "../../theme/colors";
import api, { resolvePhotoUrl } from "../../services/api";
import { showToast } from "../../utils/toast";
import { ProfileCard } from "../../components/ProfileCard";
import { fonts } from "@/src/theme";

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = height * 0.68;
const CARD_WIDTH = width * 0.88;

const RELIGIONS = ["All", "Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Others"];
const MARITAL_STATUSES = ["All", "Never Married", "Divorced", "Widowed", "Awaiting Divorce"];

export default function MatchesScreen({ onSubTabChange }: { onSubTabChange?: (subTab: string) => void }) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isDark = false;
  const topPadding = insets.top + 80;
  
  const themeBg = isDark ? "#0F0F0F" : "#FDFBFF"; // Consistent off-white background
  const cardBg = isDark ? "#1E1E1E" : "#FFFFFF";
  const textColor = isDark ? "#F0F0F0" : "#1A1A1A";
  const mutedText = isDark ? "#A0A0A0" : "#8E8E93";
  const borderColor = isDark ? "#2C2C2E" : "rgba(59, 30, 84, 0.08)";
  const accentColor = palette.gold.main;
  const deepPurple = "#3B1E54";
  const softPurple = "rgba(59, 30, 84, 0.04)";

  // Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ownProfile, setOwnProfile] = useState<any>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [dailyPicks, setDailyPicks] = useState<any[]>([]);
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([]);
  
  // Navigation & Query States
  const [activeTab, setActiveTab] = useState<"new" | "daily" | "premium" | "my" | "near">("new");

  // Swipe Deck States & Physics
  const [currentIndex, setCurrentIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  
  // Filter States
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [religionFilter, setReligionFilter] = useState("all");
  const [maritalStatusFilter, setMaritalStatusFilter] = useState("all");
  const [casteFilter, setCasteFilter] = useState("all");
  const [educationFilter, setEducationFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [professionFilter, setProfessionFilter] = useState("all");

  const fetchData = async () => {
    try {
      const [ownRes, allRes] = await Promise.all([
        api.get("/profile").catch(() => ({ data: { success: false, data: null } })),
        api.get("/profile/all").catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (ownRes.data?.success && ownRes.data?.data) {
        setOwnProfile(ownRes.data.data);
      }
      if (allRes.data?.success && allRes.data?.data) {
        setAllProfiles(allRes.data.data);
      }
    } catch (error) {
      console.error("Fetch Matches Data Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentlyViewed = async () => {
    try {
      const stored = await AsyncStorage.getItem("recently_viewed_ids");
      if (stored) {
        setRecentlyViewedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to load recently viewed IDs:", e);
    }
  };

  const loadDailyPicks = useCallback(async () => {
    if (allProfiles.length === 0) return;
    try {
      const cachedIdsStr = await AsyncStorage.getItem("dailyMatches_profiles");
      const cachedTimeStr = await AsyncStorage.getItem("dailyMatches_timestamp");
      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;

      if (cachedIdsStr && cachedTimeStr) {
        const cachedTime = parseInt(cachedTimeStr, 10);
        if (now - cachedTime < oneDayMs) {
          const cachedIds = JSON.parse(cachedIdsStr);
          const matched = allProfiles.filter(p => cachedIds.includes(p.userId || p.id));
          if (matched.length > 0) {
            setDailyPicks(matched);
            return;
          }
        }
      }

      // Expired or missing: Shuffle and pick 15 random profiles
      const shuffled = [...allProfiles].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, 15);
      const selectedIds = selected.map(p => p.userId || p.id);

      await AsyncStorage.setItem("dailyMatches_profiles", JSON.stringify(selectedIds));
      await AsyncStorage.setItem("dailyMatches_timestamp", now.toString());
      setDailyPicks(selected);
    } catch (err) {
      console.error("Failed to load daily picks:", err);
      setDailyPicks(allProfiles.slice(0, 15));
    }
  }, [allProfiles]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
      loadRecentlyViewed();
    }, [])
  );

  useEffect(() => {
    if (allProfiles.length > 0) {
      loadDailyPicks();
    }
  }, [allProfiles, loadDailyPicks]);

  useEffect(() => {
    setCurrentIndex(0);
    onSubTabChange?.(activeTab);
  }, [activeTab, onSubTabChange]);

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentIndex(0);
    try {
      await AsyncStorage.removeItem("dailyMatches_profiles");
      await AsyncStorage.removeItem("dailyMatches_timestamp");
    } catch (e) {
      console.warn("Failed to clear daily matches cache:", e);
    }
    await Promise.all([fetchData(), loadRecentlyViewed()]);
    setRefreshing(false);
  };

  const handleViewProfile = async (profile: any) => {
    const profileId = profile.userId || profile.id;
    if (!profileId) return;

    try {
      const updated = [profileId, ...recentlyViewedIds.filter(id => id !== profileId)].slice(0, 30);
      setRecentlyViewedIds(updated);
      await AsyncStorage.setItem("recently_viewed_ids", JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to save recently viewed ID:", e);
    }

    navigation.navigate("ProfileDetail", { profile });
  };



  // Advanced Location-based Matching
  const nearMeProfiles = useMemo(() => {
    if (!ownProfile || allProfiles.length === 0) return [];
    const ownCity = (ownProfile.city || "").toLowerCase().trim();
    const ownState = (ownProfile.state || "").toLowerCase().trim();

    return allProfiles.filter(p => {
      if (p.userId === ownProfile.userId || p.id === ownProfile.id) return false;
      const pCity = (p.city || "").toLowerCase().trim();
      const pState = (p.state || "").toLowerCase().trim();
      return (ownCity && pCity === ownCity) || (ownState && pState === ownState);
    });
  }, [allProfiles, ownProfile]);

  const premiumProfiles = useMemo(() => {
    return allProfiles.filter(p => p.accountType === "Premium" || p.isPremium);
  }, [allProfiles]);

  const viewedProfiles = useMemo(() => {
    return allProfiles.filter(p => recentlyViewedIds.includes(p.userId || p.id));
  }, [allProfiles, recentlyViewedIds]);

  // Tab Badge Counts
  const tabCounts = useMemo(() => {
    return {
      new: allProfiles.length,
      daily: dailyPicks.length,
      premium: premiumProfiles.length,
      my: allProfiles.length,
      near: nearMeProfiles.length,
    };
  }, [allProfiles, dailyPicks, premiumProfiles, nearMeProfiles]);

  const castesList = useMemo(() => {
    const defaultCastes = ["All", "Brahmin", "Kshatriya", "Vaishya", "Shudra", "Maratha", "Patel", "Yadav", "Jat", "Gupta", "Sharma", "Others"];
    const list = allProfiles
      .map(p => p.caste)
      .filter((c): c is string => !!c && c.trim().length > 0)
      .map(c => c.trim().charAt(0).toUpperCase() + c.trim().slice(1));
    return Array.from(new Set([...defaultCastes, ...list]));
  }, [allProfiles]);

  const educationList = useMemo(() => {
    const defaultEdus = ["All", "Doctorate", "Masters", "Bachelors", "Diploma", "High School"];
    const list = allProfiles
      .map(p => p.highestDegree || p.education)
      .filter((e): e is string => !!e && e.trim().length > 0)
      .map(e => e.trim().charAt(0).toUpperCase() + e.trim().slice(1));
    return Array.from(new Set([...defaultEdus, ...list]));
  }, [allProfiles]);

  const languagesList = useMemo(() => {
    const defaultLangs = ["All", "Hindi", "English", "Punjabi", "Marathi", "Gujarati", "Bengali", "Tamil", "Telugu", "Kannada", "Malayalam", "Urdu"];
    const list = allProfiles
      .map(p => p.motherTongue || p.language)
      .filter((l): l is string => !!l && l.trim().length > 0)
      .map(l => l.trim().charAt(0).toUpperCase() + l.trim().slice(1));
    return Array.from(new Set([...defaultLangs, ...list]));
  }, [allProfiles]);

  const professionsList = useMemo(() => {
    const defaultProfs = ["All", "Software Engineer", "Doctor", "Teacher", "Business", "Manager", "Lawyer", "Accountant", "Engineer", "Others"];
    const list = allProfiles
      .map(p => p.profession)
      .filter((pr): pr is string => !!pr && pr.trim().length > 0)
      .map(pr => pr.trim().charAt(0).toUpperCase() + pr.trim().slice(1));
    return Array.from(new Set([...defaultProfs, ...list]));
  }, [allProfiles]);

  // Raw Active list before filters
  const activeTabProfiles = useMemo(() => {
    switch (activeTab) {
      case "new":
        return [...allProfiles].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case "daily":
        return dailyPicks;
      case "premium":
        return premiumProfiles;
      case "my":
        return allProfiles;
      case "near":
        return nearMeProfiles;
      default:
        return [];
    }
  }, [activeTab, allProfiles, dailyPicks, premiumProfiles, nearMeProfiles]);

  // Apply Search Query and Filters
  const filteredProfiles = useMemo(() => {
    let result = [...activeTabProfiles];

    // Advanced Filters (Disabled when Daily Matches is active)
    if (activeTab !== "daily") {
      if (religionFilter !== "all") {
        result = result.filter(p => (p.religion || "").toLowerCase() === religionFilter.toLowerCase());
      }
      if (maritalStatusFilter !== "all") {
        result = result.filter(p => (p.maritalStatus || "").toLowerCase() === maritalStatusFilter.toLowerCase());
      }
      if (casteFilter !== "all") {
        result = result.filter(p => (p.caste || "").toLowerCase() === casteFilter.toLowerCase());
      }
      if (educationFilter !== "all") {
        result = result.filter(p => {
          const edu = (p.highestDegree || p.education || "").toLowerCase();
          return edu === educationFilter.toLowerCase();
        });
      }
      if (languageFilter !== "all") {
        result = result.filter(p => {
          const lang = (p.motherTongue || p.language || "").toLowerCase();
          return lang === languageFilter.toLowerCase();
        });
      }
      if (professionFilter !== "all") {
        result = result.filter(p => (p.profession || "").toLowerCase() === professionFilter.toLowerCase());
      }
    }

    return result;
  }, [
    activeTabProfiles,
    activeTab,
    religionFilter,
    maritalStatusFilter,
    casteFilter,
    educationFilter,
    languageFilter,
    professionFilter
  ]);

  const handleSwipeRight = useCallback(async (profile: any) => {
    const receiverId = profile.userId || profile.id;
    if (!receiverId) return;
    try {
      const res = await api.post('/interests', { receiverId });
      if (res.data?.success) {
        showToast("Interest Sent successfully! 💖");
      } else {
        showToast(res.data?.message || "Failed to send interest.");
      }
    } catch (err: any) {
      console.warn("Failed to send interest via swipe:", err);
      showToast("Failed to send interest.");
    }
  }, []);

  const handleSwipeLeft = useCallback((profile: any) => {
    // Optional skip logging
  }, []);

  const onSwipeComplete = useCallback((direction: "right" | "left") => {
    const item = filteredProfiles[currentIndex];
    if (item) {
      if (direction === "right") {
        handleSwipeRight(item);
      } else {
        handleSwipeLeft(item);
      }
    }
    position.setValue({ x: 0, y: 0 });
    setCurrentIndex((prev) => prev + 1);
  }, [filteredProfiles, currentIndex, position, handleSwipeRight, handleSwipeLeft]);

  const forceSwipe = useCallback((direction: "right" | "left") => {
    const x = direction === "right" ? width + 100 : -width - 100;
    Animated.timing(position, {
      toValue: { x, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(() => onSwipeComplete(direction));
  }, [position, onSwipeComplete]);

  const resetPosition = useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [position]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > 120) {
          forceSwipe("right");
        } else if (gesture.dx < -120) {
          forceSwipe("left");
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const renderTopCard = (profile: any) => {
    const isBlocked = !!profile.isBlockedByMe;

    const rotate = position.x.interpolate({
      inputRange: [-width / 2, 0, width / 2],
      outputRange: ["-10deg", "0deg", "10deg"],
      extrapolate: "clamp",
    });

    const likeOpacity = position.x.interpolate({
      inputRange: [0, 100],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });

    const nopeOpacity = position.x.interpolate({
      inputRange: [-100, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });

    const animatedCardStyles = {
      transform: [
        { rotate },
        ...position.getTranslateTransform(),
      ],
    };

    const photoUrl = profile.photos?.find((p: any) => p.isMain === true || p.isMain === 1 || p.isMain === "1")?.url || profile.photos?.[0]?.url;
    const resolvedPhoto = photoUrl ? resolvePhotoUrl(photoUrl) : null;

    return (
      <Animated.View
        key={profile.id || profile.userId}
        style={[styles.card, animatedCardStyles]}
        {...(isBlocked ? {} : panResponder.panHandlers)}
      >
        {resolvedPhoto ? (
          <Image source={{ uri: resolvedPhoto }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <User size={80} color="rgba(255, 255, 255, 0.4)" />
          </View>
        )}

        <Animated.View style={[styles.indicatorContainer, styles.likeIndicator, { opacity: likeOpacity }]}>
          <Text style={styles.indicatorTextLike}>LIKE</Text>
        </Animated.View>

        <Animated.View style={[styles.indicatorContainer, styles.nopeIndicator, { opacity: nopeOpacity }]}>
          <Text style={styles.indicatorTextNope}>NOPE</Text>
        </Animated.View>

        <View style={styles.cardInfo}>
          <View style={styles.cardInfoNameRow}>
            <Text style={styles.cardInfoName}>
              {profile.firstName} {profile.lastName}, {profile.age || "26"}
            </Text>
            {profile.isKycVerified && (
              <BadgeCheck size={18} color={accentColor} style={{ marginLeft: 6 }} />
            )}
          </View>

          <View style={styles.cardInfoDetailRow}>
            <Briefcase size={13} color="#D4AF37" style={{ marginRight: 6 }} />
            <Text style={styles.cardInfoDetailText}>
              {profile.profession || "Profession"}{profile.highestDegree ? ` • ${profile.highestDegree}` : ""}
            </Text>
          </View>

          <View style={styles.cardInfoDetailRow}>
            <Sparkles size={13} color="#D4AF37" style={{ marginRight: 6 }} />
            <Text style={styles.cardInfoDetailText}>
              {(profile.religion || profile.caste) ? `${profile.religion || ""}${profile.caste ? `, ${profile.caste}` : ""}` : "Not Specified"}{profile.motherTongue ? ` • ${profile.motherTongue}` : ""}
            </Text>
          </View>

          <View style={styles.cardInfoDetailRow}>
            <MapPin size={13} color="#D4AF37" style={{ marginRight: 6 }} />
            <Text style={styles.cardInfoDetailText}>
              {(profile.city || profile.state) ? `${profile.city}, ${profile.state}` : "Location not set"}
            </Text>
          </View>

          <View style={styles.cardOverlayButtons}>
            <TouchableOpacity
              style={[styles.cardCompactBtn, styles.skipBtn]}
              onPress={() => forceSwipe("left")}
              activeOpacity={0.8}
            >
              <X size={22} color="#FF3B30" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cardCompactBtn, styles.infoBtn]}
              onPress={() => handleViewProfile(profile)}
              activeOpacity={0.8}
            >
              <Info size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cardCompactBtn, styles.likeBtn]}
              onPress={() => forceSwipe("right")}
              activeOpacity={0.8}
            >
              <Heart size={22} color="#4CAF50" fill="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>

        {isBlocked && (
          <View style={StyleSheet.absoluteFill}>
            <View style={styles.blockedCardOverlayContainer}>
              <View style={styles.blockedIconContainer}>
                <Ban size={40} color="#FF3B30" />
              </View>
              <Text style={styles.blockedCardTitle}>Profile Blocked</Text>
              <Text style={styles.blockedCardText}>This user is blocked by you.</Text>
              <TouchableOpacity
                style={styles.manageBlocksBtn}
                onPress={() => navigation.navigate("AccountSetting")}
                activeOpacity={0.8}
              >
                <Text style={styles.manageBlocksBtnText}>Manage Blocked Profiles</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.blockedSkipBtn}
                onPress={() => forceSwipe("left")}
                activeOpacity={0.8}
              >
                <Text style={styles.blockedSkipBtnText}>Skip Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  const renderBackCard = (profile: any) => {
    const photoUrl = profile.photos?.find((p: any) => p.isMain === true || p.isMain === 1 || p.isMain === "1")?.url || profile.photos?.[0]?.url;
    const resolvedPhoto = photoUrl ? resolvePhotoUrl(photoUrl) : null;

    return (
      <View
        key={profile.id || profile.userId}
        style={[styles.card, styles.backCard]}
      >
        {resolvedPhoto ? (
          <Image source={{ uri: resolvedPhoto }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <User size={80} color="rgba(255, 255, 255, 0.4)" />
          </View>
        )}

        <View style={styles.cardInfo}>
          <View style={styles.cardInfoNameRow}>
            <Text style={styles.cardInfoName}>
              {profile.firstName} {profile.lastName}, {profile.age || "26"}
            </Text>
          </View>

          <View style={styles.cardInfoDetailRow}>
            <Briefcase size={13} color="#D4AF37" style={{ marginRight: 6 }} />
            <Text style={styles.cardInfoDetailText}>
              {profile.profession || "Profession"}{profile.highestDegree ? ` • ${profile.highestDegree}` : ""}
            </Text>
          </View>

          <View style={styles.cardInfoDetailRow}>
            <MapPin size={13} color="#D4AF37" style={{ marginRight: 6 }} />
            <Text style={styles.cardInfoDetailText}>
              {(profile.city || profile.state) ? `${profile.city}, ${profile.state}` : "Location"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCardStack = () => {
    if (currentIndex >= filteredProfiles.length) {
      return (
        <View style={styles.deckEmptyState}>
          <Heart size={54} color="#E0E0E0" />
          <Text style={styles.emptyTitle}>End of Recommendations</Text>
          <Text style={styles.emptyText}>
            You have viewed all daily recommendations. Check back tomorrow for more matches!
          </Text>
          <TouchableOpacity
            style={[styles.resetBtn, { backgroundColor: deepPurple, marginTop: 20 }]}
            onPress={onRefresh}
          >
            <Text style={[styles.resetBtnText, { color: accentColor }]}>Refresh Daily Matches</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.deckContainer}>
        {filteredProfiles
          .map((profile, index) => {
            if (index < currentIndex) {
              return null;
            }
            if (index === currentIndex) {
              return renderTopCard(profile);
            }
            if (index === currentIndex + 1) {
              return renderBackCard(profile);
            }
            return null;
          })
          .reverse()}
      </View>
    );
  };

  const handleResetFilters = () => {
    setReligionFilter("all");
    setMaritalStatusFilter("all");
    setCasteFilter("all");
    setEducationFilter("all");
    setLanguageFilter("all");
    setProfessionFilter("all");
    setFilterModalVisible(false);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (religionFilter !== "all") count++;
    if (maritalStatusFilter !== "all") count++;
    if (casteFilter !== "all") count++;
    if (educationFilter !== "all") count++;
    if (languageFilter !== "all") count++;
    if (professionFilter !== "all") count++;
    return count;
  }, [religionFilter, maritalStatusFilter, casteFilter, educationFilter, languageFilter, professionFilter]);

  const renderTabsBar = () => {
    return (
      <View style={styles.tabsRowContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
          style={styles.tabsScrollView}
        >
          {/* Tab 1: New Arrival */}
          <TouchableOpacity
            style={[styles.tabItem, activeTab === "new" && styles.tabItemActive]}
            onPress={() => setActiveTab("new")}
          >
            <Sparkles size={12} color={activeTab === "new" ? accentColor : deepPurple} />
            <Text style={[styles.tabLabel, activeTab === "new" && styles.tabLabelActive]}>New Arrival</Text>
            <View style={[styles.tabBadge, activeTab === "new" ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
              <Text style={[styles.tabBadgeText, activeTab === "new" && styles.tabBadgeTextActive]}>{tabCounts.new}</Text>
            </View>
          </TouchableOpacity>

          {/* Tab 2: Daily Matches */}
          <TouchableOpacity
            style={[styles.tabItem, activeTab === "daily" && styles.tabItemActive]}
            onPress={() => setActiveTab("daily")}
          >
            <Heart size={12} color={activeTab === "daily" ? accentColor : deepPurple} />
            <Text style={[styles.tabLabel, activeTab === "daily" && styles.tabLabelActive]}>Daily Matches</Text>
            <View style={[styles.tabBadge, activeTab === "daily" ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
              <Text style={[styles.tabBadgeText, activeTab === "daily" && styles.tabBadgeTextActive]}>{tabCounts.daily}</Text>
            </View>
          </TouchableOpacity>

          {/* Tab 3: Premium */}
          <TouchableOpacity
            style={[styles.tabItem, activeTab === "premium" && styles.tabItemActive]}
            onPress={() => setActiveTab("premium")}
          >
            <Crown size={12} color={activeTab === "premium" ? accentColor : deepPurple} />
            <Text style={[styles.tabLabel, activeTab === "premium" && styles.tabLabelActive]}>Premium</Text>
            <View style={[styles.tabBadge, activeTab === "premium" ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
              <Text style={[styles.tabBadgeText, activeTab === "premium" && styles.tabBadgeTextActive]}>{tabCounts.premium}</Text>
            </View>
          </TouchableOpacity>

          {/* Tab 4: My Matches */}
          <TouchableOpacity
            style={[styles.tabItem, activeTab === "my" && styles.tabItemActive]}
            onPress={() => setActiveTab("my")}
          >
            <User size={12} color={activeTab === "my" ? accentColor : deepPurple} />
            <Text style={[styles.tabLabel, activeTab === "my" && styles.tabLabelActive]}>My Matches</Text>
            <View style={[styles.tabBadge, activeTab === "my" ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
              <Text style={[styles.tabBadgeText, activeTab === "my" && styles.tabBadgeTextActive]}>{tabCounts.my}</Text>
            </View>
          </TouchableOpacity>

          {/* Tab 5: Near Me */}
          <TouchableOpacity
            style={[styles.tabItem, activeTab === "near" && styles.tabItemActive]}
            onPress={() => setActiveTab("near")}
          >
            <MapPin size={12} color={activeTab === "near" ? accentColor : deepPurple} />
            <Text style={[styles.tabLabel, activeTab === "near" && styles.tabLabelActive]}>Near Me</Text>
            <View style={[styles.tabBadge, activeTab === "near" ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
              <Text style={[styles.tabBadgeText, activeTab === "near" && styles.tabBadgeTextActive]}>{tabCounts.near}</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {activeTab === "daily" ? (
          filteredProfiles.length > 0 && currentIndex < filteredProfiles.length && (
            <View style={styles.deckProgressBadge}>
              <Text style={styles.deckProgressBadgeText}>
                {currentIndex + 1}/{filteredProfiles.length}
              </Text>
            </View>
          )
        ) : (
          <View style={styles.tabsActions}>
            <TouchableOpacity
              style={[styles.compactActionBtn, { backgroundColor: softPurple }]}
              onPress={() => setFilterModalVisible(true)}
            >
              <SlidersHorizontal size={16} color={deepPurple} />
              {activeFiltersCount > 0 && (
                <View style={styles.filterBadgeCompact}>
                  <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderMoreSubTabs = () => {
    return null;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Heart size={54} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Profiles Found</Text>
      <Text style={styles.emptyText}>
        We couldn't find any matches matching your criteria in this section. Try adjusting your filters.
      </Text>
      {(religionFilter !== "all" || maritalStatusFilter !== "all" || casteFilter !== "all" || educationFilter !== "all" || languageFilter !== "all" || professionFilter !== "all") && (
        <TouchableOpacity
          style={[styles.resetBtn, { backgroundColor: deepPurple }]}
          onPress={handleResetFilters}
        >
          <Text style={[styles.resetBtnText, { color: accentColor }]}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: themeBg, paddingTop: topPadding }]} 
      edges={["left", "right"]}
    >
      {renderTabsBar()}
      {renderMoreSubTabs()}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={deepPurple} />
          <Text style={styles.loadingText}>Searching matches...</Text>
        </View>
      ) : activeTab === "daily" ? (
        <View style={[styles.deckTabContainer, { paddingBottom: insets.bottom + 20 }]}>
          {renderCardStack()}
        </View>
      ) : (
        <FlatList
          data={filteredProfiles}
          keyExtractor={(item) => item.id || item.userId || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[deepPurple]}
            />
          }
          renderItem={({ item }) => {
            if (item.isBlockedByMe) {
              return (
                <View style={styles.blockedProfileCardGrid}>
                  <View style={styles.blockedProfileGridOverlay}>
                    <Text style={styles.blockedProfileGridText}>This user is blocked by you.</Text>
                    <TouchableOpacity 
                      onPress={() => navigation.navigate("AccountSetting")}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.blockedProfileGridLink}>Manage Blocked Profiles</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }
            return (
              <ProfileCard
                profile={item}
                type="grid"
                layout="horizontal"
                onPress={() => handleViewProfile(item)}
              />
            );
          }}
        />
      )}

      {/* Filter Modal Overlay */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Refine Your Matches</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.closeModalBtn}>
                <X size={20} color={deepPurple} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>


              {/* Religion Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Religion</Text>
                <View style={styles.pillRow}>
                  {RELIGIONS.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.pill,
                        religionFilter.toLowerCase() === r.toLowerCase() && [styles.pillActive, { backgroundColor: deepPurple }]
                      ]}
                      onPress={() => setReligionFilter(r.toLowerCase())}
                    >
                      <Text style={[styles.pillText, religionFilter.toLowerCase() === r.toLowerCase() && { color: accentColor }]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Marital Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Marital Status</Text>
                <View style={styles.pillRow}>
                  {MARITAL_STATUSES.map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.pill,
                        maritalStatusFilter.toLowerCase() === m.toLowerCase() && [styles.pillActive, { backgroundColor: deepPurple }]
                      ]}
                      onPress={() => setMaritalStatusFilter(m.toLowerCase())}
                    >
                      <Text style={[styles.pillText, maritalStatusFilter.toLowerCase() === m.toLowerCase() && { color: accentColor }]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Caste Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Caste</Text>
                <View style={styles.pillRow}>
                  {castesList.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.pill,
                        casteFilter.toLowerCase() === c.toLowerCase() && [styles.pillActive, { backgroundColor: deepPurple }]
                      ]}
                      onPress={() => setCasteFilter(c.toLowerCase())}
                    >
                      <Text style={[styles.pillText, casteFilter.toLowerCase() === c.toLowerCase() && { color: accentColor }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Education Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Education</Text>
                <View style={styles.pillRow}>
                  {educationList.map((e) => (
                    <TouchableOpacity
                      key={e}
                      style={[
                        styles.pill,
                        educationFilter.toLowerCase() === e.toLowerCase() && [styles.pillActive, { backgroundColor: deepPurple }]
                      ]}
                      onPress={() => setEducationFilter(e.toLowerCase())}
                    >
                      <Text style={[styles.pillText, educationFilter.toLowerCase() === e.toLowerCase() && { color: accentColor }]}>{e}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Mother Tongue Language Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Mother Tongue / Language</Text>
                <View style={styles.pillRow}>
                  {languagesList.map((l) => (
                    <TouchableOpacity
                      key={l}
                      style={[
                        styles.pill,
                        languageFilter.toLowerCase() === l.toLowerCase() && [styles.pillActive, { backgroundColor: deepPurple }]
                      ]}
                      onPress={() => setLanguageFilter(l.toLowerCase())}
                    >
                      <Text style={[styles.pillText, languageFilter.toLowerCase() === l.toLowerCase() && { color: accentColor }]}>{l}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Profession Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Profession</Text>
                <View style={styles.pillRow}>
                  {professionsList.map((pr) => (
                    <TouchableOpacity
                      key={pr}
                      style={[
                        styles.pill,
                        professionFilter.toLowerCase() === pr.toLowerCase() && [styles.pillActive, { backgroundColor: deepPurple }]
                      ]}
                      onPress={() => setProfessionFilter(pr.toLowerCase())}
                    >
                      <Text style={[styles.pillText, professionFilter.toLowerCase() === pr.toLowerCase() && { color: accentColor }]}>{pr}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.resetModalBtn} onPress={handleResetFilters}>
                <Text style={styles.resetModalBtnText}>Reset All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.applyModalBtn, { backgroundColor: deepPurple }]} 
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={[styles.applyModalBtnText, { color: accentColor }]}>Apply Filters</Text>
              </TouchableOpacity>
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
  tabsRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginVertical: 10,
    height: 40,
  },
  tabsScrollView: {
    flex: 1,
  },
  tabsScrollContent: {
    gap: 8,
    alignItems: "center",
  },
  tabsActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 8,
  },
  compactActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeCompact: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#D4AF37",
    borderRadius: 7,
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  filterBadgeText: {
    color: "#3B1E54",
    fontSize: 8,
    ...fonts.bold,
  },
  deckProgressBadge: {
    backgroundColor: "rgba(59, 30, 84, 0.08)",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    alignSelf: "center",
  },
  deckProgressBadgeText: {
    fontSize: 11,
    color: "#3B1E54",
    ...fonts.semibold,
  },
  searchHeaderRow: {
    paddingHorizontal: 16,
    marginVertical: 10,
    height: 40,
    justifyContent: "center",
  },
  searchInnerCompact: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  searchIconCompact: {
    marginRight: 6,
  },
  searchInputCompact: {
    flex: 1,
    fontSize: 13,
    ...fonts.medium,
    paddingVertical: 4,
  },
  clearSearchBtnCompact: {
    padding: 4,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 30, 84, 0.04)",
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
    height: 38,
  },
  tabItemActive: {
    backgroundColor: "#3B1E54",
  },
  tabLabel: {
    fontSize: 13,
    ...fonts.semibold,
    color: "#7E6B8F",
  },
  tabLabelActive: {
    color: "#D4AF37",
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeActive: {
    backgroundColor: "#D4AF37",
  },
  tabBadgeInactive: {
    backgroundColor: "rgba(59, 30, 84, 0.08)",
  },
  tabBadgeText: {
    fontSize: 9,
    ...fonts.bold,
    color: "#3B1E54",
  },
  tabBadgeTextActive: {
    color: "#3B1E54",
  },
  subTabsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 15,
  },
  subTabItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 30, 84, 0.04)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 5,
  },
  subTabItemActive: {
    backgroundColor: "#3B1E54",
  },
  subTabLabel: {
    fontSize: 11,
    ...fonts.semibold,
    color: "#7E6B8F",
  },
  subTabLabelActive: {
    color: "#FFFFFF",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    flexGrow: 1,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#7E6B8F",
    ...fonts.medium,
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    ...fonts.semibold,
    color: "#3B1E54",
    marginTop: 15,
  },
  emptyText: {
    fontSize: 13,
    color: "#7E6B8F",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  resetBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  resetBtnText: {
    fontSize: 13,
    ...fonts.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: "80%",
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(59, 30, 84, 0.08)",
  },
  modalTitle: {
    fontSize: 18,
    ...fonts.semibold,
    color: "#3B1E54",
  },
  closeModalBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 24,
    paddingVertical: 15,
  },
  filterSection: {
    marginBottom: 25,
  },
  filterLabel: {
    fontSize: 14,
    ...fonts.semibold,
    color: "#3B1E54",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(59, 30, 84, 0.04)",
    borderWidth: 1,
    borderColor: "transparent",
  },
  pillActive: {
    borderColor: "#D4AF37",
  },
  pillText: {
    fontSize: 13,
    ...fonts.semibold,
    color: "#3B1E54",
  },
  modalFooter: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(59, 30, 84, 0.08)",
    gap: 12,
  },
  resetModalBtn: {
    flex: 1,
    height: 52,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: "#3B1E54",
    alignItems: "center",
    justifyContent: "center",
  },
  resetModalBtnText: {
    fontSize: 14,
    ...fonts.semibold,
    color: "#3B1E54",
  },
  applyModalBtn: {
    flex: 2,
    height: 52,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  applyModalBtnText: {
    fontSize: 14,
    ...fonts.semibold,
  },
  deckTabContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  deckContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    position: "absolute",
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(59, 30, 84, 0.12)",
    backgroundColor: "#1F0A33",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
    overflow: "hidden",
  },
  backCard: {
    transform: [{ scale: 0.95 }, { translateY: 15 }],
    opacity: 0.9,
    zIndex: -1,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#2E114D",
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorContainer: {
    position: "absolute",
    top: 35,
    borderWidth: 4,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 5,
    zIndex: 100,
  },
  likeIndicator: {
    left: 35,
    borderColor: "#4CAF50",
    transform: [{ rotate: "-15deg" }],
  },
  nopeIndicator: {
    right: 35,
    borderColor: "#FF3B30",
    transform: [{ rotate: "15deg" }],
  },
  indicatorTextLike: {
    color: "#4CAF50",
    fontSize: 28,
    ...fonts.bold,
  },
  indicatorTextNope: {
    color: "#FF3B30",
    fontSize: 28,
    ...fonts.bold,
  },
  cardInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  cardInfoNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  cardInfoName: {
    fontSize: 20,
    ...fonts.bold,
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3.5,
  },
  cardInfoDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  cardInfoDetailText: {
    fontSize: 13,
    color: "#FFFFFF",
    ...fonts.medium,
    textShadowColor: "rgba(0, 0, 0, 0.9)",
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 3.5,
  },
  cardOverlayButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 15,
    width: "100%",
  },
  cardCompactBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  skipBtn: {
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.15)",
  },
  infoBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  likeBtn: {
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.15)",
  },
  deckEmptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  blockedCardOverlayContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 10, 25, 0.92)",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    zIndex: 1000,
  },
  blockedIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 59, 48, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  blockedCardTitle: {
    fontSize: 20,
    ...fonts.bold,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  blockedCardText: {
    fontSize: 14,
    color: "#BCA6CC",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  manageBlocksBtn: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    width: "85%",
    alignItems: "center",
  },
  manageBlocksBtnText: {
    fontSize: 14,
    ...fonts.bold,
    color: "#3B1E54",
  },
  blockedSkipBtn: {
    paddingVertical: 10,
  },
  blockedSkipBtnText: {
    fontSize: 14,
    ...fonts.semibold,
    color: "#FFFFFF",
    opacity: 0.8,
  },
  blockedProfileCardGrid: {
    backgroundColor: "#FDFBFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.2)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  blockedProfileGridOverlay: {
    alignItems: "center",
    justifyContent: "center",
  },
  blockedProfileGridText: {
    fontSize: 14,
    ...fonts.semibold,
    color: "#3B1E54",
    marginBottom: 4,
  },
  blockedProfileGridLink: {
    fontSize: 13,
    ...fonts.bold,
    color: "#D4AF37",
    textDecorationLine: "underline",
  },
});
