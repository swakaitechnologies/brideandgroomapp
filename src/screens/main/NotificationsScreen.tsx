import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import {
  ChevronLeft,
  Bell,
  Heart,
  Eye,
  Phone,
  MessageCircle,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  CheckCheck,
  X,
  HelpCircle,
  Trash2,
} from "lucide-react-native";
import { Text, View } from "@/components/Themed";
import { palette } from "../../theme/colors";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../../services/api";
import { fonts } from "@/src/theme";

const { width } = Dimensions.get("window");

interface NotificationItem {
  id: string;
  userId: string;
  senderId: string | null;
  type: string;
  message: string;
  isRead: boolean;
  relatedId: string | null;
  createdAt: string;
}

interface NotificationsScreenProps {
  isTab?: boolean;
  setActiveTab?: (tab: any) => void;
}

export default function NotificationsScreen({ isTab = false, setActiveTab }: NotificationsScreenProps) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isDark = false;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const themeBg = isDark ? "#0A0A0A" : "#FDFBFF";
  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#3B1E54";
  const mutedText = isDark ? "#AAAAAA" : "#7E6B8F";
  const accentGold = palette.gold.main;
  const deepPurple = "#3B1E54";

  const fetchNotificationsData = async () => {
    try {
      const res = await getNotifications();
      if (res.data.success) {
        setNotifications(res.data.data || []);
      }
    } catch (error) {
      console.error("Fetch Notifications Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotificationsData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotificationsData();
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsAsRead();
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
      }
    } catch (error) {
      console.error("Mark all as read error:", error);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      const res = await deleteNotification(id);
      if (res.data.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (selectedNotification?.id === id) {
          setIsModalVisible(false);
        }
      }
    } catch (error) {
      console.error("Delete notification error:", error);
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      "Clear All Notifications",
      "Are you sure you want to delete all notifications?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete All", 
          style: "destructive", 
          onPress: async () => {
            try {
              const res = await deleteAllNotifications();
              if (res.data.success) {
                setNotifications([]);
              }
            } catch (error) {
              console.error("Delete all notifications error:", error);
            }
          } 
        }
      ]
    );
  };

  const handleNotificationPress = async (item: NotificationItem) => {
    try {
      if (!item.isRead) {
        await markNotificationAsRead(item.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
        );
      }
      setSelectedNotification(item);
      setIsModalVisible(true);
    } catch (error) {
      console.error("Notification action error:", error);
    }
  };

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case "interest_received":
        return {
          Icon: Heart,
          color: "#FF4D4D",
          bgColor: "rgba(255, 77, 77, 0.08)",
          label: "New Interest",
        };
      case "interest_accepted":
        return {
          Icon: CheckCircle,
          color: "#4CAF50",
          bgColor: "rgba(76, 175, 80, 0.08)",
          label: "Interest Accepted",
        };
      case "interest_declined":
      case "contact_declined":
        return {
          Icon: XCircle,
          color: "#F44336",
          bgColor: "rgba(244, 67, 54, 0.08)",
          label: "Request Declined",
        };
      case "profile_view":
        return {
          Icon: Eye,
          color: "#2196F3",
          bgColor: "rgba(33, 150, 243, 0.08)",
          label: "Profile Viewer",
        };
      case "contact_request":
      case "contact_approved":
        return {
          Icon: Phone,
          color: "#FF9800",
          bgColor: "rgba(255, 152, 0, 0.08)",
          label: "Contact Update",
        };
      case "new_message":
        return {
          Icon: MessageCircle,
          color: "#9C27B0",
          bgColor: "rgba(156, 39, 176, 0.08)",
          label: "New Message",
        };
      case "photo_request":
      case "photo_approved":
        return {
          Icon: ImageIcon,
          color: "#00BCD4",
          bgColor: "rgba(0, 188, 212, 0.08)",
          label: "Photo Request",
        };
      case "kyc":
        return {
          Icon: CheckCircle,
          color: "#4CAF50",
          bgColor: "rgba(76, 175, 80, 0.08)",
          label: "KYC Verification",
        };
      case "profile":
        return {
          Icon: CheckCircle,
          color: "#2196F3",
          bgColor: "rgba(33, 150, 243, 0.08)",
          label: "Profile Status",
        };
      case "feedback":
        return {
          Icon: HelpCircle,
          color: palette.gold.main,
          bgColor: "rgba(212, 175, 55, 0.08)",
          label: "Query Status",
        };
      case "admin":
      default:
        return {
          Icon: Bell,
          color: deepPurple,
          bgColor: "rgba(59, 30, 84, 0.08)",
          label: "System Alert",
        };
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;

      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "";
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const { Icon, color, bgColor } = getNotificationConfig(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          {
            backgroundColor: cardBg,
            borderColor: !item.isRead ? color + "40" : "rgba(59, 30, 84, 0.06)",
          },
          !item.isRead && { backgroundColor: isDark ? "rgba(212, 175, 55, 0.05)" : bgColor },
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconWrapper, { backgroundColor: bgColor }]}>
          <Icon size={20} color={color} />
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.messageText,
              { color: textColor },
              !item.isRead && styles.unreadMessageText,
            ]}
          >
            {item.message}
          </Text>
          <Text style={[styles.timeText, { color: mutedText }]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>

        <View style={styles.rightActions}>
          {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: color, marginBottom: 8 }]} />}
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteNotification(item.id);
            }}
            style={styles.deleteCardButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Trash2 size={16} color={palette.purple.muted} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const topPadding = isTab ? insets.top + 80 : insets.top + 10;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeBg }} edges={["left", "right", "bottom"]}>
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        {!isTab ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <ChevronLeft size={28} color={deepPurple} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}

        <Text style={[styles.headerTitle, { color: deepPurple }]}>Notifications</Text>

        {notifications.length > 0 ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={handleMarkAllRead}
              style={[styles.markAllButton, { marginRight: 8 }]}
              activeOpacity={0.7}
            >
              <CheckCheck size={20} color={accentGold} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeleteAll}
              style={styles.deleteAllButton}
              activeOpacity={0.7}
            >
              <Trash2 size={20} color="#F44336" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={accentGold} />
        </View>
      ) : notifications.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentGold} />
          }
        >
          <View style={[styles.emptyIconContainer, { backgroundColor: "rgba(212, 175, 55, 0.08)" }]}>
            <Bell size={48} color={accentGold} />
          </View>
          <Text style={[styles.emptyTitle, { color: deepPurple }]}>No notifications yet</Text>
          <Text style={[styles.emptySub, { color: mutedText }]}>
            We will let you know when you receive new matches, interests, or messages.
          </Text>
          <TouchableOpacity
            style={[styles.homeButton, { backgroundColor: deepPurple }]}
            onPress={() => {
              if (isTab && setActiveTab) {
                setActiveTab("Home");
              } else {
                navigation.navigate("Tabs", { screen: "Home" });
              }
            }}
          >
            <Text style={[styles.homeButtonText, { color: "#FFF" }]}>Back to Home</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentGold} />
          }
        />
      )}

      {/* Detailed Notification Modal Popup */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsModalVisible(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: cardBg }]}>
            {selectedNotification && (() => {
              const { Icon, color, bgColor, label } = getNotificationConfig(selectedNotification.type);
              return (
                <>
                  <View style={styles.modalHeader}>
                    <View style={[styles.modalIconWrapper, { backgroundColor: bgColor }]}>
                      <Icon size={28} color={color} />
                    </View>
                    <Text style={[styles.modalTypeLabel, { color: textColor }]}>{label}</Text>
                    <TouchableOpacity
                      style={styles.modalCloseButton}
                      onPress={() => setIsModalVisible(false)}
                      activeOpacity={0.7}
                    >
                      <X size={18} color={mutedText} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <Text style={[styles.modalMessage, { color: textColor }]}>
                      {selectedNotification.message}
                    </Text>
                    <Text style={[styles.modalTime, { color: mutedText }]}>
                      {selectedNotification.createdAt ? new Date(selectedNotification.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : ""}
                    </Text>
                  </View>

                  <View style={styles.modalFooter}>
                    {selectedNotification.type === "feedback" ? (
                      <TouchableOpacity
                        style={[styles.modalActionButton, { backgroundColor: deepPurple }]}
                        onPress={() => {
                          setIsModalVisible(false);
                          navigation.navigate("HelpSupport", { activeTab: "history" });
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.modalActionButtonText}>View Query Status</Text>
                      </TouchableOpacity>
                    ) : selectedNotification.senderId ? (
                      <TouchableOpacity
                        style={[styles.modalActionButton, { backgroundColor: deepPurple }]}
                        onPress={() => {
                          setIsModalVisible(false);
                          if (selectedNotification.type === "new_message") {
                            navigation.navigate("ChatDetail", { userId: selectedNotification.senderId });
                          } else {
                            navigation.navigate("ProfileDetail", {
                              profile: { id: selectedNotification.senderId },
                            });
                          }
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.modalActionButtonText}>
                          {selectedNotification.type === "new_message" ? "Chat Now" : "View Profile"}
                        </Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={[
                        styles.modalCloseTextButton,
                        { borderColor: "rgba(232, 224, 240, 0.8)" },
                      ]}
                      onPress={() => setIsModalVisible(false)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.modalCloseText, { color: deepPurple }]}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: "transparent",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(59, 30, 84, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    ...fonts.bold,
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(244, 67, 54, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  rightActions: {
    alignItems: "center",
    justifyContent: "center",
  },
  deleteCardButton: {
    padding: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  notificationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(59, 30, 84, 0.06)",
    overflow: "hidden",
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
  unreadCard: {
    borderColor: "rgba(212, 175, 55, 0.4)",
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: 15,
    marginRight: 10,
  },
  messageText: {
    fontSize: 14,
    ...fonts.medium,
    lineHeight: 18,
  },
  unreadMessageText: {
    ...fonts.semibold,
  },
  timeText: {
    fontSize: 11,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    ...fonts.bold,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  homeButton: {
    height: 46,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  homeButtonText: {
    fontSize: 15,
    ...fonts.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: width * 0.85,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(59, 30, 84, 0.1)",
    ...Platform.select({
      ios: {
        shadowColor: "#3B1E54",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTypeLabel: {
    fontSize: 18,
    ...fonts.bold,
    marginLeft: 15,
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(59, 30, 84, 0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    marginBottom: 24,
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    ...fonts.semibold,
  },
  modalTime: {
    fontSize: 11,
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: "column",
    gap: 10,
  },
  modalActionButton: {
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalActionButtonText: {
    color: "#FFFFFF",
    ...fonts.bold,
    fontSize: 15,
  },
  modalCloseTextButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(59, 30, 84, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  modalCloseText: {
    ...fonts.bold,
    fontSize: 15,
  },
});
