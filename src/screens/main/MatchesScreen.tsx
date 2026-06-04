import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Alert
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
  UserCheck
} from "lucide-react-native";
import { palette } from "../../theme/colors";
import api from "../../services/api";
import { ProfileCard } from "../../components/ProfileCard";
import { fonts } from "@/src/theme";

const { width } = Dimensions.get("window");

const RELIGIONS = ["All", "Hindu", "Muslim", "Christian", "Sikh", "Jain", "Buddhist", "Others"];
const MARITAL_STATUSES = ["All", "Never Married", "Divorced", "Widowed", "Awaiting Divorce"];

export default function MatchesScreen() {
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
  const [searchQuery, setSearchQuery] = useState("");
  
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

  const onRefresh = async () => {
    setRefreshing(true);
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

    // Search Query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => {
        const first = (p.firstName || "").toLowerCase();
        const last = (p.lastName || "").toLowerCase();
        return first.includes(q) || last.includes(q);
      });
    }

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
    searchQuery,
    activeTab,
    religionFilter,
    maritalStatusFilter,
    casteFilter,
    educationFilter,
    languageFilter,
    professionFilter
  ]);

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

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={[styles.searchInner, { backgroundColor: softPurple }]}>
        <Search size={18} color={mutedText} style={styles.searchIcon} />
        <TextInput
          placeholder="Search matches by name..."
          placeholderTextColor={mutedText}
          style={[styles.searchInput, { color: textColor }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearSearchBtn}>
            <X size={16} color={mutedText} />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.filterIconBtn,
          { backgroundColor: softPurple },
          activeTab === "daily" && { opacity: 0.4 }
        ]}
        disabled={activeTab === "daily"}
        onPress={() => setFilterModalVisible(true)}
      >
        <SlidersHorizontal size={22} color={deepPurple} />
        {activeTab !== "daily" && activeFiltersCount > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderTabsBar = () => (
    <View style={styles.tabsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScrollContent}
      >
        {/* Tab 1: New Arrival */}
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "new" && styles.tabItemActive]}
          onPress={() => { setActiveTab("new"); setSearchQuery(""); }}
        >
          <Sparkles size={14} color={activeTab === "new" ? accentColor : deepPurple} />
          <Text style={[styles.tabLabel, activeTab === "new" && styles.tabLabelActive]}>New Arrival</Text>
          <View style={[styles.tabBadge, activeTab === "new" ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
            <Text style={[styles.tabBadgeText, activeTab === "new" && styles.tabBadgeTextActive]}>{tabCounts.new}</Text>
          </View>
        </TouchableOpacity>

        {/* Tab 2: Daily Matches */}
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "daily" && styles.tabItemActive]}
          onPress={() => { setActiveTab("daily"); setSearchQuery(""); }}
        >
          <Heart size={14} color={activeTab === "daily" ? accentColor : deepPurple} />
          <Text style={[styles.tabLabel, activeTab === "daily" && styles.tabLabelActive]}>Daily Matches</Text>
          <View style={[styles.tabBadge, activeTab === "daily" ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
            <Text style={[styles.tabBadgeText, activeTab === "daily" && styles.tabBadgeTextActive]}>{tabCounts.daily}</Text>
          </View>
        </TouchableOpacity>

        {/* Tab 3: Premium */}
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "premium" && styles.tabItemActive]}
          onPress={() => { setActiveTab("premium"); setSearchQuery(""); }}
        >
          <Crown size={14} color={activeTab === "premium" ? accentColor : deepPurple} />
          <Text style={[styles.tabLabel, activeTab === "premium" && styles.tabLabelActive]}>Premium</Text>
          <View style={[styles.tabBadge, activeTab === "premium" ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
            <Text style={[styles.tabBadgeText, activeTab === "premium" && styles.tabBadgeTextActive]}>{tabCounts.premium}</Text>
          </View>
        </TouchableOpacity>

        {/* Tab 3: My Matches */}
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "my" && styles.tabItemActive]}
          onPress={() => { setActiveTab("my"); setSearchQuery(""); }}
        >
          <User size={14} color={activeTab === "my" ? accentColor : deepPurple} />
          <Text style={[styles.tabLabel, activeTab === "my" && styles.tabLabelActive]}>My Matches</Text>
          <View style={[styles.tabBadge, activeTab === "my" ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
            <Text style={[styles.tabBadgeText, activeTab === "my" && styles.tabBadgeTextActive]}>{tabCounts.my}</Text>
          </View>
        </TouchableOpacity>

        {/* Tab 4: Near Me */}
        <TouchableOpacity
          style={[styles.tabItem, activeTab === "near" && styles.tabItemActive]}
          onPress={() => { setActiveTab("near"); setSearchQuery(""); }}
        >
          <MapPin size={14} color={activeTab === "near" ? accentColor : deepPurple} />
          <Text style={[styles.tabLabel, activeTab === "near" && styles.tabLabelActive]}>Near Me</Text>
          <View style={[styles.tabBadge, activeTab === "near" ? styles.tabBadgeActive : styles.tabBadgeInactive]}>
            <Text style={[styles.tabBadgeText, activeTab === "near" && styles.tabBadgeTextActive]}>{tabCounts.near}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  const renderMoreSubTabs = () => {
    return null;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Heart size={54} color="#E0E0E0" />
      <Text style={styles.emptyTitle}>No Profiles Found</Text>
      <Text style={styles.emptyText}>
        We couldn't find any matches matching your criteria in this section. Try adjusting your search query or filters.
      </Text>
      {(religionFilter !== "all" || maritalStatusFilter !== "all" || casteFilter !== "all" || educationFilter !== "all" || languageFilter !== "all" || professionFilter !== "all" || searchQuery.length > 0) && (
        <TouchableOpacity
          style={[styles.resetBtn, { backgroundColor: deepPurple }]}
          onPress={() => {
            setSearchQuery("");
            handleResetFilters();
          }}
        >
          <Text style={[styles.resetBtnText, { color: accentColor }]}>Clear Search & Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: themeBg, paddingTop: topPadding }]} 
      edges={["left", "right"]}
    >
      {renderHeader()}
      {renderTabsBar()}
      {renderMoreSubTabs()}

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={deepPurple} />
          <Text style={styles.loadingText}>Searching matches...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProfiles}
          keyExtractor={(item) => item.id || item.userId || Math.random().toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[deepPurple]}
            />
          }
          renderItem={({ item }) => (
            <ProfileCard
              profile={item}
              type="grid"
              onPress={() => handleViewProfile(item)}
            />
          )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    gap: 10,
  },
  filterIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "rgba(59, 30, 84, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#D4AF37",
    borderRadius: 9,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  filterBadgeText: {
    color: "#3B1E54",
    fontSize: 9,
    ...fonts.semibold,
  },
  searchInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 30, 84, 0.04)",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1A1A1A",
    ...fonts.medium,
    paddingVertical: 8,
  },
  clearSearchBtn: {
    padding: 4,
  },
  tabsContainer: {
    marginBottom: 15,
  },
  tabsScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
    height: 40,
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
});
