import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, TouchableOpacity, Platform, Image, Animated } from "react-native";
import { Text, View } from "@/components/Themed";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import HomeScreen from "./HomeScreen";
import MatchesScreen from "./MatchesScreen";
import ChatsScreen from "./ChatsScreen";
import PremiumScreen from "./PremiumScreen";
import UpdatesScreen from "./UpdatesScreen";
import { Home, Heart, MessageSquare, Crown, Menu, ShieldCheck, Bell, Search, Play } from "lucide-react-native";
import { palette } from "../../theme/colors";
import SideDrawer from "../../components/SideDrawer";
import { useNavigation, useRoute } from "@react-navigation/native";
import { secureStorage } from '../../services/secureStorage';
import { getChatList, getProfile } from "../../services/api";
import { setupPushNotifications, listenToTokenRefresh, setupNotificationListeners } from "../../services/pushNotification";
import { useNotificationSocket } from "../../hooks/useNotificationSocket";
import { fonts } from "@/src/theme";
import LinearGradient from "react-native-linear-gradient";

type TabType = "Home" | "Matches" | "Chat" | "Premium" | "Updates";

export default function TabsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>("Home");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [hideTabBar, setHideTabBar] = useState(false);
  const tabBarAnimation = useRef(new Animated.Value(1)).current;
  const translateY = tabBarAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const [userId, setUserId] = useState<string | null>(null);

  // Load profile to retrieve user ID for Socket.io
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getProfile();
        if (res.data?.success && res.data.data) {
          setUserId(res.data.data.userId);
        }
      } catch (err) {
        console.log("[PUSH] Failed to load profile for notifications:", err);
      }
    };
    loadProfile();
  }, []);

  // Setup push notification permissions, tokens, and listeners
  useEffect(() => {
    setupPushNotifications();
    const unsubscribeRefresh = listenToTokenRefresh();
    const unsubscribeBgOpen = setupNotificationListeners(navigation);

    return () => {
      if (unsubscribeRefresh) unsubscribeRefresh();
      if (unsubscribeBgOpen) unsubscribeBgOpen();
    };
  }, [navigation]);

  // Connect to Socket.io for real-time in-app notification toasts
  useNotificationSocket(userId, navigation);

  // Switch tabs when navigating to Tabs with screen parameter
  useEffect(() => {
    if (route.params?.screen) {
      const targetScreen = route.params.screen;
      if (targetScreen === "Premium") {
        setActiveTab("Premium");
      } else if (targetScreen === "Home") {
        setActiveTab("Home");
      } else if (targetScreen === "Matches") {
        setActiveTab("Matches");
      } else if (targetScreen === "Chat") {
        setActiveTab("Chat");
      } else if (targetScreen === "Updates") {
        setActiveTab("Updates");
      }
      navigation.setParams({ screen: undefined });
    }
  }, [route.params?.screen, navigation]);

  useEffect(() => {
    let isMounted = true;

    const fetchUnreadCount = async () => {
      try {
        const token = await secureStorage.getItem('token');
        if (!token) {
          if (isMounted) setUnreadMessagesCount(0);
          return;
        }
        const res = await getChatList();
        if (res.data?.success && isMounted) {
          const chatsData = res.data.data || [];
          const totalUnread = chatsData.reduce((sum: number, chat: any) => sum + (chat.unreadCount || 0), 0);
          setUnreadMessagesCount(totalUnread);
        }
      } catch (error) {
        console.log("Unread count fetch failed/skipped:", error);
      }
    };

    // Fetch immediately on mount
    fetchUnreadCount();

    // Set up polling interval (every 5 seconds)
    const interval = setInterval(fetchUnreadCount, 5000);

    // Listen to focus events (e.g. when returning from ChatDetailScreen)
    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchUnreadCount();
    });

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubscribeFocus();
    };
  }, [navigation]);

  // Fetch unread count immediately when switching tabs
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = await secureStorage.getItem('token');
        if (!token) return;
        const res = await getChatList();
        if (res.data?.success) {
          const chatsData = res.data.data || [];
          const totalUnread = chatsData.reduce((sum: number, chat: any) => sum + (chat.unreadCount || 0), 0);
          setUnreadMessagesCount(totalUnread);
        }
      } catch {
        // Suppress
      }
    };
    fetchUnreadCount();
  }, [activeTab]);

  useEffect(() => {
    setHideTabBar(false);
  }, [activeTab]);

  useEffect(() => {
    Animated.timing(tabBarAnimation, {
      toValue: hideTabBar ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [hideTabBar, tabBarAnimation]);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case "Home":
        return (
          <HomeScreen
            setActiveTab={(tab: any) => setActiveTab(tab as TabType)}
          />
        );
      case "Matches":
        return <MatchesScreen onSubTabChange={(subTab: string) => setHideTabBar(subTab === "daily")} />;
      case "Chat":
        return <ChatsScreen />;
      case "Premium":
        return <PremiumScreen />;
      case "Updates":
        return (
          <UpdatesScreen
            setActiveTab={(tab: any) => setActiveTab(tab as TabType)}
          />
        );
      default:
        return (
          <HomeScreen
            setActiveTab={(tab: any) => setActiveTab(tab as TabType)}
          />
        );
    }
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: "Home", label: "Home", icon: Home },
    { id: "Chat", label: "Chat", icon: MessageSquare },
    { id: "Matches", label: "Matches", icon: Heart },
    { id: "Updates", label: "Updates", icon: Bell },
    { id: "Premium", label: "Premium", icon: Crown },
  ];

  return (
    <View style={styles.container}>
      {/* Top Navbar */}
      <SafeAreaView style={styles.topNavbarSafeArea} edges={["top"]}>
        <View style={styles.topNavbar}>
          <View style={styles.leftHeader}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => setIsDrawerOpen(true)}
              activeOpacity={0.7}
            >
              <Menu size={24} color="#3B1E54" />
            </TouchableOpacity>

            <View pointerEvents="none">
              <Image
                source={require("../../../assets/images/logo.png")}
                style={styles.navLogo}
                resizeMode="contain"
              />
            </View>
          </View>

          <View style={styles.navActions}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigation.navigate("SearchProfiles")}
              activeOpacity={0.7}
            >
              <Search size={22} color="#3B1E54" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigation.navigate("Notifications")}
              activeOpacity={0.7}
            >
              <Bell size={22} color="#3B1E54" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigation.navigate("Safety")}
              activeOpacity={0.7}
            >
              <ShieldCheck size={24} color={palette.gold.main} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Active Screen */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {!hideTabBar && (
        <TouchableOpacity
          style={[styles.floatingReelsBtn, { bottom: Math.max(insets.bottom + 80, 95) }]}
          onPress={() => navigation.navigate("VideoReels")}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#3B1E54', '#D4AF37']}
            style={styles.reelsBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      <Animated.View
        pointerEvents={hideTabBar ? "none" : "auto"}
        style={[
          styles.tabBarContainer,
          {
            bottom: Math.max(insets.bottom + 10, 24),
            opacity: tabBarAnimation,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.glassTabBar}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isCenter = tab.id === "Matches";

            if (isCenter) {
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[
                    styles.centerTabItem,
                    isActive && styles.centerTabItemActive,
                  ]}
                  activeOpacity={0.85}
                >
                  <Icon
                    size={28}
                    color={isActive ? palette.gold.main : "#FFFFFF"}
                    fill={isActive ? palette.gold.main : "none"}
                  />
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={styles.tabItem}
                activeOpacity={0.7}
              >
                <View style={styles.iconWrapper}>
                  <Icon
                    size={20}
                    color={isActive ? "#3B1E54" : "#7E6B8F"}
                    fill={isActive && tab.id === "Premium" ? palette.gold.main : "none"}
                  />
                  {tab.id === "Chat" && unreadMessagesCount > 0 && (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>
                        {unreadMessagesCount > 99 ? "99+" : unreadMessagesCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? "#3B1E54" : "#7E6B8F", fontWeight: isActive ? "bold" : "normal" },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* Side Navigation Drawer */}
      <SideDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        setActiveTab={(tab: any) => setActiveTab(tab as TabType)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDFBFF",
  },
  topNavbarSafeArea: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#FDFBFF",
  },
  topNavbar: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: "rgba(255, 255, 255, 0.88)", // White glass background
    borderRadius: 30, // Pill shape
    borderWidth: 1.5,
    borderColor: "rgba(232, 224, 240, 0.8)", // Subtly highlighted border
  },
  leftHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F0FA",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  navLogo: {
    width: 150,
    height: 45,
    marginLeft: -28,
  },
  navActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  screenContainer: {
    flex: 1,
  },
  tabBarContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    alignItems: "center",
    backgroundColor: "transparent",
    overflow: "visible",
  },
  glassTabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    height: 58,
    backgroundColor: "#FFFFFF", // Solid white background
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.4)", // Gold border highlight
    paddingHorizontal: 10,
    overflow: "visible",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  centerTabItem: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#3B1E54", // Deep purple matches button
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateY: -12 }], // Float it up
    borderWidth: 2,
    borderColor: "rgba(212, 175, 55, 0.8)", // Gold border
    ...Platform.select({
      ios: {
        shadowColor: "#3B1E54",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  centerTabItemActive: {
    borderColor: palette.gold.main,
    borderWidth: 2.5,
    backgroundColor: "#3B1E54",
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: 24,
    marginBottom: 2,
    position: "relative",
  },
  badgeContainer: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: palette.status.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    ...fonts.semibold,
    textAlign: "center",
    lineHeight: 12,
  },
  tabLabel: {
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  floatingReelsBtn: {
    position: "absolute",
    right: 20,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99,
    ...Platform.select({
      ios: {
        shadowColor: "#3B1E54",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  reelsBtnGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.6)",
  },
});
