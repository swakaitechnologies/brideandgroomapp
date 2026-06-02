import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  Sparkles,
  Heart,
  BadgeCheck,
  Crown,
  User,
  Languages,
  Briefcase,
  MapPin,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  ChevronRight,
  PhoneCall,
  Eye,
  ImageIcon,
  UserX,
  UserCheck,
} from "lucide-react-native";
import { palette } from "../../theme/colors";
import {
  getInterests,
  getContactRequests,
  getPhotoRequests,
  getProfileViewers,
  handleInterestResponse,
  handleContactResponse,
  handlePhotoRequestResponse,
  resolvePhotoUrl,
  getShortlisted,
  sendInterest,
  getAllProfiles,
  getLikes,
  toggleLike,
} from "../../services/api";
import { showToast } from "../../utils/toast";
import { fonts } from "@/src/theme";

const { width } = Dimensions.get("window");

type MainTabType = "Received" | "Accepted" | "Likes" | "Shortlist" | "Contact" | "Sent" | "More";
type AcceptedSubTabType = "byThem" | "byMe";
type LikesSubTabType = "likedYou" | "likedByMe";
type ContactSubTabType = "contactViewed" | "viewedYou";
type MoreSubTabType = "viewed" | "visitors" | "photoRequests" | "deleted";

interface ConnectionItem {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  type?: string; // photo request, contact request, interest
  profile: {
    userId?: string;
    firstName: string;
    lastName: string;
    city: string;
    state: string;
    dob: string;
    gender: string;
    profession: string;
    height?: string;
    language?: string;
    motherTongue?: string;
    caste?: string;
    isPremium?: boolean;
    isVerified?: boolean;
    photos?: { url: string; isMain: boolean }[];
  };
}

export default function UpdatesScreen({ setActiveTab }: { setActiveTab?: (tab: string) => void }) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + 80;

  // Tabs states
  const [activeTab, setActiveTabState] = useState<MainTabType>("Received");
  const [acceptedSubTab, setAcceptedSubTab] = useState<AcceptedSubTabType>("byThem");
  const [contactSubTab, setContactSubTab] = useState<ContactSubTabType>("contactViewed");
  const [likesSubTab, setLikesSubTab] = useState<LikesSubTabType>("likedYou");
  const [moreSubTab, setMoreSubTab] = useState<MoreSubTabType>("viewed");

  // Data states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Connection data collections
  const [receivedInterests, setReceivedInterests] = useState<ConnectionItem[]>([]);
  const [acceptedByThem, setAcceptedByThem] = useState<ConnectionItem[]>([]);
  const [acceptedByMe, setAcceptedByMe] = useState<ConnectionItem[]>([]);
  const [contactViewed, setContactViewed] = useState<ConnectionItem[]>([]);
  const [viewedYou, setViewedYou] = useState<ConnectionItem[]>([]);
  const [sentInterests, setSentInterests] = useState<ConnectionItem[]>([]);
  const [likedYou, setLikedYou] = useState<ConnectionItem[]>([]);
  const [likedByMe, setLikedByMe] = useState<ConnectionItem[]>([]);
  const [photoRequests, setPhotoRequests] = useState<ConnectionItem[]>([]);
  const [deletedRequests, setDeletedRequests] = useState<ConnectionItem[]>([]);
  const [shortlistedProfiles, setShortlistedProfiles] = useState<ConnectionItem[]>([]);
  const [viewedProfiles, setViewedProfiles] = useState<ConnectionItem[]>([]);

  // Calculate age helper
  const calculateAge = (dobString?: string) => {
    if (!dobString) return "N/A";
    try {
      const today = new Date();
      const birthDate = new Date(dobString);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return "N/A";
    }
  };

  // Helper to extract main photo url
  const getPhotoUrl = (profile: any) => {
    const validPhotos = profile.photos?.filter(Boolean) || [];
    const mainPhoto =
      validPhotos.find((p: any) => p.isMain === true || p.isMain === 1 || p.isMain === "1")?.url ||
      validPhotos[0]?.url ||
      `https://api.dicebear.com/7.x/avataaars/png?seed=${profile.firstName || "default"}`;
    return resolvePhotoUrl(mainPhoto);
  };

  const fetchConnectionCenterData = async () => {
    try {
      setLoading(true);
      
      const [
        recIntRes,
        sentIntRes,
        contactSentRes,
        viewersRes,
        photoReqRes,
        shortlistRes,
        allProfilesRes,
        likesReceivedRes,
        likesSentRes,
      ] = await Promise.all([
        getInterests("received").catch(() => ({ data: { success: false, data: [] } })),
        getInterests("sent").catch(() => ({ data: { success: false, data: [] } })),
        getContactRequests("sent").catch(() => ({ data: { success: false, data: [] } })),
        getProfileViewers().catch(() => ({ data: { success: false, data: [] } })),
        getPhotoRequests("sent").catch(() => ({ data: { success: false, data: [] } })),
        getShortlisted().catch(() => ({ data: { success: false, data: [] } })),
        getAllProfiles().catch(() => ({ data: { success: false, data: [] } })),
        getLikes("received").catch(() => ({ data: { success: false, data: [] } })),
        getLikes("sent").catch(() => ({ data: { success: false, data: [] } })),
      ]);

      const allData = allProfilesRes.data?.data || [];

      // Load recently viewed IDs from AsyncStorage
      let recentlyViewedIds: string[] = [];
      try {
        const stored = await AsyncStorage.getItem("recently_viewed_ids");
        if (stored) {
          recentlyViewedIds = JSON.parse(stored);
        }
      } catch (e) {
        console.warn("Failed to load recently viewed IDs:", e);
      }

      // 1. Process Received Pending Requests
      const recData = (recIntRes.data?.data || []).map((item: any) => ({
        ...item,
        receiverId: "me",
      }));
      const pendingReceived = recData.filter((i: any) => i.status === "pending");
      setReceivedInterests(pendingReceived);

      // 2. Process Accepted
      // Accepted by Them = interests sent by me that have status 'accepted'
      const sentData = (sentIntRes.data?.data || []).map((item: any) => ({
        ...item,
        senderId: "me",
      }));
      const accByThem = sentData.filter((i: any) => i.status === "accepted");
      setAcceptedByThem(accByThem);

      // Accepted by Me = interests received by me that have status 'accepted'
      const accByMe = recData.filter((i: any) => i.status === "accepted");
      setAcceptedByMe(accByMe);

      // 3. Process Contact
      const contactSentData = (contactSentRes.data?.data || []).map((item: any) => ({
        ...item,
        senderId: "me",
      }));
      setContactViewed(contactSentData);

      // 3.5 Process Likes
      const likedYouData = (likesReceivedRes.data?.data || []).map((p: any, idx: number) => {
        const hasSent = sentData.some((interest: any) => interest.receiverId === p.userId);
        return {
          id: `like-rcvd-${p.userId || p.id || idx}`,
          senderId: p.userId || p.id || "",
          receiverId: "me",
          status: "liked",
          createdAt: new Date().toISOString(),
          profile: {
            ...p,
            hasSentInterest: hasSent,
          },
        };
      });
      setLikedYou(likedYouData);

      const likedByMeData = (likesSentRes.data?.data || []).map((p: any, idx: number) => {
        const hasSent = sentData.some((interest: any) => interest.receiverId === p.userId);
        return {
          id: `like-sent-${p.userId || p.id || idx}`,
          senderId: "me",
          receiverId: p.userId || p.id || "",
          status: "liked",
          createdAt: new Date().toISOString(),
          profile: {
            ...p,
            hasSentInterest: hasSent,
          },
        };
      });
      setLikedByMe(likedByMeData);

      // Viewed You = map profile viewers to connection items
      const viewerProfiles = viewersRes.data?.data || [];
      const mappedViewers = viewerProfiles.map((p: any, idx: number) => {
        const hasSent = sentData.some((interest: any) => interest.receiverId === p.userId);
        return {
          id: `viewer-${idx}`,
          senderId: p.userId || p.id || "",
          receiverId: "me",
          status: "viewed",
          createdAt: new Date().toISOString(),
          profile: {
            ...p,
            hasSentInterest: hasSent,
          },
        };
      });
      setViewedYou(mappedViewers);

      // 4. Process Sent Pending Requests
      const pendingSent = sentData.filter((i: any) => i.status === "pending");
      setSentInterests(pendingSent);

      // 5. Process Photo Requests
      const photoReqData = (photoReqRes.data?.data || []).map((item: any) => ({
        ...item,
        senderId: "me",
      }));
      setPhotoRequests(photoReqData);

      // 6. Process Deleted / Declined
      const declinedReceived = recData.filter((i: any) => i.status === "declined");
      const declinedSent = sentData.filter((i: any) => i.status === "declined");
      setDeletedRequests([...declinedReceived, ...declinedSent]);

      // 7. Process Shortlisted
      const shortlistedProfilesData = shortlistRes.data?.data || [];
      const mappedShortlists = shortlistedProfilesData.map((p: any, idx: number) => {
        const hasSent = sentData.some((interest: any) => interest.receiverId === p.userId);
        return {
          id: `shortlist-${p.userId || p.id || idx}`,
          senderId: "me",
          receiverId: p.userId || p.id || "",
          status: "shortlisted",
          createdAt: p.createdAt || new Date().toISOString(),
          profile: {
            ...p,
            hasSentInterest: hasSent,
          },
        };
      });
      setShortlistedProfiles(mappedShortlists);

      // 9. Process Recently Viewed
      const viewedData = allData.filter((p: any) => recentlyViewedIds.includes(p.userId || p.id));
      const mappedViewed = viewedData.map((p: any, idx: number) => {
        const hasSent = sentData.some((interest: any) => interest.receiverId === p.userId);
        return {
          id: `viewed-${p.userId || p.id || idx}`,
          senderId: "me",
          receiverId: p.userId || p.id || "",
          status: "viewed",
          createdAt: p.createdAt || new Date().toISOString(),
          profile: {
            ...p,
            hasSentInterest: hasSent,
          },
        };
      });
      setViewedProfiles(mappedViewed);

    } catch (error) {
      console.error("Fetch Connection Center Data Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };



  useFocusEffect(
    useCallback(() => {
      fetchConnectionCenterData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchConnectionCenterData();
  };

  // Response action handlers
  const handleInterestAction = async (id: string, status: "accepted" | "declined") => {
    try {
      setActionLoadingId(id);
      const res = await handleInterestResponse(id, status);
      if (res.data?.success) {
        showToast(`Request successfully ${status}!`);
        fetchConnectionCenterData();
      } else {
        showToast(`Failed to respond to request. Please try again.`);
      }
    } catch {
      showToast(`Something went wrong. Please check connection.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleContactAction = async (id: string, status: "accepted" | "declined") => {
    try {
      setActionLoadingId(id);
      const res = await handleContactResponse(id, status);
      if (res.data?.success) {
        showToast(`Contact request ${status}!`);
        fetchConnectionCenterData();
      } else {
        showToast(`Action failed. Please try again.`);
      }
    } catch {
      showToast(`Something went wrong. Please check connection.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePhotoAction = async (id: string, status: "accepted" | "declined") => {
    try {
      setActionLoadingId(id);
      const res = await handlePhotoRequestResponse(id, status);
      if (res.data?.success) {
        showToast(`Photo access ${status}!`);
        fetchConnectionCenterData();
      } else {
        showToast(`Action failed. Please try again.`);
      }
    } catch {
      showToast(`Something went wrong. Please check connection.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Get active list to display based on selected tab and sub-tab
  const getActiveList = (): ConnectionItem[] => {
    switch (activeTab) {
      case "Received":
        return receivedInterests;
      case "Accepted":
        return acceptedSubTab === "byThem" ? acceptedByThem : acceptedByMe;
      case "Likes":
        return likesSubTab === "likedYou" ? likedYou : likedByMe;
      case "Shortlist":
        return shortlistedProfiles;
      case "Contact":
        return contactSubTab === "contactViewed" ? contactViewed : viewedYou;
      case "Sent":
        return sentInterests;
      case "More":
        switch (moreSubTab) {
          case "viewed":
            return viewedProfiles;
          case "visitors":
            return viewedYou;
          case "photoRequests":
            return photoRequests;
          case "deleted":
            return deletedRequests;
          default:
            return [];
        }
      default:
        return [];
    }
  };

  const activeList = getActiveList();

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  const mainTabs: MainTabType[] = ["Received", "Accepted", "Likes", "Shortlist", "Contact", "Sent", "More"];

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      {/* 1. Main Navigation Tabs */}
      <View style={[styles.tabContainer, { paddingTop: topPadding }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollTabs}
        >
          {mainTabs.map((tab) => {
            const isActive = activeTab === tab;
            let badgeCount = 0;
            if (tab === "Received") badgeCount = receivedInterests.length;
            if (tab === "Shortlist") badgeCount = shortlistedProfiles.length;
            if (tab === "Sent") badgeCount = sentInterests.length;
            if (tab === "Likes") badgeCount = likedYou.length;

            return (
              <TouchableOpacity
                key={tab}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => setActiveTabState(tab)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                  {tab}
                </Text>
                {badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badgeCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 2. Sub-tab segments */}
      {activeTab === "Accepted" && (
        <View style={styles.subTabContainer}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentButton, acceptedSubTab === "byThem" && styles.segmentButtonActive]}
              onPress={() => setAcceptedSubTab("byThem")}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, acceptedSubTab === "byThem" && styles.segmentTextActive]}>
                Accepted by Her/Them
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, acceptedSubTab === "byMe" && styles.segmentButtonActive]}
              onPress={() => setAcceptedSubTab("byMe")}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, acceptedSubTab === "byMe" && styles.segmentTextActive]}>
                Accepted by Me
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === "Likes" && (
        <View style={styles.subTabContainer}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentButton, likesSubTab === "likedYou" && styles.segmentButtonActive]}
              onPress={() => setLikesSubTab("likedYou")}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, likesSubTab === "likedYou" && styles.segmentTextActive]}>
                Liked You
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, likesSubTab === "likedByMe" && styles.segmentButtonActive]}
              onPress={() => setLikesSubTab("likedByMe")}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, likesSubTab === "likedByMe" && styles.segmentTextActive]}>
                Liked by Me
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === "Contact" && (
        <View style={styles.subTabContainer}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentButton, contactSubTab === "contactViewed" && styles.segmentButtonActive]}
              onPress={() => setContactSubTab("contactViewed")}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, contactSubTab === "contactViewed" && styles.segmentTextActive]}>
                Contact Viewed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.segmentButton, contactSubTab === "viewedYou" && styles.segmentButtonActive]}
              onPress={() => setContactSubTab("viewedYou")}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentText, contactSubTab === "viewedYou" && styles.segmentTextActive]}>
                Viewed You
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {activeTab === "More" && (
        <View style={styles.subTabsContainer}>

          {/* Recently Viewed */}
          <TouchableOpacity
            style={[styles.subTabItem, moreSubTab === "viewed" && styles.subTabItemActive]}
            onPress={() => setMoreSubTab("viewed")}
          >
            <Eye size={12} color={moreSubTab === "viewed" ? palette.gold.main : "#3B1E54"} />
            <Text style={[styles.subTabLabel, moreSubTab === "viewed" && styles.subTabLabelActive]}>
              Viewed ({viewedProfiles.length})
            </Text>
          </TouchableOpacity>

          {/* Visitors */}
          <TouchableOpacity
            style={[styles.subTabItem, moreSubTab === "visitors" && styles.subTabItemActive]}
            onPress={() => setMoreSubTab("visitors")}
          >
            <UserCheck size={12} color={moreSubTab === "visitors" ? palette.gold.main : "#3B1E54"} />
            <Text style={[styles.subTabLabel, moreSubTab === "visitors" && styles.subTabLabelActive]}>
              Visitors ({viewedYou.length})
            </Text>
          </TouchableOpacity>

          {/* Photo Request */}
          <TouchableOpacity
            style={[styles.subTabItem, moreSubTab === "photoRequests" && styles.subTabItemActive]}
            onPress={() => setMoreSubTab("photoRequests")}
          >
            <ImageIcon size={12} color={moreSubTab === "photoRequests" ? palette.gold.main : "#3B1E54"} />
            <Text style={[styles.subTabLabel, moreSubTab === "photoRequests" && styles.subTabLabelActive]}>
              Photo Request ({photoRequests.length})
            </Text>
          </TouchableOpacity>

          {/* Deleted / Declined */}
          <TouchableOpacity
            style={[styles.subTabItem, moreSubTab === "deleted" && styles.subTabItemActive]}
            onPress={() => setMoreSubTab("deleted")}
          >
            <UserX size={12} color={moreSubTab === "deleted" ? palette.gold.main : "#3B1E54"} />
            <Text style={[styles.subTabLabel, moreSubTab === "deleted" && styles.subTabLabelActive]}>
              Declined ({deletedRequests.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. Connection Cards List */}
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={palette.gold.main} />
        </View>
      ) : activeList.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.gold.main} />
          }
        >
          <View style={styles.emptyIconWrapper}>
            {activeTab === "Received" || activeTab === "Shortlist" || activeTab === "Likes" || (activeTab === "More" && (moreSubTab === "viewed" || moreSubTab === "visitors")) ? (
              <Heart size={44} color="#7E6B8F" />
            ) : activeTab === "Contact" ? (
              <PhoneCall size={44} color="#7E6B8F" />
            ) : activeTab === "More" && moreSubTab === "photoRequests" ? (
              <ImageIcon size={44} color="#7E6B8F" />
            ) : (
              <UserX size={44} color="#7E6B8F" />
            )}
          </View>
          <Text style={styles.emptyTitle}>No Updates Here</Text>
          <Text style={styles.emptyDesc}>
            {activeTab === "Received"
              ? "When other members express interest in your profile, they will appear here."
              : activeTab === "Accepted"
              ? "All your successful matches will appear in this section."
              : activeTab === "Shortlist"
              ? "Profiles you shortlist for future consideration will appear here."
              : activeTab === "Contact"
              ? "Contact details reveal history and profile viewer updates will be listed here."
              : activeTab === "Likes"
              ? (likesSubTab === "likedYou" ? "Members who liked your profile will appear here." : "Profiles you liked will appear here.")
              : activeTab === "Sent"
              ? "Pending connections you sent to other members are tracked here."
              : activeTab === "More" && moreSubTab === "viewed"
              ? "Profiles you recently viewed will be tracked here."
              : activeTab === "More" && moreSubTab === "visitors"
              ? "Members who visited your profile will appear here."
              : "Photo request status and declined matches will appear here."}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.cardsScroll, { paddingBottom: insets.bottom + 100 }]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={palette.gold.main} />
          }
        >
          {activeList.map((item) => {
            const profile = item.profile || {};
            const isPremium = profile.isPremium || false;
            const isVerified = profile.isVerified || false;
            const age = calculateAge(profile.dob);

            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  isPremium && styles.cardPremium,
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    const targetUserId = item.senderId === "me" ? item.receiverId : item.senderId;
                    if (targetUserId) {
                      navigation.navigate("ProfileDetail", {
                        profile: { id: targetUserId },
                      });
                    }
                  }}
                >
                  {/* User Info Row */}
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                      <Image source={{ uri: getPhotoUrl(profile) }} style={styles.avatar} />
                      {isPremium && (
                        <View style={styles.premiumTag}>
                          <Crown size={8} color="#3B1E54" />
                        </View>
                      )}
                    </View>

                    <View style={styles.profileTextInfo}>
                      <View style={styles.nameRow}>
                        <Text style={styles.profileName} numberOfLines={1}>
                          {profile.firstName} {profile.lastName}
                        </Text>
                        {isVerified && (
                          <View style={styles.verifiedIconBox}>
                            <BadgeCheck size={16} color="#4CAF50" fill="rgba(76, 175, 80, 0.08)" />
                          </View>
                        )}
                      </View>

                      <Text style={styles.profileSubDetails}>
                        {age} Yrs • {profile.height || "5'4\""} • {profile.motherTongue || profile.language || "Hindi"}
                      </Text>

                      <View style={styles.metaRow}>
                        <Briefcase size={12} color="#7E6B8F" style={styles.metaIcon} />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {profile.profession || "Not specified"}
                        </Text>
                      </View>

                      <View style={styles.metaRow}>
                        <MapPin size={12} color="#7E6B8F" style={styles.metaIcon} />
                        <Text style={styles.metaText} numberOfLines={1}>
                          {profile.city}, {profile.state}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Sub info or date indicator */}
                  <View style={styles.cardInfoFooter}>
                    <Clock size={12} color="#7E6B8F" />
                    <Text style={styles.dateText}>
                      {activeTab === "Received"
                        ? `Received: ${formatDate(item.createdAt)}`
                        : activeTab === "Accepted"
                        ? `Matched: ${formatDate(item.createdAt)}`
                        : activeTab === "Shortlist"
                        ? `Shortlisted`
                        : activeTab === "Contact"
                        ? `${contactSubTab === "contactViewed" ? "Revealed" : "Viewed"}: ${formatDate(item.createdAt)}`
                        : activeTab === "Sent"
                        ? `Sent: ${formatDate(item.createdAt)}`
                        : activeTab === "Likes"
                        ? (likesSubTab === "likedYou" ? "Liked You" : "Liked by Me")
                        : activeTab === "More" && moreSubTab === "viewed"
                        ? `Viewed Profile`
                        : activeTab === "More" && moreSubTab === "visitors"
                        ? `Visited Profile`
                        : `${moreSubTab === "photoRequests" ? "Requested" : "Declined"}: ${formatDate(item.createdAt)}`}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Card Action Buttons */}
                <View style={styles.cardActions}>
                  {actionLoadingId === item.id ? (
                    <ActivityIndicator size="small" color="#3B1E54" style={{ marginVertical: 8 }} />
                  ) : activeTab === "Received" ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.declineBtn]}
                        onPress={() => handleInterestAction(item.id, "declined")}
                        activeOpacity={0.7}
                      >
                        <XCircle size={14} color="#F44336" />
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.acceptBtn]}
                        onPress={() => handleInterestAction(item.id, "accepted")}
                        activeOpacity={0.7}
                      >
                        <CheckCircle2 size={14} color="#FFFFFF" />
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </TouchableOpacity>
                    </>
                  ) : activeTab === "Accepted" ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.outlineBtn]}
                        onPress={() =>
                          navigation.navigate("ProfileDetail", {
                            profile: { id: item.senderId === "me" ? item.receiverId : item.senderId },
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <Text style={styles.outlineBtnText}>View Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.primaryBtn]}
                        onPress={() =>
                          navigation.navigate("ChatDetail", {
                            userId: item.senderId === "me" ? item.receiverId : item.senderId,
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <MessageSquare size={14} color="#FFFFFF" />
                        <Text style={styles.primaryBtnText}>Chat Now</Text>
                      </TouchableOpacity>
                    </>
                  ) : activeTab === "Contact" ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.outlineBtn, { flex: 1 }]}
                        onPress={() =>
                          navigation.navigate("ProfileDetail", {
                            profile: { id: item.senderId === "me" ? item.receiverId : item.senderId },
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <Text style={styles.outlineBtnText}>View Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.primaryBtn, { flex: 1 }]}
                        onPress={() =>
                          navigation.navigate("ChatDetail", {
                            userId: item.senderId === "me" ? item.receiverId : item.senderId,
                          })
                        }
                        activeOpacity={0.7}
                      >
                        <MessageSquare size={14} color="#FFFFFF" />
                        <Text style={styles.primaryBtnText}>Message</Text>
                      </TouchableOpacity>
                    </>
                  ) : (activeTab === "Shortlist" || activeTab === "Likes" || (activeTab === "More" && (moreSubTab === "viewed" || moreSubTab === "visitors"))) ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.outlineBtn, { flex: 1 }]}
                        onPress={() => {
                          const otherUserId = item.senderId === "me" ? item.receiverId : item.senderId;
                          navigation.navigate("ProfileDetail", {
                            profile: { id: otherUserId },
                          });
                        }}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.outlineBtnText}>View Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.actionBtn, 
                          styles.primaryBtn, 
                          { flex: 1 },
                          (item.profile as any)?.hasSentInterest && { opacity: 0.6 }
                        ]}
                        onPress={async () => {
                          const otherUserId = item.senderId === "me" ? item.receiverId : item.senderId;
                          if (!otherUserId) return;
                          if ((item.profile as any)?.hasSentInterest) return;
                          
                          setActionLoadingId(item.id);
                          try {
                            const res = await sendInterest(otherUserId);
                            if (res.data?.success) {
                              Alert.alert("Success", "Interest request sent successfully!");
                              if (activeTab === "Shortlist") {
                                setShortlistedProfiles(prev => 
                                  prev.map(p => 
                                    p.id === item.id 
                                      ? { ...p, profile: { ...p.profile, hasSentInterest: true } }
                                      : p
                                  )
                                );
                              } else if (activeTab === "Likes") {
                                if (likesSubTab === "likedYou") {
                                  setLikedYou(prev =>
                                    prev.map(p =>
                                      p.id === item.id
                                        ? { ...p, profile: { ...p.profile, hasSentInterest: true } }
                                        : p
                                    )
                                  );
                                } else {
                                  setLikedByMe(prev =>
                                    prev.map(p =>
                                      p.id === item.id
                                        ? { ...p, profile: { ...p.profile, hasSentInterest: true } }
                                        : p
                                    )
                                  );
                                }
                              } else if (moreSubTab === "viewed") {
                                setViewedProfiles(prev => 
                                  prev.map(p => 
                                    p.id === item.id 
                                      ? { ...p, profile: { ...p.profile, hasSentInterest: true } }
                                      : p
                                  )
                                );
                              } else if (moreSubTab === "visitors") {
                                setViewedYou(prev => 
                                  prev.map(p => 
                                    p.id === item.id 
                                      ? { ...p, profile: { ...p.profile, hasSentInterest: true } }
                                      : p
                                  )
                                );
                              }
                            } else {
                              Alert.alert("Error", res.data?.message || "Failed to send interest");
                            }
                          } catch (err: any) {
                            Alert.alert("Error", err.message || "Failed to send interest");
                          } finally {
                            setActionLoadingId(null);
                          }
                        }}
                        disabled={(item.profile as any)?.hasSentInterest}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.primaryBtnText}>
                          {(item.profile as any)?.hasSentInterest ? "Interest Expressed" : "Send Interest"}
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : activeTab === "Sent" ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.outlineBtn, { flex: 1 }]}
                      onPress={() =>
                        navigation.navigate("ProfileDetail", {
                          profile: { id: item.receiverId },
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.outlineBtnText}>View Profile Details</Text>
                    </TouchableOpacity>
                  ) : moreSubTab === "photoRequests" ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.outlineBtn, { flex: 1 }]}
                      onPress={() =>
                        navigation.navigate("ProfileDetail", {
                          profile: { id: item.senderId === "me" ? item.receiverId : item.senderId },
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.outlineBtnText}>View Profile Details</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.deletedPill}>
                      <UserX size={14} color="#7E6B8F" />
                      <Text style={styles.deletedPillText}>Declined Request</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBFF",
  },
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(232, 224, 240, 0.6)",
    backgroundColor: "#FDFBFF",
  },
  scrollTabs: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F5F0FA",
    borderWidth: 1,
    borderColor: "rgba(232, 224, 240, 0.8)",
  },
  tabButtonActive: {
    backgroundColor: "#3B1E54",
    borderColor: "#3B1E54",
  },
  tabButtonText: {
    fontSize: 13,
    ...fonts.semibold,
    color: "#7E6B8F",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  badge: {
    marginLeft: 6,
    backgroundColor: palette.gold.main,
    borderRadius: 9,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    minWidth: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#3B1E54",
    fontSize: 9,
    ...fonts.bold,
  },
  subTabContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FDFBFF",
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#F0EBF5",
    borderRadius: 14,
    padding: 3.5,
    borderWidth: 1,
    borderColor: "rgba(232, 224, 240, 0.8)",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 11,
  },
  segmentButtonActive: {
    backgroundColor: "#FFFFFF",
    ...Platform.select({
      ios: {
        shadowColor: "#3B1E54",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  segmentText: {
    fontSize: 12,
    ...fonts.semibold,
    color: "#7E6B8F",
  },
  segmentTextActive: {
    color: "#3B1E54",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyScroll: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(126, 107, 143, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    ...fonts.bold,
    color: "#3B1E54",
    marginBottom: 10,
    textAlign: "center",
  },
  emptyDesc: {
    fontSize: 13,
    color: "#7E6B8F",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  cardsScroll: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(232, 224, 240, 0.8)",
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#3B1E54",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardPremium: {
    borderColor: "rgba(212, 175, 55, 0.4)", // Gold outline
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#F5F0FA",
  },
  premiumTag: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.gold.main,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileTextInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  profileName: {
    fontSize: 15,
    ...fonts.bold,
    color: "#3B1E54",
  },
  verifiedIconBox: {
    marginLeft: 6,
  },
  profileSubDetails: {
    fontSize: 12,
    ...fonts.semibold,
    color: "#7E6B8F",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  metaIcon: {
    marginRight: 6,
  },
  metaText: {
    fontSize: 11,
    color: "#7E6B8F",
    ...fonts.medium,
  },
  cardInfoFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(232, 224, 240, 0.4)",
    paddingTop: 10,
  },
  dateText: {
    fontSize: 11,
    color: "#7E6B8F",
    ...fonts.semibold,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 14,
  },
  actionBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  declineBtn: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#F44336",
  },
  declineBtnText: {
    fontSize: 12,
    ...fonts.bold,
    color: "#F44336",
  },
  acceptBtn: {
    backgroundColor: "#4CAF50",
  },
  acceptBtnText: {
    fontSize: 12,
    ...fonts.bold,
    color: "#FFFFFF",
  },
  outlineBtn: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "rgba(59, 30, 84, 0.4)",
  },
  outlineBtnText: {
    fontSize: 12,
    ...fonts.bold,
    color: "#3B1E54",
  },
  primaryBtn: {
    backgroundColor: "#3B1E54",
  },
  primaryBtnText: {
    fontSize: 12,
    ...fonts.bold,
    color: "#FFFFFF",
  },
  deletedPill: {
    flex: 1,
    height: 38,
    backgroundColor: "rgba(126, 107, 143, 0.08)",
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  deletedPillText: {
    fontSize: 12,
    ...fonts.semibold,
    color: "#7E6B8F",
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
    backgroundColor: "#F5F0FA",
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
    color: "#3B1E54",
  },
  subTabLabelActive: {
    color: "#FFFFFF",
  },
});
