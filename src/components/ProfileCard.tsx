import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Heart, MessageCircle, Star, Crown, MapPin, Zap, User, Languages, Briefcase, Award, BookOpen, Lock } from 'lucide-react-native';
import { palette } from '../theme/colors';
import { resolvePhotoUrl } from '../services/api';
import { fonts } from "@/src/theme";

const { width } = Dimensions.get('window');

interface ProfileCardProps {
  profile: any;
  onPress?: () => void;
  type?: 'premium' | 'grid' | 'visitor';
  isDark?: boolean;
  style?: any;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  onPress, 
  type = 'grid',
  isDark = false,
  style
}) => {
  const navigation = useNavigation<any>();
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDark ? '#F0F0F0' : '#1A1A1A';
  const mutedText = isDark ? '#A0A0A0' : '#8E8E93';
  const accentColor = palette.gold.main;
  const deepPurple = '#3B1E54';

  const isPremium = profile.accountType === 'Premium' || profile.isPremium === true || profile.isPremium === 1;

  // Helper to extract main photo url
  const getPhotoUrl = () => {
    const mainPhoto = profile.photos?.find((p: any) => p.isMain === true || p.isMain === 1 || p.isMain === '1')?.url || 
                      profile.photos?.[0]?.url || 
                      `https://api.dicebear.com/7.x/avataaars/png?seed=${profile.firstName || profile.id || 'default'}`;
    return resolvePhotoUrl(mainPhoto);
  };

  // Compute age from dob
  const computeAge = (dob: string | null | undefined): number | null => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const displayAge = profile.age || computeAge(profile.dob) || 'N/A';

  const isPhotoLocked = profile.photosLocked && (profile.privacySettings?.photoVisibility === 'Verified' || profile.privacySettings?.photoVisibility === 'Selected');

  if (type === 'visitor') {
    return (
      <TouchableOpacity style={[styles.visitorItem, style]} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.visitorAvatarContainer}>
          <Image
            source={{ uri: getPhotoUrl() }}
            style={styles.visitorAvatar}
            blurRadius={isPhotoLocked ? (Platform.OS === 'ios' ? 12 : 6) : undefined}
          />
          {isPremium && (
            <View style={[styles.visitorPremiumBadge, { backgroundColor: accentColor }]}>
              <Crown size={8} color={deepPurple} />
            </View>
          )}
        </View>
        <Text style={[styles.visitorName, { color: textColor }]} numberOfLines={1}>
          {profile.firstName}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[
        type === 'premium' ? styles.premiumCard : styles.gridCard, 
        { backgroundColor: cardBg },
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: getPhotoUrl() }}
          style={type === 'premium' ? styles.premiumImage : styles.gridImage}
          blurRadius={isPhotoLocked ? (Platform.OS === 'ios' ? 15 : 8) : undefined}
        />
        {isPhotoLocked && (
          <View style={styles.cardLockOverlay}>
            <Lock size={16} color={accentColor} />
            <Text style={styles.cardLockText}>
              {profile.privacySettings?.photoVisibility === 'Verified' ? 'Premium Only' : 'Liked Only'}
            </Text>
          </View>
        )}
        {isPremium && (
          <View style={[styles.premiumTag, { backgroundColor: accentColor }]}>
            <Crown size={12} color={deepPurple} />
            <Text style={styles.premiumTagText}>PREMIUM</Text>
          </View>
        )}
        <TouchableOpacity style={styles.favoriteBtn}>
          <Heart size={20} color={isPremium ? accentColor : '#FFF'} fill={isPremium ? 'transparent' : 'rgba(0,0,0,0.2)'} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={[styles.nameText, { color: textColor }]} numberOfLines={1}>
            {profile.firstName}{displayAge !== 'N/A' ? `, ${displayAge}` : ''}
          </Text>
          {isPremium && <Star size={14} color={accentColor} fill={accentColor} />}
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <User size={12} color={mutedText} />
            <Text style={[styles.detailText, { color: mutedText }]}>{profile.height || '—'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Languages size={12} color={mutedText} />
            <Text style={[styles.detailText, { color: mutedText }]}>{profile.motherTongue || profile.language || '—'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Award size={12} color={mutedText} />
            <Text style={[styles.detailText, { color: mutedText }]}>{profile.religion || '—'}</Text>
          </View>
          <View style={styles.detailItem}>
            <BookOpen size={12} color={mutedText} />
            <Text style={[styles.detailText, { color: mutedText }]}>{profile.caste || '—'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Briefcase size={12} color={mutedText} />
            <Text style={[styles.detailText, { color: mutedText }]}>{profile.profession || '—'}</Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin size={12} color={mutedText} />
            <Text style={[styles.detailText, { color: mutedText }]} numberOfLines={1}>
              {[profile.city, profile.state].filter(Boolean).join(', ') || '—'}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.connectBtn, { backgroundColor: deepPurple }]}
          onPress={(e) => {
            e.stopPropagation();
            if (onPress) {
              onPress();
            } else {
              navigation.navigate("ProfileDetail", { profile });
            }
          }}
        >
          <Zap size={14} color={accentColor} />
          <Text style={[styles.connectBtnText, { color: accentColor }]}>VIEW PROFILE</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  premiumCard: {
    flexDirection: 'row',
    width: 325,
    height: 160,
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 15 },
      android: { elevation: 4 },
    }),
  },
  gridCard: {
    flexDirection: 'row',
    width: '100%',
    height: 160,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F1F1',
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 2 },
    }),
  },
  imageContainer: {
    position: 'relative',
    width: 125,
    height: '100%',
  },
  premiumImage: {
    width: '100%',
    height: '100%',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  premiumTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  premiumTagText: {
    fontSize: 8,
    ...fonts.bold,
    color: '#3B1E54',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 14,
    ...fonts.bold,
    flex: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: '46%',
  },
  detailText: {
    fontSize: 10,
    ...fonts.medium,
  },
  connectBtn: {
    height: 32,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  connectBtnText: {
    fontSize: 10.5,
    ...fonts.bold,
    letterSpacing: 0.5,
  },
  visitorItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  visitorAvatarContainer: {
    position: 'relative',
  },
  visitorAvatar: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  visitorPremiumBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  visitorName: {
    fontSize: 12,
    ...fonts.semibold,
    marginTop: 8,
    width: 70,
    textAlign: 'center',
  },
  cardLockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 30, 84, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  cardLockText: {
    color: '#FFFFFF',
    fontSize: 11,
    ...fonts.semibold,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
