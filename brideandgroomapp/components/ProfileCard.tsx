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
import { Heart, MessageCircle, Star, Crown, MapPin, Zap, User, Languages, Briefcase } from 'lucide-react-native';
import { palette } from '@/src/theme/colors';

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
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const textColor = isDark ? '#F0F0F0' : '#1A1A1A';
  const mutedText = isDark ? '#A0A0A0' : '#8E8E93';
  const accentColor = palette.gold.main;
  const deepPurple = '#3B1E54';

  const isPremium = profile.accountType === 'Premium' || profile.id?.startsWith('d'); // dummy data check

  if (type === 'visitor') {
    return (
      <TouchableOpacity style={[styles.visitorItem, style]} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.visitorAvatarContainer}>
          <Image
            source={{ uri: profile.photos?.[0]?.url || `https://api.dicebear.com/7.x/avataaars/png?seed=${profile.id}` }}
            style={styles.visitorAvatar}
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
          source={{ uri: profile.photos?.[0]?.url || `https://api.dicebear.com/7.x/avataaars/png?seed=${profile.id}` }}
          style={type === 'premium' ? styles.premiumImage : styles.gridImage}
        />
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
            {profile.firstName}, {profile.age}
          </Text>
          {isPremium && <Star size={14} color={accentColor} fill={accentColor} />}
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <User size={12} color={mutedText} />
            <Text style={[styles.detailText, { color: mutedText }]}>{profile.height || "5'5\""}</Text>
          </View>
          <View style={styles.detailItem}>
            <Languages size={12} color={mutedText} />
            <Text style={[styles.detailText, { color: mutedText }]}>{profile.language || 'Hindi'}</Text>
          </View>
          <View style={styles.detailItem}>
            <Briefcase size={12} color={mutedText} />
            <Text style={[styles.detailText, { color: mutedText }]}>{profile.caste || 'Brahmin'}</Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin size={12} color={mutedText} />
            <Text style={[styles.detailText, { color: mutedText }]} numberOfLines={1}>
              {profile.city || 'Mumbai'}, {profile.state || 'MH'}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.connectBtn, { backgroundColor: deepPurple }]}
          onPress={(e) => {
            e.stopPropagation();
            // Handle connect logic
          }}
        >
          <Zap size={14} color={accentColor} />
          <Text style={[styles.connectBtnText, { color: accentColor }]}>CONNECT NOW</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  premiumCard: {
    width: width * 0.85,
    height: 360,
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
    width: (width - 50) / 2,
    height: 320,
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
    width: '100%',
  },
  premiumImage: {
    width: '100%',
    height: 180,
  },
  gridImage: {
    width: '100%',
    height: 140,
  },
  premiumTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  premiumTagText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#3B1E54',
  },
  favoriteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
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
    marginBottom: 6,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: '45%',
  },
  detailText: {
    fontSize: 10,
    fontWeight: '500',
  },
  connectBtn: {
    height: 38,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  connectBtnText: {
    fontSize: 11,
    fontWeight: '800',
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
  visitorStatus: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  visitorName: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    width: 70,
    textAlign: 'center',
  },
});
