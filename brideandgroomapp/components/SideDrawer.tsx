import React, { useEffect } from 'react';
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
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { 
  User, Edit3, Download, Share2, 
  Heart, Mail, MessageSquare, 
  Settings, Shield, HelpCircle, 
  Star, BadgeCheck, Copy, X,
  LogOut, Crown, Ticket, ChevronRight,
  ShieldCheck, Smartphone
} from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/src/store';
import { palette } from '@/src/theme/colors';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logout } from '@/src/store/authSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH; // Full screen width

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { mode } = useSelector((state: RootState) => state.theme);
  const isDark = mode === 'dark';

  // Dynamic Theme Colors
  const themeBg = isDark ? palette.purple.dark : palette.neutral.white;
  const textColor = isDark ? palette.purple.light : palette.purple.deep;
  const mutedText = isDark ? palette.purple.muted : palette.neutral.grey;
  const borderColor = isDark ? '#3D2B4F' : palette.purple.border;
  const headerBg = isDark ? '#1E1E1E' : '#FAFAFA';
  const cardBg = isDark ? '#1E1E1E' : palette.neutral.white;
  
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(isOpen ? 1 : 0, {
      stiffness: 1000,
      damping: 500,
      mass: 3,
    });
  }, [isOpen]);

  const animatedDrawerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          translateX: interpolate(
            progress.value,
            [0, 1],
            [-DRAWER_WIDTH, 0],
            Extrapolation.CLAMP
          ) 
        }
      ],
    };
  });

  const animatedBackdropStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(progress.value, { duration: 300 }),
    };
  });

  const copyToClipboard = async () => {
    const id = user?.customId || 'N/A';
    await Clipboard.setStringAsync(id);
    Alert.alert("Copied", "Custom ID copied to clipboard.");
  };

  const handleDownloadProfile = async () => {
    try {
      const html = `
        <html>
          <body style="font-family: sans-serif; padding: 20px;">
            <h1 style="color: #3B1E54;">${user?.firstName} ${user?.lastName}</h1>
            <p><strong>ID:</strong> ${user?.customId}</p>
            <p><strong>Email:</strong> ${user?.email}</p>
            <hr/>
            <p>This is a generated profile summary from Bride & Groom.</p>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (error) {
      Alert.alert("Error", "Failed to generate PDF.");
    }
  };

  const handleShareProfile = async () => {
    try {
      const shareUrl = `https://brideandgroom.co.in/profile/${user?.customId}`;
      await Sharing.shareAsync(shareUrl, {
        dialogTitle: 'Share my profile',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", onPress: () => {
          onClose();
          dispatch(logout() as any);
        } 
      }
    ]);
  };

  const MenuItem = ({ icon: Icon, label, onPress, badge }: any) => (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: borderColor }]} onPress={() => { onClose(); onPress(); }}>
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
    <View style={[styles.container, { zIndex: isOpen ? 1000 : -1, pointerEvents: isOpen ? 'auto' : 'none' }]}>
      {/* Backdrop */}
      {isOpen && (
        <Animated.View 
          style={[styles.backdrop, animatedBackdropStyle]}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>
      )}

      {/* Drawer */}
      <Animated.View 
        style={[
          styles.drawer, 
          animatedDrawerStyle,
          { paddingTop: insets.top, backgroundColor: themeBg }
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
          
          <View style={styles.profileSection}>
            <Image 
              source={{ uri: user?.profilePicture || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + user?.email }} 
              style={styles.avatar} 
            />
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: textColor }]}>{user?.firstName} {user?.lastName}</Text>
                {user?.isVerified && <BadgeCheck size={18} color="#2196F3" style={{ marginLeft: 5 }} />}
              </View>
              <TouchableOpacity style={styles.idRow} onPress={copyToClipboard}>
                <Text style={[styles.userId, { color: mutedText }]}>ID: {user?.customId || 'Pending'}</Text>
                <Copy size={12} color={mutedText} style={{ marginLeft: 5 }} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.headerBtn, { borderColor: borderColor }]} 
              onPress={() => { onClose(); router.push('/edit-profile'); }}
            >
              <Edit3 size={16} color={isDark ? palette.gold.main : palette.purple.deep} />
              <Text style={[styles.headerBtnText, { color: textColor }]}>Edit Profile</Text>
            </TouchableOpacity>
            <View style={[styles.headerDivider, { backgroundColor: borderColor }]} />
            <TouchableOpacity style={styles.headerBtn} onPress={handleDownloadProfile}>
              <Download size={16} color={isDark ? palette.gold.main : palette.purple.deep} />
              <Text style={[styles.headerBtnText, { color: textColor }]}>Download</Text>
            </TouchableOpacity>
            <View style={[styles.headerDivider, { backgroundColor: borderColor }]} />
            <TouchableOpacity style={styles.headerBtn} onPress={handleShareProfile}>
              <Share2 size={16} color={isDark ? palette.gold.main : palette.purple.deep} />
              <Text style={[styles.headerBtnText, { color: textColor }]}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Section: Discover */}
          <Text style={[styles.sectionLabel, { color: mutedText }]}>Discover your matches</Text>
          <MenuItem 
            icon={Heart} 
            label="Matches" 
            onPress={() => router.push('/(tabs)/matches')} 
          />
          <MenuItem 
            icon={Mail} 
            label="Inbox" 
            onPress={() => router.push('/(tabs)/inbox')} 
            badge="5"
          />
          <MenuItem 
            icon={MessageSquare} 
            label="Chat" 
            onPress={() => router.push('/(tabs)/chats')} 
          />

          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          {/* Section: Options & Settings */}
          <Text style={[styles.sectionLabel, { color: mutedText }]}>Options & Settings</Text>
          <MenuItem icon={Settings} label="Partner Preference" onPress={() => {}} />
          <MenuItem icon={Shield} label="Contact Filter" onPress={() => {}} />
          <MenuItem icon={User} label="Account Setting" onPress={() => {}} />
          <MenuItem icon={HelpCircle} label="Help & Support" onPress={() => {}} />
          <MenuItem icon={ShieldCheck} label="Be Safe Online" onPress={() => {}} />
          <MenuItem icon={Star} label="Rate the App" onPress={() => {}} />

          {/* Section: Promotions */}
          <View style={styles.couponSection}>
            <View style={[styles.couponCard, { backgroundColor: isDark ? '#1E1E1E' : '#F9F7FF', borderColor: isDark ? palette.gold.main : palette.purple.border }]}>
              <Ticket size={24} color={palette.gold.main} />
              <View style={styles.couponInfo}>
                <Text style={[styles.couponTitle, { color: textColor }]}>FLAT 50% OFF</Text>
                <Text style={[styles.couponSubtitle, { color: mutedText }]}>Use code: FIRST50</Text>
              </View>
              <TouchableOpacity style={styles.applyBtn}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerInfo}>
            <Text style={[styles.footerLink, { color: mutedText }]}>Terms & Conditions</Text>
            <Text style={[styles.copyrightText, { color: isDark ? palette.purple.muted : palette.neutral.grey }]}>© 2026 Bride & Groom. All Rights Reserved.</Text>
            <Text style={styles.versionText}>App Version: 1.0.5</Text>
          </View>
        </ScrollView>

        {/* Section: Bottom Upgrade Bar */}
        <View 
          style={[
            styles.upgradeBar, 
            { 
              backgroundColor: cardBg, 
              borderTopColor: borderColor,
              paddingBottom: 20 + insets.bottom 
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.upgradeBtn} 
            onPress={() => { onClose(); router.push('/(tabs)/premium'); }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
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
      web: {
        boxShadow: '5px 0px 10px rgba(0,0,0,0.2)',
      },
    }),
  },
  header: {
    padding: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  logoutTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  logoutTopText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF4D4D',
    marginLeft: 8,
  },
  closeBtn: {
    padding: 5,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: palette.gold.main,
  },
  profileInfo: {
    marginLeft: 15,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: palette.purple.deep,
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
    marginTop: 20,
    backgroundColor: 'rgba(59, 30, 84, 0.05)',
    padding: 10,
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
    fontWeight: '600',
    color: palette.purple.deep,
    marginLeft: 6,
  },
  headerDivider: {
    width: 1,
    height: 15,
    backgroundColor: palette.purple.border,
    marginHorizontal: 5,
  },
  scrollContent: {
    paddingTop: 15,
    paddingBottom: 180,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
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
    fontWeight: '500',
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
    fontWeight: 'bold',
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
    backgroundColor: palette.purple.light,
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
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: palette.purple.deep,
  },
  footerInfo: {
    padding: 20,
    alignItems: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerLink: {
    fontSize: 11,
    color: palette.purple.muted,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: palette.neutral.grey,
    marginHorizontal: 8,
  },
  copyrightText: {
    fontSize: 10,
    color: palette.neutral.grey,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 10,
    color: palette.neutral.grey,
    fontWeight: 'bold',
  },
  upgradeBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
  },
  upgradeBtn: {
    backgroundColor: palette.gold.main,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: palette.gold.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: `0px 4px 5px ${palette.gold.main}4D`, // 0.3 opacity in hex is 4D
      },
    }),
  },
  upgradeText: {
    color: palette.purple.deep,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
  },
});
