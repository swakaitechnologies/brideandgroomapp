import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Pressable,
  Alert,
  Platform,
  Animated,
  Share,
  Linking,
  Modal,
  Easing,
  Clipboard,
} from 'react-native';
import {
  Heart, Mail, MessageSquare,
  Settings, Shield, HelpCircle,
  Star, BadgeCheck, Copy, X,
  LogOut, Crown, Ticket, ChevronRight,
  ShieldCheck, Edit3, Download, Share2, User
} from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { palette } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logout } from '../store/authSlice';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../services/secureStorage';
import { API_BASE_URL, getActivePromoBanner, getMySubscription, getProfile, resolvePhotoUrl } from '../services/api';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { fonts } from "@/src/theme";

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH * 0.85; // Standard 85% width

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
};

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab?: (tab: any) => void;
}

export default function SideDrawer({ isOpen, onClose, setActiveTab }: SideDrawerProps) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const { user } = useSelector((state: any) => state.auth);
  const isDark = false; // Default theme mode

  const [promoCoupon, setPromoCoupon] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [appVersion, setAppVersion] = useState('1.1.0');

  useEffect(() => {
    if (isOpen) {
      const fetchPromo = async () => {
        try {
          const res = await getActivePromoBanner();
          if (res.data?.success && res.data?.coupon) {
            setPromoCoupon(res.data.coupon);
          } else {
            setPromoCoupon(null);
          }
        } catch (error) {
          console.warn("Failed to fetch promo banner in side drawer:", error);
          setPromoCoupon(null);
        }
      };
      fetchPromo();

      const fetchSubscription = async () => {
        try {
          const res = await getMySubscription();
          if (res.data?.success && res.data?.subscription) {
            setSubscription(res.data.subscription);
          } else {
            setSubscription(null);
          }
        } catch (error) {
          console.warn("Failed to fetch subscription in side drawer:", error);
          setSubscription(null);
        }
      };
      fetchSubscription();

      const fetchProfile = async () => {
        try {
          const res = await getProfile();
          if (res.data?.success && res.data?.data) {
            setProfileData(res.data.data);
          } else {
            setProfileData(null);
          }
        } catch (error) {
          console.warn("Failed to fetch profile in side drawer:", error);
          setProfileData(null);
        }
      };
      fetchProfile();
    }
  }, [isOpen]);

  const handlePromoApply = async () => {
    if (promoCoupon?.code) {
      await AsyncStorage.setItem('preAppliedCoupon', promoCoupon.code);
    }
    handleTabNavigation("Premium");
  };

  // Dynamic Theme Colors
  const themeBg = isDark ? palette.purple.deep : palette.neutral.white;
  const textColor = isDark ? palette.purple.light : palette.purple.deep;
  const mutedText = isDark ? palette.purple.muted : palette.neutral.grey;
  const borderColor = isDark ? '#3D2B4F' : palette.purple.border;
  const headerBg = isDark ? '#1E1E1E' : '#FAFAFA';
  const cardBg = isDark ? '#1E1E1E' : palette.neutral.white;

  // Animation values using standard Animated
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 140,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.bezier(0.25, 1, 0.5, 1),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          easing: Easing.bezier(0.25, 1, 0.5, 1),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const copyToClipboard = () => {
    const id = profileData?.customId || user?.customId || 'N/A';
    if (id !== 'N/A') {
      Clipboard.setString(id);
      Alert.alert("Custom ID", `${id}\n(Successfully copied to clipboard)`);
    }
  };

  const handleDownloadProfile = async () => {
    try {
      const token = await secureStorage.getItem('token');
      if (!token) {
        Alert.alert("Error", "You must be logged in to download your profile.");
        return;
      }

      const downloadUrl = `${API_BASE_URL}/profile/download/pdf?token=${token}`;

      Alert.alert(
        "Download Profile",
        "Your profile PDF is ready. Would you like to download and view it?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Download & View",
            onPress: async () => {
              onClose();

              const { config, fs } = ReactNativeBlobUtil;
              const { DocumentDir } = fs.dirs;
              const filename = `BrideAndGroom_Profile_${user?.customId || 'User'}.pdf`;
              const localPath = `${DocumentDir}/${filename}`;

              // Remove old file if it exists to ensure freshness
              if (await fs.exists(localPath)) {
                try {
                  await fs.unlink(localPath);
                } catch (e) {
                  console.log("Error unlinking old file:", e);
                }
              }

              config({
                fileCache: true,
                path: localPath,
              })
                .fetch('GET', downloadUrl)
                .then(async (res) => {
                  const filePath = res.path();
                  if (Platform.OS === 'android') {
                    ReactNativeBlobUtil.android.actionViewIntent(filePath, 'application/pdf');
                  } else {
                    ReactNativeBlobUtil.ios.previewDocument(filePath);
                  }
                })
                .catch((err) => {
                  console.error("In-app download error:", err);
                  Alert.alert("Download Error", "Could not download the profile PDF. Please check your network connection.");
                });
            }
          }
        ]
      );
    } catch (error) {
      console.error("Failed to download profile PDF:", error);
      Alert.alert("Error", "Failed to generate profile PDF download link.");
    }
  };

  const handleShareProfile = async () => {
    try {
      const token = await secureStorage.getItem('token');
      let shareUrl = `https://brideandgroom.co.in/profile/${user?.customId || 'user'}`;

      if (token) {
        try {
          const response = await fetch(`${API_BASE_URL}/profile/share`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          });
          const result = await response.json() as any;
          if (result && result.success && result.shareUrl) {
            shareUrl = result.shareUrl;
          }
        } catch (apiError) {
          console.warn("Failed to generate unique share link, falling back to public link:", apiError);
        }
      }

      await Share.share({
        message: `Check out my profile on Bride & Groom: ${shareUrl}`,
        title: 'Share my profile',
      });
    } catch (error: any) {
      console.error(error.message);
      Alert.alert("Error", "Could not share profile. Please try again.");
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const executeLogout = () => {
    setLogoutModalVisible(false);
    onClose();
    dispatch(logout() as any);
    navigation.reset({
      index: 0,
      routes: [{ name: "Welcome" }],
    });
  };

  const handleTabNavigation = (tabName: string) => {
    onClose();
    if (setActiveTab) {
      setActiveTab(tabName);
    }
  };

  const MenuItem = ({ icon: Icon, label, onPress, badge }: any) => (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: borderColor }]} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Icon size={22} color={isDark ? palette.gold.main : palette.purple.deep} />
        <Text style={[styles.menuItemLabel, { color: textColor }]}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {badge && (
          <View style={styles.itemBadge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <ChevronRight size={18} color={mutedText} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View
      style={[styles.container, { zIndex: isOpen ? 1000 : -1 }]}
      pointerEvents={isOpen ? "auto" : "none"}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          styles.drawer,
          {
            paddingTop: insets.top,
            backgroundColor: themeBg,
            transform: [{ translateX: slideAnim }]
          }
        ]}
      >
        <View style={[styles.header, { backgroundColor: headerBg }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutTopBtn}>
              <LogOut size={20} color="#FF4D4D" />
              <Text style={styles.logoutTopText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          {/* Personalized profile header */}
          <View style={styles.profileSection}>
            <Image
              source={{
                uri: resolvePhotoUrl(
                  profileData?.photos?.find((p: any) => p.isMain === true || p.isMain === 1 || p.isMain === "1")?.url ||
                  profileData?.photos?.[0]?.url ||
                  `https://api.dicebear.com/7.x/avataaars/png?seed=${user?.email || "default"}`
                )
              }}
              style={[
                styles.avatar,
                subscription ? { borderColor: palette.gold.main } : { borderColor: '#E0E0E0' }
              ]}
            />
            <View style={styles.profileInfo}>
              <Text style={[styles.greetingText, { color: mutedText }]}>
                {getGreeting()},
              </Text>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: textColor }]} numberOfLines={1}>
                  {profileData?.firstName || user?.firstName || "Valued"} {profileData?.lastName || user?.lastName || "Member"}
                </Text>
                {profileData?.verificationStatus === "approved" && (
                  <ShieldCheck size={16} color="#4CAF50" style={{ marginLeft: 6 }} />
                )}
                {profileData?.isKycVerified && (
                  <BadgeCheck size={16} color={palette.gold.main} style={{ marginLeft: 4 }} />
                )}
              </View>
              <TouchableOpacity onPress={copyToClipboard} style={styles.idBadge}>
                <Text style={styles.idText}>ID: {profileData?.customId || user?.customId || "MEMBER"}</Text>
                <Copy size={11} color={palette.purple.deep} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Plan Status Card */}
          <View style={[styles.planCard, { backgroundColor: isDark ? '#1E1E1E' : '#F9F7FF', borderColor: borderColor }]}>
            {subscription ? (
              <>
                <View style={styles.planCardHeader}>
                  <View style={[styles.planBadge, { backgroundColor: palette.gold.main }]}>
                    <Crown size={14} color={palette.purple.deep} />
                  </View>
                  <View style={styles.planCardInfo}>
                    <Text style={[styles.planCardTitle, { color: textColor }]}>{subscription.plan?.name || 'Premium'} Plan</Text>
                    <Text style={[styles.planCardSub, { color: mutedText }]}>
                      Expires: {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                    </Text>
                  </View>
                </View>
                <View style={styles.planCardDetails}>
                  <View style={styles.planDetailItem}>
                    <Text style={[styles.planDetailValue, { color: textColor }]}>{subscription.plan?.durationDays || '—'}</Text>
                    <Text style={[styles.planDetailLabel, { color: mutedText }]}>Days</Text>
                  </View>
                  <View style={[styles.planDetailDivider, { backgroundColor: borderColor }]} />
                  <View style={styles.planDetailItem}>
                    <Text style={[styles.planDetailValue, { color: textColor }]}>{subscription.contactsUsed || 0}</Text>
                    <Text style={[styles.planDetailLabel, { color: mutedText }]}>Contacts</Text>
                  </View>
                  <View style={[styles.planDetailDivider, { backgroundColor: borderColor }]} />
                  <View style={styles.planDetailItem}>
                    <Text style={[styles.planDetailValue, { color: textColor }]}>{subscription.plan?.maxMessages === -1 ? '∞' : (subscription.messagesUsed || 0)}</Text>
                    <Text style={[styles.planDetailLabel, { color: mutedText }]}>Messages</Text>
                  </View>
                </View>
              </>
            ) : (
              <TouchableOpacity style={styles.planCardFree} onPress={() => handleTabNavigation('Premium')} activeOpacity={0.7}>
                <View style={styles.planCardFreeHeader}>
                  <View style={[styles.planBadge, { backgroundColor: '#E0E0E0' }]}>
                    <User size={14} color="#888" />
                  </View>
                  <View style={styles.planCardInfo}>
                    <Text style={[styles.planCardTitle, { color: textColor }]}>Free Plan</Text>
                    <Text style={[styles.planCardSub, { color: mutedText }]}>Limited features available</Text>
                  </View>
                </View>
                <View style={[styles.upgradePlanBtn, { backgroundColor: palette.gold.main }]}>
                  <Crown size={12} color={palette.purple.deep} />
                  <Text style={[styles.upgradePlanText, { color: palette.purple.deep }]}>Upgrade</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerBtn, { borderColor: borderColor }]}
              onPress={() => { onClose(); navigation.navigate('EditProfile'); }}
            >
              <Edit3 size={13} color={isDark ? palette.gold.main : palette.purple.deep} />
              <Text 
                numberOfLines={1} 
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
                style={[styles.headerBtnText, { color: textColor }]}
              >
                Edit Profile
              </Text>
            </TouchableOpacity>
            <View style={[styles.headerDivider, { backgroundColor: borderColor }]} />
            <TouchableOpacity style={styles.headerBtn} onPress={handleDownloadProfile}>
              <Download size={13} color={isDark ? palette.gold.main : palette.purple.deep} />
              <Text 
                numberOfLines={1} 
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
                style={[styles.headerBtnText, { color: textColor }]}
              >
                Download
              </Text>
            </TouchableOpacity>
            <View style={[styles.headerDivider, { backgroundColor: borderColor }]} />
            <TouchableOpacity style={styles.headerBtn} onPress={handleShareProfile}>
              <Share2 size={13} color={isDark ? palette.gold.main : palette.purple.deep} />
              <Text 
                numberOfLines={1} 
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
                style={[styles.headerBtnText, { color: textColor }]}
              >
                Share
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Category Group 1: Preferences & Matches */}
          <View style={[styles.menuGroupCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
            <Text style={[styles.groupHeading, { color: mutedText }]}>Preferences & Matches</Text>
            <MenuItem icon={Settings} label="Partner Preference" onPress={() => { onClose(); navigation.navigate('PartnerPreference'); }} />
            <MenuItem icon={Shield} label="Contact Filter" onPress={() => { onClose(); navigation.navigate('ContactFilter'); }} />
          </View>

          {/* Category Group 2: Verification & Settings */}
          <View style={[styles.menuGroupCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
            <Text style={[styles.groupHeading, { color: mutedText }]}>Verification & Settings</Text>
            <MenuItem icon={ShieldCheck} label="KYC Verification" onPress={() => { onClose(); navigation.navigate('KYCVerification'); }} />
            <MenuItem icon={User} label="Account Setting" onPress={() => { onClose(); navigation.navigate('AccountSetting'); }} />
            <MenuItem icon={ShieldCheck} label="Be Safe Online" onPress={() => { onClose(); navigation.navigate('Safety'); }} />
          </View>

          {/* Category Group 3: Support & Feedback */}
          <View style={[styles.menuGroupCard, { backgroundColor: cardBg, borderColor: borderColor }]}>
            <Text style={[styles.groupHeading, { color: mutedText }]}>Support & Feedback</Text>
            <MenuItem icon={HelpCircle} label="Help & Support" onPress={() => { onClose(); navigation.navigate('HelpSupport'); }} />
            <MenuItem icon={Star} label="Rate the App" onPress={() => { onClose(); Alert.alert("Rate App", "Thank you for using Bride & Groom! Rating popup is coming soon."); }} />
          </View>

          {/* Section: Promotions */}
          {promoCoupon && (
            <View style={styles.couponSection}>
              <View style={[styles.couponCard, { backgroundColor: isDark ? '#1E1E1E' : '#F9F7FF', borderColor: isDark ? palette.gold.main : palette.purple.border }]}>
                <Ticket size={24} color={palette.gold.main} />
                <View style={styles.couponInfo}>
                  <Text style={[styles.couponTitle, { color: textColor }]}>{promoCoupon.description}</Text>
                  <Text style={[styles.couponSubtitle, { color: mutedText }]}>Use code: {promoCoupon.code}</Text>
                </View>
                <TouchableOpacity style={styles.applyBtn} onPress={handlePromoApply}>
                  <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={styles.footerInfo}>
            <View style={styles.footerLinksRow}>
              <TouchableOpacity onPress={() => { onClose(); navigation.navigate('TermsConditions'); }}>
                <Text style={[styles.footerLink, { color: mutedText, textDecorationLine: 'underline' }]}>Terms & Conditions</Text>
              </TouchableOpacity>
              <Text style={{ color: mutedText, marginHorizontal: 8, fontSize: 11 }}>|</Text>
              <TouchableOpacity onPress={() => { onClose(); navigation.navigate('PrivacyPolicy'); }}>
                <Text style={[styles.footerLink, { color: mutedText, textDecorationLine: 'underline' }]}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.copyrightText, { color: isDark ? palette.purple.muted : palette.neutral.grey }]}>© 2026 Bride & Groom. All Rights Reserved.</Text>
            <Text style={styles.versionText}>App Version: {appVersion}</Text>
          </View>
        </ScrollView>

        {/* Section: Bottom Upgrade Bar */}
        <View
          style={[
            styles.upgradeBar,
            {
              backgroundColor: cardBg,
              borderTopColor: borderColor,
              paddingBottom: 15 + insets.bottom
            }
          ]}
        >
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => handleTabNavigation("Premium")}
          >
            {user?.accountType === 'Premium' ? (
              <>
                <Star size={20} color={palette.purple.deep} fill={palette.purple.deep} />
                <Text style={styles.upgradeText}>Manage Membership</Text>
              </>
            ) : (
              <>
                <Crown size={20} color={palette.purple.deep} />
                <Text style={styles.upgradeText}>Upgrade Now</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Custom Logout Modal */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.logoutModalOverlay}>
          <View style={styles.logoutModalContent}>
            <View style={styles.logoutIconWrapper}>
              <LogOut size={24} color="#FF3B30" />
            </View>
            <Text style={styles.logoutModalTitle}>Confirm Logout</Text>
            <Text style={styles.logoutModalMessage}>Are you sure you want to sign out of your account?</Text>
            
            <View style={styles.logoutActions}>
              <TouchableOpacity 
                style={styles.logoutCancelBtn} 
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.logoutCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.logoutConfirmBtn} 
                onPress={executeLogout}
              >
                <Text style={styles.logoutConfirmBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: palette.neutral.white,
    position: 'absolute',
    left: 0,
    top: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoutTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  logoutTopText: {
    fontSize: 14,
    ...fonts.semibold,
    color: '#FF4D4D',
    marginLeft: 8,
  },
  closeBtn: {
    padding: 5,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 5,
    paddingHorizontal: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    ...fonts.semibold,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userName: {
    fontSize: 18,
    ...fonts.bold,
  },
  idBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  idText: {
    fontSize: 11,
    ...fonts.bold,
    color: palette.purple.deep,
  },
  menuGroupCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#3B1E54',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 5,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  groupHeading: {
    fontSize: 11,
    ...fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingVertical: 6,
    opacity: 0.7,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userId: {
    fontSize: 13,
    color: palette.purple.muted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    backgroundColor: 'rgba(59, 30, 84, 0.05)',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerBtnText: {
    fontSize: 11,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginLeft: 4,
  },
  headerDivider: {
    width: 1,
    height: 15,
    backgroundColor: palette.purple.border,
    marginHorizontal: 2,
  },
  scrollContent: {
    paddingTop: 15,
    paddingBottom: 120,
  },
  sectionLabel: {
    fontSize: 12,
    ...fonts.semibold,
    color: palette.purple.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemLabel: {
    fontSize: 15,
    color: palette.purple.deep,
    marginLeft: 15,
    ...fonts.medium,
  },
  itemBadge: {
    backgroundColor: '#FF4D4D',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    ...fonts.semibold,
  },
  divider: {
    height: 1,
    backgroundColor: palette.purple.border,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  couponSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 30, 84, 0.05)',
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: palette.gold.main,
    borderStyle: 'dashed',
  },
  couponInfo: {
    flex: 1,
    marginLeft: 12,
  },
  couponTitle: {
    fontSize: 14,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  couponSubtitle: {
    fontSize: 11,
    color: palette.purple.muted,
  },
  applyBtn: {
    backgroundColor: palette.gold.main,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyBtnText: {
    fontSize: 11,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  footerInfo: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 28,
    alignItems: 'center',
  },
  footerLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 11,
    color: palette.purple.muted,
  },
  copyrightText: {
    fontSize: 10,
    color: palette.neutral.grey,
    marginBottom: 8,
  },
  versionText: {
    fontSize: 10,
    color: palette.neutral.grey,
    ...fonts.semibold,
  },
  upgradeBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    borderTopWidth: 1,
  },
  upgradeBtn: {
    backgroundColor: palette.gold.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  upgradeText: {
    color: palette.purple.deep,
    ...fonts.semibold,
    fontSize: 16,
    marginLeft: 10,
  },
  planCard: {
    marginHorizontal: 0,
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  planCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCardInfo: {
    marginLeft: 10,
    flex: 1,
  },
  planCardTitle: {
    fontSize: 14,
    ...fonts.semibold,
  },
  planCardSub: {
    fontSize: 10,
    marginTop: 1,
  },
  planCardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 30, 84, 0.08)',
  },
  planDetailItem: {
    alignItems: 'center',
    flex: 1,
  },
  planDetailValue: {
    fontSize: 14,
    ...fonts.bold,
  },
  planDetailLabel: {
    fontSize: 9,
    marginTop: 1,
  },
  planDetailDivider: {
    width: 1,
    height: 18,
  },
  planCardFree: {
    flexDirection: 'column',
  },
  planCardFreeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradePlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginTop: 10,
  },
  upgradePlanText: {
    fontSize: 12,
    ...fonts.semibold,
  },
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  logoutIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoutModalTitle: {
    fontSize: 18,
    ...fonts.semibold,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  logoutModalMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  logoutActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  logoutCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutCancelBtnText: {
    fontSize: 14,
    ...fonts.semibold,
    color: '#666666',
  },
  logoutConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutConfirmBtnText: {
    fontSize: 14,
    ...fonts.semibold,
    color: '#FFFFFF',
  },
});

