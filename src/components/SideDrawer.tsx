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
  ActivityIndicator,
} from 'react-native';
import {
  Heart, Mail, MessageSquare,
  Settings, Shield, HelpCircle,
  Star, BadgeCheck, Copy, X,
  LogOut, Crown, Ticket, ChevronRight,
  ShieldCheck, Edit3, Download, Share2, User,
  FileText, EyeOff, Sparkles
} from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { palette } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logout } from '../store/authSlice';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorage } from '../services/secureStorage';
import { API_BASE_URL, getActivePromoBanner, getMySubscription, getProfile, resolvePhotoUrl, getPrivacySettings, updatePrivacySettings } from '../services/api';
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
  const [isProfilePaused, setIsProfilePaused] = useState(false);
  const [isPausedLoading, setIsPausedLoading] = useState(false);
  const isPremium = !!subscription || user?.accountType === 'Premium' || profileData?.accountType === 'Premium';

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error' | 'premium'>('success');
  const [alertButtons, setAlertButtons] = useState<any[]>([]);

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

      const fetchPrivacy = async () => {
        try {
          const res = await getPrivacySettings();
          if (res.data?.success && res.data?.data) {
            setIsProfilePaused(!!res.data.data.isProfilePaused);
          }
        } catch (error) {
          console.warn("Failed to fetch privacy settings in side drawer:", error);
        }
      };
      fetchPrivacy();
    }
  }, [isOpen]);

  const handlePromoApply = async () => {
    if (promoCoupon?.code) {
      await AsyncStorage.setItem('preAppliedCoupon', promoCoupon.code);
    }
    handleTabNavigation("Premium");
  };

  // Dynamic Theme Colors
  const themeBg = isDark ? palette.purple.deep : '#F8F7FA'; // Elegant off-white background
  const textColor = isDark ? palette.purple.light : palette.purple.deep;
  const mutedText = isDark ? palette.purple.muted : palette.neutral.grey;
  const borderColor = isDark ? '#3D2B4F' : 'rgba(59, 30, 84, 0.08)'; // Subtle divider color
  const headerBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';

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

  const showCustomAlert = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'premium' = 'success',
    buttons: any[] = []
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertButtons(buttons);
    setAlertVisible(true);
  };

  const handleTogglePauseProfile = async () => {
    if (!isPremium) {
      showCustomAlert(
        "Premium Feature",
        "Smart Profile Hiding (Pause Mode) is exclusive to premium members. Upgrade now to access this feature.",
        "premium",
        [
          { text: "Cancel", style: "cancel", onPress: () => setAlertVisible(false) },
          { text: "Upgrade Now", onPress: () => { setAlertVisible(false); handleTabNavigation("Premium"); } }
        ]
      );
      return;
    }

    try {
      setIsPausedLoading(true);
      const nextState = !isProfilePaused;
      const res = await updatePrivacySettings({ isProfilePaused: nextState });
      if (res.data?.success) {
        setIsProfilePaused(nextState);
        showCustomAlert(
          "Success",
          nextState
            ? "Your profile is now paused and hidden from search grids and recommendations."
            : "Your profile is now active and visible in discovery.",
          "success",
          [{ text: "Okay", onPress: () => setAlertVisible(false) }]
        );
      } else {
        showCustomAlert(
          "Error",
          res.data?.message || "Failed to update privacy settings. Please try again.",
          "error",
          [{ text: "Okay", onPress: () => setAlertVisible(false) }]
        );
      }
    } catch (error) {
      console.error("Error updating privacy settings:", error);
      showCustomAlert(
        "Error",
        "An error occurred while updating settings.",
        "error",
        [{ text: "Okay", onPress: () => setAlertVisible(false) }]
      );
    } finally {
      setIsPausedLoading(false);
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

  const MenuItem = ({ icon: Icon, label, onPress, badge, isLast, labelColor }: any) => (
    <TouchableOpacity 
      style={[
        styles.menuItem, 
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: borderColor }
      ]} 
      onPress={onPress}
    >
      <View style={styles.menuItemLeft}>
        <Icon size={20} color={labelColor || (isDark ? palette.gold.main : palette.purple.deep)} />
        <Text style={[styles.menuItemLabel, { color: labelColor || textColor }]}>{label}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {badge && (
          <View style={styles.itemBadge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <ChevronRight size={16} color={labelColor || mutedText} />
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
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
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
              <View style={styles.badgeRow}>
                {subscription ? (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(212, 175, 55, 0.12)' }]}>
                    <Crown size={10} color={palette.gold.main} fill={palette.gold.main} />
                    <Text style={[styles.statusBadgeText, { color: palette.gold.main }]}>Premium Member</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(128, 128, 128, 0.1)' }]}>
                    <User size={10} color={mutedText} />
                    <Text style={[styles.statusBadgeText, { color: mutedText }]}>Free Account</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={copyToClipboard} style={styles.idBadge}>
                <Text style={styles.idText}>ID: {profileData?.customId || user?.customId || "MEMBER"}</Text>
                <Copy size={11} color={palette.purple.deep} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Compact Subscription Info */}
          {subscription ? (
            <View style={styles.compactStatsRow}>
              <View style={styles.compactStatItem}>
                <Text style={[styles.compactStatVal, { color: textColor }]}>
                  {subscription.endDate ? Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : '—'}
                </Text>
                <Text style={[styles.compactStatLabel, { color: mutedText }]}>Days Left</Text>
              </View>
              <View style={[styles.compactStatDivider, { backgroundColor: borderColor }]} />
              <View style={styles.compactStatItem}>
                <Text style={[styles.compactStatVal, { color: textColor }]}>
                  {subscription.contactsUsed || 0}
                </Text>
                <Text style={[styles.compactStatLabel, { color: mutedText }]}>Contacts</Text>
              </View>
              <View style={[styles.compactStatDivider, { backgroundColor: borderColor }]} />
              <View style={styles.compactStatItem}>
                <Text style={[styles.compactStatVal, { color: textColor }]}>
                  {subscription.plan?.maxMessages === -1 ? '∞' : (subscription.messagesUsed || 0)}
                </Text>
                <Text style={[styles.compactStatLabel, { color: mutedText }]}>Messages</Text>
              </View>
            </View>
          ) : null}

          {/* Header Action Buttons */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => { onClose(); navigation.navigate('EditProfile'); }}
            >
              <Edit3 size={14} color={palette.purple.deep} />
              <Text style={[styles.headerActionBtnText, { color: textColor }]}>Edit Profile</Text>
            </TouchableOpacity>
            <View style={[styles.headerActionDivider, { backgroundColor: borderColor }]} />
            <TouchableOpacity style={styles.headerActionBtn} onPress={handleDownloadProfile}>
              <Download size={14} color={palette.purple.deep} />
              <Text style={[styles.headerActionBtnText, { color: textColor }]}>Download</Text>
            </TouchableOpacity>
            <View style={[styles.headerActionDivider, { backgroundColor: borderColor }]} />
            <TouchableOpacity style={styles.headerActionBtn} onPress={handleShareProfile}>
              <Share2 size={14} color={palette.purple.deep} />
              <Text style={[styles.headerActionBtnText, { color: textColor }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Category Group 1: Preferences & Matches */}
          <View style={styles.flatSection}>
            <Text style={[styles.flatSectionHeader, { color: mutedText }]}>Preferences & Matches</Text>
            <View style={[styles.flatSectionContent, { backgroundColor: cardBg }]}>
              <MenuItem icon={Settings} label="Partner Preference" onPress={() => { onClose(); navigation.navigate('PartnerPreference'); }} />
              <MenuItem icon={Shield} label="Contact Filter" onPress={() => { onClose(); navigation.navigate('ContactFilter'); }} />
              
              {/* Pause Discovery Toggle */}
              <TouchableOpacity
                style={[styles.menuItem, { borderBottomWidth: 0 }]}
                onPress={handleTogglePauseProfile}
                disabled={isPausedLoading}
              >
                <View style={styles.menuItemLeft}>
                  <EyeOff size={20} color={isDark ? palette.gold.main : palette.purple.deep} />
                  <View style={{ marginLeft: 15 }}>
                    <Text style={[styles.menuItemLabel, { color: textColor, marginLeft: 0 }]}>Pause Discovery</Text>
                    <Text style={{ fontSize: 10, color: mutedText, marginTop: 2 }}>Hide profile from search grids</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {!isPremium && (
                    <Crown size={14} color={palette.gold.main} fill={palette.gold.main} />
                  )}
                  {isPausedLoading ? (
                    <ActivityIndicator size="small" color={isDark ? palette.gold.main : palette.purple.deep} />
                  ) : (
                    <View
                      style={[
                        styles.switchTrack,
                        {
                          backgroundColor: isProfilePaused
                            ? palette.purple.deep
                            : (isDark ? '#3D2B4F' : 'rgba(59, 30, 84, 0.08)')
                        }
                      ]}
                    >
                      <View
                        style={[
                          styles.switchThumb,
                          {
                            transform: [{ translateX: isProfilePaused ? 16 : 0 }],
                            backgroundColor: isProfilePaused ? palette.gold.main : '#FFFFFF'
                          }
                        ]}
                      />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Group 2: Verification & Settings */}
          <View style={styles.flatSection}>
            <Text style={[styles.flatSectionHeader, { color: mutedText }]}>Verification & Settings</Text>
            <View style={[styles.flatSectionContent, { backgroundColor: cardBg }]}>
              <MenuItem icon={ShieldCheck} label="KYC Verification" onPress={() => { onClose(); navigation.navigate('KYCVerification'); }} />
              <MenuItem icon={User} label="Account Setting" onPress={() => { onClose(); navigation.navigate('AccountSetting'); }} />
              <MenuItem icon={ShieldCheck} label="Be Safe Online" onPress={() => { onClose(); navigation.navigate('Safety'); }} isLast={true} />
            </View>
          </View>

          {/* Category Group 3: Support & Feedback */}
          <View style={styles.flatSection}>
            <Text style={[styles.flatSectionHeader, { color: mutedText }]}>Support & Feedback</Text>
            <View style={[styles.flatSectionContent, { backgroundColor: cardBg }]}>
              <MenuItem icon={HelpCircle} label="Help & Support" onPress={() => { onClose(); navigation.navigate('HelpSupport'); }} />
              <MenuItem icon={Star} label="Rate the App" onPress={() => { onClose(); Alert.alert("Rate App", "Thank you for using Bride & Groom! Rating popup is coming soon."); }} />
              <MenuItem icon={FileText} label="Terms & Conditions" onPress={() => { onClose(); navigation.navigate('TermsConditions'); }} />
              <MenuItem icon={Shield} label="Privacy Policy" onPress={() => { onClose(); navigation.navigate('PrivacyPolicy'); }} />
              <MenuItem icon={Heart} label="Share Success Story" onPress={() => { onClose(); navigation.navigate('SubmitStory'); }} />
              <MenuItem icon={Sparkles} label="Success Stories" onPress={() => { onClose(); navigation.navigate('SuccessStories'); }} isLast={true} />
            </View>
          </View>

          {/* Section: Promotions */}
          {promoCoupon && (
            <View style={styles.couponSection}>
              <View style={[styles.couponCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFF9E6', borderColor: palette.gold.main }]}>
                <Ticket size={20} color={palette.gold.main} />
                <View style={styles.couponInfo}>
                  <Text style={[styles.couponTitle, { color: textColor }]}>{promoCoupon.description}</Text>
                  <Text style={[styles.couponSubtitle, { color: mutedText }]}>Use code: {promoCoupon.code}</Text>
                </View>
                <TouchableOpacity style={styles.applyBtn} onPress={handlePromoApply}>
                  <Text style={[styles.applyBtnText, { color: palette.purple.deep }]}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Logout Button Section */}
          <View style={[styles.flatSection, { marginBottom: 20 }]}>
            <View style={[styles.flatSectionContent, { backgroundColor: cardBg }]}>
              <MenuItem 
                icon={LogOut} 
                label="Logout" 
                onPress={handleLogout} 
                isLast={true} 
                labelColor="#FF3B30" 
              />
            </View>
          </View>

          <View style={styles.footerInfo}>
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

      {/* Custom Premium Alert Modal */}
      <Modal
        visible={alertVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContent}>
            {/* Header Icon */}
            <View style={[
              styles.alertIconContainer,
              alertType === 'success' && { backgroundColor: 'rgba(76, 175, 80, 0.1)' },
              alertType === 'error' && { backgroundColor: 'rgba(255, 77, 77, 0.1)' },
              alertType === 'premium' && { backgroundColor: 'rgba(212, 175, 55, 0.1)' },
            ]}>
              {alertType === 'success' && <ShieldCheck size={28} color="#4CAF50" />}
              {alertType === 'error' && <X size={28} color="#FF3B30" />}
              {alertType === 'premium' && <Crown size={28} color={palette.gold.main} fill={palette.gold.main} />}
            </View>

            <Text style={[styles.alertModalTitle, { color: textColor }]}>{alertTitle}</Text>
            <Text style={styles.alertModalMessage}>{alertMessage}</Text>

            <View style={styles.alertActions}>
              {alertButtons.map((btn, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.alertBtn,
                    btn.style === 'cancel' ? styles.alertCancelBtn : styles.alertConfirmBtn,
                    alertType === 'premium' && btn.style !== 'cancel' && { backgroundColor: palette.gold.main }
                  ]}
                  onPress={btn.onPress}
                >
                  <Text style={[
                    styles.alertBtnText,
                    btn.style === 'cancel' ? styles.alertCancelBtnText : styles.alertConfirmBtnText,
                    alertType === 'premium' && btn.style !== 'cancel' && { color: palette.purple.deep }
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(59, 30, 84, 0.08)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
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
    marginTop: 8,
    marginBottom: 8,
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
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    ...fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  compactStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#FAF9FC',
    borderRadius: 10,
  },
  compactStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  compactStatVal: {
    fontSize: 14,
    ...fonts.bold,
  },
  compactStatLabel: {
    fontSize: 9,
    marginTop: 2,
  },
  compactStatDivider: {
    width: 1,
    height: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 14,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
    flex: 1,
  },
  headerActionBtnText: {
    fontSize: 12,
    ...fonts.semibold,
  },
  headerActionDivider: {
    width: 1,
    height: 12,
  },
  scrollContent: {
    paddingTop: 15,
    paddingBottom: 120,
  },
  flatSection: {
    marginTop: 20,
    marginHorizontal: 16,
  },
  flatSectionHeader: {
    fontSize: 11,
    ...fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  flatSectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
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
  couponSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  couponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  couponInfo: {
    flex: 1,
  },
  couponTitle: {
    fontSize: 13,
    ...fonts.semibold,
  },
  couponSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  applyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyBtnText: {
    fontSize: 11,
    ...fonts.semibold,
  },
  footerInfo: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 4,
  },
  copyrightText: {
    fontSize: 10,
    color: palette.neutral.grey,
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(59, 30, 84, 0.1)',
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
  logoutModalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalContent: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoutModalTitle: {
    fontSize: 18,
    ...fonts.bold,
    color: '#3B1E54', // Theme deep purple
    marginBottom: 8,
    textAlign: 'center',
  },
  logoutModalMessage: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  logoutActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  logoutCancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F2F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutCancelBtnText: {
    fontSize: 13,
    ...fonts.semibold,
    color: '#666666',
  },
  logoutConfirmBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutConfirmBtnText: {
    fontSize: 13,
    ...fonts.semibold,
    color: '#FFFFFF',
  },
  switchTrack: {
    width: 40,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  alertModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertModalContent: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  alertIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  alertModalTitle: {
    fontSize: 20,
    ...fonts.bold,
    marginBottom: 10,
    textAlign: 'center',
  },
  alertModalMessage: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  alertActions: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
    justifyContent: 'center',
  },
  alertBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertCancelBtn: {
    backgroundColor: '#F3F2F5',
  },
  alertConfirmBtn: {
    backgroundColor: palette.purple.deep,
  },
  alertBtnText: {
    fontSize: 14,
    ...fonts.semibold,
  },
  alertCancelBtnText: {
    color: '#666666',
  },
  alertConfirmBtnText: {
    color: '#FFFFFF',
  },
});

