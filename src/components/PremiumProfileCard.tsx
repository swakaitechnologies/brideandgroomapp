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
import { Heart, Star, Crown, MapPin, Zap, User, Languages, Briefcase, Award, BookOpen, Lock } from 'lucide-react-native';
import { palette } from '../theme/colors';
import { resolvePhotoUrl } from '../services/api';
import { fonts } from "@/src/theme";

interface PremiumProfileCardProps {
  profile: any;
  onPress?: () => void;
  isDark?: boolean;
  style?: any;
  layout?: 'vertical' | 'horizontal';
}

export const PremiumProfileCard: React.FC<PremiumProfileCardProps> = ({
  profile,
  onPress,
  isDark = false,
  style,
  layout = 'vertical'
}) => {
  const navigation = useNavigation<any>();
  
  // Design color tokens (Sleek Dark Matrimony Luxury Style)
  const cardBg = isDark ? '#150E22' : '#FFFFFF';
  const textColor = isDark ? '#F3EAF4' : '#2D1F3F';
  const mutedText = isDark ? '#BCA3CD' : '#7D6B8F';
  const premiumGold = '#D4AF37'; // Luxury Gold
  const deepPurple = '#3B1E54'; // Royal Violet

  const getPhotoUrl = () => {
    const mainPhoto = profile.photos?.find((p: any) => p.isMain === true || p.isMain === 1 || p.isMain === '1')?.url || 
                      profile.photos?.[0]?.url || 
                      `https://api.dicebear.com/7.x/avataaars/png?seed=${profile.firstName || profile.id || 'default'}`;
    return resolvePhotoUrl(mainPhoto);
  };

  const computeAge = (dob: string | null | undefined): number | null => {
    if (!dob) return null;
    const match = dob.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return null;
    const year = parseInt(match[1]);
    const month = parseInt(match[2]) - 1;
    const day = parseInt(match[3]);
    
    const birthDate = new Date(year, month, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const displayAge = profile.age || computeAge(profile.dob) || 'N/A';
  const displayName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
  const locationText = [profile.city, profile.state].filter(Boolean).join(', ') || '—';

  const isPhotoLocked = profile.photosLocked && (profile.privacySettings?.photoVisibility === 'Verified' || profile.privacySettings?.photoVisibility === 'Selected');

  const isHorizontal = layout === 'horizontal';
  const cardStyle = isHorizontal ? styles.cardHorizontal : styles.cardVertical;
  const imageContainerStyle = isHorizontal ? styles.imageContainerHorizontal : styles.imageContainerVertical;
  const imageStyle = isHorizontal ? styles.imageHorizontal : styles.imageVertical;
  const connectBtnStyle = isHorizontal ? styles.connectBtnHorizontal : styles.connectBtnVertical;

  return (
    <TouchableOpacity 
      style={[
        cardStyle, 
        { backgroundColor: cardBg, borderColor: premiumGold },
        style
      ]} 
      onPress={onPress}
      activeOpacity={0.95}
    >
      {/* Top Section: Photo Container */}
      <View style={imageContainerStyle}>
        <Image
          source={{ uri: getPhotoUrl() }}
          style={imageStyle}
          blurRadius={isPhotoLocked ? (Platform.OS === 'ios' ? 15 : 8) : undefined}
        />
        {isPhotoLocked && (
          <View style={styles.cardLockOverlay}>
            <Lock size={16} color={premiumGold} />
            <Text style={styles.cardLockText}>
              {profile.privacySettings?.photoVisibility === 'Verified' ? 'Premium Only' : 'Liked Only'}
            </Text>
          </View>
        )}
        
        {/* Subtle shadow overlay at bottom of photo (vertical only) */}
        {!isHorizontal && <View style={styles.overlay} />}

        {/* Premium Badge Floating on top-left */}
        <View style={[styles.premiumTag, { backgroundColor: premiumGold }]}>
          <Crown size={10} color={deepPurple} fill={deepPurple} />
          <Text style={styles.premiumTagText}>PREMIUM PICKS</Text>
        </View>

        {/* Floating Star on top-right */}
        <View style={styles.starBadge}>
          <Star size={11} color={premiumGold} fill={premiumGold} />
        </View>
      </View>

      {/* Bottom Section: Content details */}
      <View style={styles.content}>
        {/* Name and Age Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.nameText, { color: textColor }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.ageText, { color: premiumGold }]}>
            {displayAge !== 'N/A' ? `${displayAge} yrs` : ''}
          </Text>
        </View>

        {/* Info Grid (Badges / Pills layout in a 2-column grid) */}
        <View style={styles.pillsContainer}>
          <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(212,175,55,0.08)' : '#F9F6FC' }]}>
            <User size={10} color={isDark ? premiumGold : deepPurple} />
            <Text style={[styles.pillText, { color: textColor }]} numberOfLines={1}>
              {profile.height || '—'}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(212,175,55,0.08)' : '#F9F6FC' }]}>
            <Languages size={10} color={isDark ? premiumGold : deepPurple} />
            <Text style={[styles.pillText, { color: textColor }]} numberOfLines={1}>
              {profile.motherTongue || profile.language || '—'}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(212,175,55,0.08)' : '#F9F6FC' }]}>
            <Award size={10} color={isDark ? premiumGold : deepPurple} />
            <Text style={[styles.pillText, { color: textColor }]} numberOfLines={1}>
              {profile.religion || '—'}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(212,175,55,0.08)' : '#F9F6FC' }]}>
            <BookOpen size={10} color={isDark ? premiumGold : deepPurple} />
            <Text style={[styles.pillText, { color: textColor }]} numberOfLines={1}>
              {profile.caste || '—'}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(212,175,55,0.08)' : '#F9F6FC' }]}>
            <Briefcase size={10} color={isDark ? premiumGold : deepPurple} />
            <Text style={[styles.pillText, { color: textColor }]} numberOfLines={1}>
              {profile.profession || '—'}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: isDark ? 'rgba(212,175,55,0.08)' : '#F9F6FC' }]}>
            <MapPin size={10} color={isDark ? premiumGold : deepPurple} />
            <Text style={[styles.pillText, { color: textColor }]} numberOfLines={1}>
              {locationText}
            </Text>
          </View>
        </View>

        {/* Premium View CTA Button */}
        <TouchableOpacity 
          style={[connectBtnStyle, { backgroundColor: deepPurple }]}
          onPress={(e) => {
            e.stopPropagation();
            if (onPress) {
              onPress();
            } else {
              navigation.navigate("ProfileDetail", { profile });
            }
          }}
        >
          <Text style={[styles.connectBtnText, { color: premiumGold }]}>VIEW PROFILE</Text>
          <Zap size={11} color={premiumGold} fill={premiumGold} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardHorizontal: {
    flexDirection: 'row',
    width: 325, 
    height: 160,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  cardVertical: {
    flexDirection: 'column',
    width: 220,
    height: 310,
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  imageContainerHorizontal: {
    position: 'relative',
    width: 125,
    height: '100%',
  },
  imageContainerVertical: {
    position: 'relative',
    width: '100%',
    height: 140,
  },
  imageHorizontal: {
    width: '100%',
    height: '100%',
  },
  imageVertical: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)', 
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
    fontSize: 7,
    ...fonts.bold,
    color: '#3B1E54',
    letterSpacing: 0.5,
  },
  starBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 30, 84, 0.85)', 
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
    marginRight: 4,
  },
  ageText: {
    fontSize: 11,
    ...fonts.bold,
  },
  pillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 4,
    columnGap: 4,
    marginVertical: 4,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    width: '48.5%',
  },
  pillText: {
    fontSize: 9,
    ...fonts.semibold,
    flex: 1,
  },
  connectBtnHorizontal: {
    height: 32,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  connectBtnVertical: {
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
    letterSpacing: 0.6,
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
