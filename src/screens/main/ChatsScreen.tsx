import React, { useState, useLayoutEffect, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Modal,
  Pressable,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  MessageSquare,
  Bell,
  Shield,
  Phone,
  Video,
  Search,
  CheckCheck,
  User,
  ShieldAlert,
  Flag,
  ChevronRight,
  X,
  Lock,
} from "lucide-react-native";
import { palette } from "../../theme/colors";
import { getChatList, getAllProfiles, getCallHistory, resolvePhotoUrl } from "../../services/api";
import { fonts } from "@/src/theme";
import { Skeleton } from "../../components/Skeleton";

const { width } = Dimensions.get("window");

type ChatTab = "All" | "Unread" | "Calls";

export default function ChatsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + 80;
  const isDark = false;
  
  const [activeTab, setActiveTab] = useState<ChatTab>("All");
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [activeMatches, setActiveMatches] = useState<any[]>([]);
  const [calls, setCalls] = useState<any[]>([]);

  const themeBg = isDark ? "#0F0F0F" : "#F8F9FA";
  const cardBg = isDark ? "#1E1E1E" : "#FFFFFF";
  const textColor = isDark ? "#F0F0F0" : "#1A1A1A";
  const mutedText = isDark ? "#A0A0A0" : "#6C757D";
  const accentColor = palette.gold.main;
  const deepPurple = "#3B1E54";

  const mapChatData = (raw: any[]) => {
    return raw.map((item: any) => ({
      id: item.userId,
      name: `${item.profile?.firstName || "User"} ${item.profile?.lastName || ""}`,
      lastMsg: item.lastMessage 
        ? (item.lastMessage.startsWith('[IMAGE]:') 
            ? '📷 Photo' 
            : (item.lastMessage.startsWith('[DOCUMENT]:') ? '📄 Document' : item.lastMessage)
          )
        : "No messages yet",
      time: item.lastMessageTime ? new Date(item.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      unread: item.unreadCount || 0,
      online: item.profile?.user?.isOnline || false,
      photosLocked: item.profile?.photosLocked || false,
      photoVisibility: item.profile?.privacySettings?.photoVisibility || "All",
      photo: resolvePhotoUrl(
               item.profile?.photos?.find((p: any) => p.isMain === true || p.isMain === 1)?.url || 
               item.profile?.photos?.[0]?.url ||
               "https://api.dicebear.com/7.x/avataaars/png?seed=" + item.userId
             )
    }));
  };

  const fetchChatsData = async () => {
    try {
      setLoading(true);
      const [chatsRes, matchesRes, callsRes] = await Promise.all([
        getChatList(),
        getAllProfiles(),
        getCallHistory()
      ]);

      if (chatsRes.data.success) {
        const mappedChats = mapChatData(chatsRes.data.data);
        setChats(mappedChats);
      }

      if (matchesRes.data.success) {
        const mapped = matchesRes.data.data.map((p: any) => ({
          id: p.userId,
          name: p.firstName || "User",
          online: p.user?.isOnline || false,
          photosLocked: p.photosLocked || false,
          photoVisibility: p.privacySettings?.photoVisibility || "All",
          photo: resolvePhotoUrl(
                   p.photos?.find((ph: any) => ph.isMain === true || ph.isMain === 1)?.url || 
                   p.photos?.[0]?.url ||
                   "https://api.dicebear.com/7.x/avataaars/png?seed=" + p.userId
                 )
        }));
        // Filter to only show matches who are online (active on application)
        setActiveMatches(mapped.filter((p: any) => p.online));
      }

      if (callsRes.data.success) {
        setCalls(callsRes.data.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          photo: c.photo || "https://api.dicebear.com/7.x/avataaars/png?seed=" + c.id,
          type: c.type,
          status: c.status,
          time: new Date(c.time).toLocaleString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })
        })));
      }
    } catch (error) {
      console.error("Fetch Chats Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchChatsData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchChatsData();
  };

  const renderChatItem = ({ item }: { item: any }) => {
    const isPhotoLocked = item.photosLocked && (item.photoVisibility === 'Verified' || item.photoVisibility === 'Selected');
    return (
      <TouchableOpacity 
        style={[styles.chatCard, { backgroundColor: cardBg }]}
        onPress={() => navigation.navigate("ChatDetail", { userId: item.id })}
        key={item.id}
      >
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: item.photo }} 
            style={styles.chatAvatar} 
            blurRadius={isPhotoLocked ? (Platform.OS === 'ios' ? 10 : 5) : undefined}
          />
          {isPhotoLocked && (
            <View style={styles.avatarLockOverlay}>
              <Lock size={12} color={palette.gold.main} />
            </View>
          )}
          {item.online && <View style={styles.onlineDot} />}
        </View>
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={[styles.chatName, { color: textColor }]}>{item.name}</Text>
            <Text style={[styles.chatTime, { color: mutedText }]}>{item.time}</Text>
          </View>
          <View style={styles.chatFooter}>
            <Text style={[styles.lastMsg, { color: mutedText }]} numberOfLines={1}>{item.lastMsg}</Text>
            {item.unread > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: accentColor }]}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCallItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.chatCard, { backgroundColor: cardBg }]}
      onPress={() => navigation.navigate("ChatDetail", { userId: item.id })}
      key={item.id}
    >
      <Image source={{ uri: item.photo }} style={styles.chatAvatar} />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <Text style={[styles.chatName, { color: textColor }]}>{item.name}</Text>
          <Text style={[styles.chatTime, { color: mutedText }]}>{item.time}</Text>
        </View>
        <View style={styles.chatFooter}>
          <View style={styles.callStatus}>
            {item.type === "video" ? <Video size={14} color={mutedText} /> : <Phone size={14} color={mutedText} />}
            <Text style={[styles.lastMsg, { color: item.status === "missed" ? "#FF4D4D" : mutedText }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)} {item.type} call
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.callBtn}>
        {item.type === "video" ? <Video size={20} color={deepPurple} /> : <Phone size={20} color={deepPurple} />}
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderChatsSkeleton = () => (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      {activeTab === "All" && (
        <View style={styles.activeUsersSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Active Matches</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeUsersScroll}
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={styles.activeUserItem}>
                <Skeleton width={56} height={56} borderRadius={28} />
                <Skeleton width={50} height={10} style={{ marginTop: 8 }} />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.listSection}>
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={i} style={[styles.chatCard, { backgroundColor: cardBg }]}>
            <View style={styles.avatarContainer}>
              <Skeleton width={50} height={50} borderRadius={25} />
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Skeleton width={120} height={14} />
                <Skeleton width={40} height={10} />
              </View>
              <View style={[styles.chatFooter, { marginTop: 8 }]}>
                <Skeleton width={180} height={12} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeBg }} edges={["left", "right"]}>
      {/* Search Bar Placeholder */}
      <View style={[styles.searchContainer, { paddingTop: topPadding }]}>
        <View style={[styles.searchBar, { backgroundColor: cardBg }]}>
          <Search size={20} color={mutedText} />
          <Text style={[styles.searchText, { color: mutedText }]}>Search messages or calls...</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(["All", "Unread", "Calls"] as ChatTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabItem,
              activeTab === tab && { borderBottomColor: accentColor }
            ]}
          >
            <Text style={[
              styles.tabText,
              { color: activeTab === tab ? deepPurple : mutedText },
              activeTab === tab && { ...fonts.bold}
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        renderChatsSkeleton()
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {activeTab === "All" && activeMatches.length > 0 && (
            <View style={styles.activeUsersSection}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Active Matches</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeUsersScroll}>
                {activeMatches.map((user) => {
                  const isMatchPhotoLocked = user.photosLocked && (user.photoVisibility === 'Verified' || user.photoVisibility === 'Selected');
                  return (
                    <TouchableOpacity 
                      key={user.id} 
                      style={styles.activeUserItem}
                      onPress={() => navigation.navigate("ChatDetail", { userId: user.id })}
                    >
                      <View style={styles.activeAvatarContainer}>
                        <Image 
                          source={{ uri: user.photo }} 
                          style={styles.activeAvatar} 
                          blurRadius={isMatchPhotoLocked ? (Platform.OS === 'ios' ? 10 : 5) : undefined}
                        />
                        {isMatchPhotoLocked && (
                          <View style={styles.avatarLockOverlay}>
                            <Lock size={12} color={palette.gold.main} />
                          </View>
                        )}
                        {user.online && <View style={styles.statusBadge} />}
                      </View>
                      <Text style={[styles.activeUserName, { color: textColor }]} numberOfLines={1}>{user.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <View style={styles.listSection}>
            {activeTab === "Calls" ? (
              calls.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={{ color: mutedText }}>No calls logged</Text>
                </View>
              ) : (
                calls.map((item) => renderCallItem({ item }))
              )
            ) : (
              chats.filter(c => activeTab === "Unread" ? c.unread > 0 : true).length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={{ color: mutedText }}>No chats available</Text>
                </View>
              ) : (
                chats
                  .filter(c => activeTab === "Unread" ? c.unread > 0 : true)
                  .map((item) => renderChatItem({ item }))
              )
            )}
          </View>
        </ScrollView>
      )}

      {/* Safety Modal */}
      <Modal
        visible={showSafetyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSafetyModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowSafetyModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <View style={styles.shieldIconContainer}>
                <Shield size={32} color={accentColor} />
              </View>
              <Text style={[styles.modalTitle, { color: textColor }]}>Safety First</Text>
              <Text style={[styles.modalSub, { color: mutedText }]}>Your security is our top priority</Text>
            </View>

            <View style={styles.safetyGrid}>
              <TouchableOpacity style={styles.safetyItem}>
                <View style={styles.safetyIconBox}>
                  <User size={24} color={deepPurple} />
                </View>
                <View style={styles.safetyTextInfo}>
                  <Text style={[styles.safetyItemTitle, { color: textColor }]}>Know Person First</Text>
                  <Text style={[styles.safetyItemDesc, { color: mutedText }]}>Verify through chats and social profiles.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.safetyItem}>
                <View style={styles.safetyIconBox}>
                  <ShieldAlert size={24} color={deepPurple} />
                </View>
                <View style={styles.safetyTextInfo}>
                  <Text style={[styles.safetyItemTitle, { color: textColor }]}>Stay Alert</Text>
                  <Text style={[styles.safetyItemDesc, { color: mutedText }]}>Never share OTPs or financial details.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.safetyItem}>
                <View style={styles.safetyIconBox}>
                  <Flag size={24} color="#FF4D4D" />
                </View>
                <View style={styles.safetyTextInfo}>
                  <Text style={[styles.safetyItemTitle, { color: textColor }]}>Report User</Text>
                  <Text style={[styles.safetyItemDesc, { color: mutedText }]}>Flag suspicious behavior immediately.</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.moreSafetyBtn, { backgroundColor: deepPurple }]}
              onPress={() => {
                setShowSafetyModal(false);
                navigation.navigate("Safety");
              }}
            >
              <Text style={[styles.moreSafetyText, { color: accentColor }]}>GET MORE SAFETY TIPS</Text>
              <ChevronRight size={16} color={accentColor} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closeModalBtn}
              onPress={() => setShowSafetyModal(false)}
            >
              <X size={20} color={mutedText} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 22,
    ...fonts.semibold,
  },
  searchContainer: {
    padding: 15,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 15,
    gap: 10,
    borderWidth: 1,
    borderColor: "#E8E8E8",
  },
  searchText: {
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 25,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 15,
    ...fonts.semibold,
  },
  activeUsersSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    ...fonts.bold,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  activeUsersScroll: {
    paddingHorizontal: 15,
    gap: 15,
  },
  activeUserItem: {
    alignItems: "center",
    width: 60,
  },
  activeAvatarContainer: {
    position: "relative",
  },
  activeAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: "#FFF",
  },
  statusBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  activeUserName: {
    fontSize: 11,
    ...fonts.semibold,
    marginTop: 6,
    textAlign: "center",
  },
  listSection: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
  },
  avatarContainer: {
    position: "relative",
  },
  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  onlineDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  chatInfo: {
    flex: 1,
    marginLeft: 15,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatName: {
    fontSize: 16,
    ...fonts.bold,
  },
  chatTime: {
    fontSize: 11,
  },
  chatFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  lastMsg: {
    fontSize: 13,
    flex: 1,
  },
  unreadBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  unreadText: {
    color: "#3B1E54",
    fontSize: 10,
    ...fonts.bold,
  },
  callStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(59, 30, 84, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    borderRadius: 25,
    padding: 24,
    position: "relative",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 25,
  },
  shieldIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(212, 175, 55, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    ...fonts.bold,
  },
  modalSub: {
    fontSize: 14,
    marginTop: 5,
  },
  safetyGrid: {
    gap: 15,
    marginBottom: 25,
  },
  safetyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "rgba(59, 30, 84, 0.03)",
    borderRadius: 16,
    gap: 15,
  },
  safetyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
      android: { elevation: 2 },
    }),
  },
  safetyTextInfo: {
    flex: 1,
  },
  safetyItemTitle: {
    fontSize: 15,
    ...fonts.semibold,
  },
  safetyItemDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  moreSafetyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    borderRadius: 15,
    gap: 10,
  },
  moreSafetyText: {
    fontSize: 14,
    ...fonts.bold,
    letterSpacing: 1,
  },
  closeModalBtn: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 5,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 30, 84, 0.45)',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
});
