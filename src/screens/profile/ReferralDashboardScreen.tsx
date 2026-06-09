import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Clipboard,
  Share,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft, Gift, Copy, Check, Share2, Sparkles, UserCheck, Clock, HelpCircle, Users
} from 'lucide-react-native';
import { palette } from '../../theme/colors';
import { fonts } from '@/src/theme';
import { getReferralStats } from '../../services/api';
import LinearGradient from 'react-native-linear-gradient';
import { showToast } from '../../utils/toast';

const { width } = Dimensions.get('window');

export default function ReferralDashboardScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<any>({
    referralCode: '',
    totalReferred: 0,
    verifiedReferred: 0,
    premiumDaysEarned: 0,
    referees: []
  });

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await getReferralStats();
      if (res.data.success) {
        setStats(res.data);
      } else {
        showToast(res.data.message || "Could not fetch referral details.");
      }
    } catch (err) {
      console.error("Fetch Referral Stats Error:", err);
      showToast("Error loading referral program details.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const handleCopyCode = () => {
    if (!stats.referralCode) return;
    Clipboard.setString(stats.referralCode);
    setCopied(true);
    showToast("Referral code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareInvite = async () => {
    if (!stats.referralCode) return;
    try {
      const inviteUrl = `https://brideandgroom.co.in/join?ref=${stats.referralCode}`;
      const message = `Join Bride & Groom Matrimony using my referral code "${stats.referralCode}" and we both get 15 days of free premium features!\n\nDownload the app and enter code at sign-up: ${inviteUrl}`;
      
      await Share.share({
        message,
        title: "Bride & Groom Matchmaking Referral Invitation"
      });
    } catch (err) {
      console.error("Share Referral Error:", err);
    }
  };

  if (loading && !stats.referralCode) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: '#F8F7FF' }]}>
        <ActivityIndicator size="large" color={palette.purple.deep} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <ArrowLeft size={22} color="#3B1E54" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite & Earn Premium</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {/* Banner Card */}
        <LinearGradient
          colors={['#3B1E54', '#5A2A82']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerCard}
        >
          <View style={styles.bannerHeader}>
            <View style={styles.giftBadge}>
              <Gift size={26} color={palette.gold.main} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Share the Love,</Text>
              <Text style={styles.bannerSubtitle}>Earn Free Premium</Text>
            </View>
          </View>
          <Text style={styles.bannerDescription}>
            Get 15 days of free premium features (including Video Reels) for every friend who registers and verifies their mobile number!
          </Text>
        </LinearGradient>

        {/* Code Share Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionLabel}>YOUR REFERRAL CODE</Text>
          
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{stats.referralCode || "BGXXXX"}</Text>
            
            <View style={styles.codeActions}>
              <TouchableOpacity onPress={handleCopyCode} style={styles.actionIconButton}>
                {copied ? <Check size={20} color="#4CAF50" /> : <Copy size={20} color="#3B1E54" />}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShareInvite} style={[styles.actionIconButton, styles.shareIconButton]}>
                <Share2 size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(59, 30, 84, 0.05)' }]}>
              <Users size={18} color="#3B1E54" />
            </View>
            <Text style={styles.statVal}>{stats.totalReferred}</Text>
            <Text style={styles.statLabel}>Invited Friends</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(76, 175, 80, 0.08)' }]}>
              <UserCheck size={18} color="#2E7D32" />
            </View>
            <Text style={styles.statVal}>{stats.verifiedReferred}</Text>
            <Text style={styles.statLabel}>Verified Signups</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.statIconCircle, { backgroundColor: 'rgba(214, 175, 55, 0.1)' }]}>
              <Sparkles size={18} color="#D4AF37" />
            </View>
            <Text style={[styles.statVal, { color: '#B58D14' }]}>+{stats.premiumDaysEarned}d</Text>
            <Text style={styles.statLabel}>Premium Gained</Text>
          </View>
        </View>

        {/* How it works */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <HelpCircle size={18} color="#D4AF37" />
            <Text style={styles.cardHeaderTitle}>How Referral Works</Text>
          </View>
          
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepText}>Share your unique invite code with your friends.</Text>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepText}>Your friend registers on the app using your code during registration onboarding.</Text>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
            <Text style={styles.stepText}>Upon successful OTP verification of your friend's mobile number, both of you instantly receive 15 days of Elite Premium access.</Text>
          </View>
        </View>

        {/* Referees List */}
        <View style={[styles.card, { paddingBottom: 12 }]}>
          <Text style={styles.cardSectionLabel}>REFERRAL SUMMARY</Text>
          
          {stats.referees && stats.referees.length > 0 ? (
            stats.referees.map((item: any, idx: number) => (
              <View key={idx} style={[styles.refereeRow, idx === stats.referees.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.refereeProfilePlaceholder}>
                  <Text style={styles.refereeProfilePlaceholderText}>
                    {(item.firstName || "U").substring(0, 1).toUpperCase()}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.refereeName}>{item.firstName} {item.lastName}</Text>
                  <Text style={styles.refereeDate}>
                    Joined {new Date(item.joinedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </Text>
                </View>

                {item.isVerified ? (
                  <View style={[styles.statusBadge, styles.successBadge]}>
                    <UserCheck size={12} color="#2E7D32" style={{ marginRight: 4 }} />
                    <Text style={[styles.statusBadgeText, { color: '#2E7D32' }]}>Verified</Text>
                  </View>
                ) : (
                  <View style={[styles.statusBadge, styles.pendingBadge]}>
                    <Clock size={12} color="#E65100" style={{ marginRight: 4 }} />
                    <Text style={[styles.statusBadgeText, { color: '#E65100' }]}>Pending</Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Users size={32} color="rgba(126, 107, 143, 0.4)" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>No referrals yet. Spread the word to unlock Premium features!</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 30, 84, 0.08)',
    backgroundColor: '#FFFFFF',
  },
  headerBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    ...fonts.bold,
    color: '#3B1E54',
  },
  scrollBody: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  bannerCard: {
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#3B1E54',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  giftBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    ...fonts.semibold,
  },
  bannerSubtitle: {
    color: '#FFFFFF',
    fontSize: 20,
    ...fonts.bold,
  },
  bannerDescription: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    lineHeight: 18,
    ...fonts.medium,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(59, 30, 84, 0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardHeaderTitle: {
    fontSize: 15,
    ...fonts.bold,
    color: '#3B1E54',
  },
  cardSectionLabel: {
    fontSize: 11,
    ...fonts.bold,
    color: '#7E6B8F',
    letterSpacing: 1,
    marginBottom: 10,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3EFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: '#EDE7F6',
  },
  codeText: {
    fontSize: 22,
    ...fonts.bold,
    color: '#3B1E54',
    letterSpacing: 1.5,
  },
  codeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE7F6',
  },
  shareIconButton: {
    backgroundColor: '#3B1E54',
    borderColor: '#3B1E54',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59, 30, 84, 0.06)',
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statVal: {
    fontSize: 18,
    ...fonts.bold,
    color: '#3B1E54',
  },
  statLabel: {
    fontSize: 10,
    color: '#7E6B8F',
    textAlign: 'center',
    marginTop: 2,
    ...fonts.semibold,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  stepNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(90, 42, 130, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 11,
    ...fonts.bold,
    color: '#5A2A82',
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    color: '#7E6B8F',
    lineHeight: 18,
    ...fonts.medium,
  },
  refereeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3EFFF',
  },
  refereeProfilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE7F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refereeProfilePlaceholderText: {
    fontSize: 16,
    ...fonts.bold,
    color: '#3B1E54',
  },
  refereeName: {
    fontSize: 14,
    ...fonts.bold,
    color: '#3B1E54',
  },
  refereeDate: {
    fontSize: 11,
    color: '#7E6B8F',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  successBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 152, 0, 0.12)',
  },
  statusBadgeText: {
    fontSize: 11,
    ...fonts.bold,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#7E6B8F',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    ...fonts.medium,
  }
});
