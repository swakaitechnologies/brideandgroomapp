import React, { useState, useEffect, useLayoutEffect } from 'react';
import { 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions, 
  FlatList,
  Platform,
  Linking,
  Image,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, View } from '@/components/Themed';
import { 
  Crown, Check, Menu, Bell, ShieldCheck, 
  Star, Zap, Award, HelpCircle, Phone, 
  Mail, MessageCircle, ChevronRight, Timer,
  Gem, Heart, Shield, Sparkles, Headphones
} from 'lucide-react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/src/store';
import { palette } from '@/src/theme/colors';
import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { openDrawer } from '@/src/store/uiSlice';

const { width } = Dimensions.get('window');

const PREMIUM_PLANS = [
  {
    id: '1',
    name: 'Gold',
    duration: '3 Months',
    price: '₹2,499',
    oldPrice: '₹4,999',
    discount: '50% OFF',
    features: ['Contact 15 Members', 'Unlimited Interests', 'Priority Support', 'Profile Highlighting'],
    accent: '#3B1E54'
  },
  {
    id: '2',
    name: 'Diamond',
    duration: '6 Months',
    price: '₹4,499',
    oldPrice: '₹8,999',
    discount: '50% OFF',
    popular: true,
    accent: '#D4AF37'
  },
  {
    id: '3',
    name: 'Platinum',
    duration: '1 Year',
    price: '₹7,999',
    oldPrice: '₹15,999',
    discount: '50% OFF',
    features: ['Contact 100 Members', 'Unlimited Interests', 'VIP Badging', 'Top Search Result'],
    accent: '#B4B4B4'
  }
];

const VIP_PLANS = [
  {
    id: 'vip1',
    name: 'Royal VIP',
    duration: '3 Months',
    price: '₹14,999',
    features: ['Dedicated Manager', 'Handpicked Matches', 'Full Confidentiality', 'Background Verification'],
    accent: '#1A1A1A'
  },
  {
    id: 'vip2',
    name: 'Elite VIP',
    duration: '6 Months',
    price: '₹24,999',
    popular: true,
    features: ['Senior Manager', 'Global Search', 'Concierge Service', 'Legal Assist'],
    accent: '#3B1E54'
  }
];

export default function PremiumScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { mode } = useSelector((state: RootState) => state.theme);
  const isDark = mode === 'dark';
  const [activeType, setActiveType] = useState<'Premium' | 'VIP'>('Premium');

  const themeBg = isDark ? '#0A0A0A' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const mutedText = isDark ? '#AAAAAA' : '#666666';
  const accentGold = palette.gold.main;
  const deepPurple = '#3B1E54';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerTransparent: true,
      headerLeft: () => (
        <View style={styles.headerLeftContainer}>
          <TouchableOpacity 
            style={styles.headerIconCircle} 
            onPress={() => dispatch(openDrawer())}
          >
            <Menu size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitleText, { color: textColor }]}>Premium Plans</Text>
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity 
          style={styles.headerIconCircle} 
          onPress={() => router.push('/(tabs)/inbox')}
        >
          <Bell size={24} color={textColor} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, textColor]);

  const renderPlanCard = ({ item }: { item: any }) => (
    <View style={[styles.planCard, { borderColor: item.accent, backgroundColor: 'transparent' }]}>
      {item.popular && (
        <View style={[styles.popularBadge, { backgroundColor: item.accent }]}>
          <Text style={styles.popularText}>BEST VALUE</Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: item.accent }]}>{item.name}</Text>
        <Text style={[styles.cardDuration, { color: mutedText }]}>{item.duration}</Text>
      </View>
      <View style={styles.priceContainer}>
        <Text style={[styles.priceTag, { color: textColor }]}>{item.price}</Text>
        <View style={styles.discountRow}>
          {item.oldPrice && <Text style={[styles.oldPriceTag, { color: mutedText }]}>{item.oldPrice}</Text>}
          {item.discount && <Text style={styles.discountLabel}>{item.discount}</Text>}
        </View>
      </View>
      <View style={styles.featureList}>
        {(item.features || ['Unlimited Interests', 'Priority Support', 'View Profiles']).map((f: string, i: number) => (
          <View key={i} style={styles.featureItem}>
            <Check size={16} color={item.accent} />
            <Text style={[styles.featureText, { color: textColor }]}>{f}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={[styles.cardButton, { backgroundColor: item.accent }]}>
        <Text style={styles.cardButtonText}>Choose Plan</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: themeBg }}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Toggle Section */}
        <View style={styles.toggleWrapper}>
          <View style={[styles.toggleContainer, { borderColor: isDark ? '#333' : '#EEE' }]}>
            <TouchableOpacity 
              onPress={() => setActiveType('Premium')}
              style={[styles.toggleTab, activeType === 'Premium' && { backgroundColor: deepPurple }]}
            >
              <Text style={[styles.toggleTabText, activeType === 'Premium' ? { color: '#FFF' } : { color: mutedText }]}>Premium</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveType('VIP')}
              style={[styles.toggleTab, activeType === 'VIP' && { backgroundColor: deepPurple }]}
            >
              <Text style={[styles.toggleTabText, activeType === 'VIP' ? { color: '#FFF' } : { color: mutedText }]}>VIP</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Attractive Image Banner */}
        <TouchableOpacity style={styles.attractiveBanner}>
          <Image 
            source={require('@/assets/images/last-minute.png')} 
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerContent}>
            <View style={styles.bannerBadge}>
              <Zap size={10} color="#3B1E54" fill="#3B1E54" />
              <Text style={styles.bannerBadgeText}>FLASH OFFER</Text>
            </View>
            <Text style={styles.bannerMainText}>50% Instant Discount</Text>
            <Text style={[styles.bannerSubText, { color: mutedText }]}>Limited time last-minute deal for you!</Text>
          </View>
          <ChevronRight size={20} color={accentGold} style={{ marginRight: 15 }} />
        </TouchableOpacity>

        {/* Carousel */}
        <FlatList
          data={activeType === 'Premium' ? PREMIUM_PLANS : VIP_PLANS}
          renderItem={renderPlanCard}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listPadding}
          snapToInterval={width * 0.75 + 20}
          decelerationRate="fast"
        />

        {/* Trust Points */}
        <View style={styles.trustGrid}>
          <View style={styles.trustItem}>
            <ShieldCheck size={24} color={deepPurple} />
            <Text style={[styles.trustLabel, { color: textColor }]}>Safe & Secure</Text>
          </View>
          <View style={styles.trustItem}>
            <Award size={24} color={deepPurple} />
            <Text style={[styles.trustLabel, { color: textColor }]}>Verified Profiles</Text>
          </View>
          <View style={styles.trustItem}>
            <MessageCircle size={24} color={deepPurple} />
            <Text style={[styles.trustLabel, { color: textColor }]}>24/7 Support</Text>
          </View>
        </View>

        {/* Guarantee */}
        <View style={styles.guaranteeContainer}>
          <Image 
            source={require('@/assets/images/money-back.png')} 
            style={styles.guaranteeImage} 
            resizeMode="contain"
          />
          <View style={styles.guaranteeContent}>
            <Text style={[styles.guaranteeTitle, { color: textColor }]}>30-Day Money Back Guarantee</Text>
            <Text style={[styles.guaranteeDesc, { color: mutedText }]}>No questions asked refund if you're not satisfied with our service.</Text>
          </View>
        </View>

        {/* Redesigned Support Center */}
        <View style={styles.supportCenter}>
          <View style={styles.supportHeader}>
            <Headphones size={24} color={deepPurple} />
            <View style={styles.supportHeaderText}>
              <Text style={[styles.supportTitle, { color: textColor }]}>Need Assistance?</Text>
              <Text style={[styles.supportSubtitle, { color: mutedText }]}>Our experts are here to help you find your match.</Text>
            </View>
          </View>

          <View style={styles.supportOptionsList}>
            <TouchableOpacity 
              style={[styles.supportOptionCard, { borderColor: isDark ? '#333' : '#F0F0F0' }]}
              onPress={() => Linking.openURL('tel:+911234567890')}
            >
              <View style={[styles.supportIconBg, { backgroundColor: 'rgba(59, 30, 84, 0.1)' }]}>
                <Phone size={20} color={deepPurple} />
              </View>
              <View style={styles.supportOptionText}>
                <Text style={[styles.supportOptionLabel, { color: textColor }]}>Call Support</Text>
                <Text style={[styles.supportOptionSub, { color: mutedText }]}>Available 24/7 for premium users</Text>
              </View>
              <ChevronRight size={18} color={mutedText} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.supportOptionCard, { borderColor: isDark ? '#333' : '#F0F0F0' }]}
              onPress={() => Linking.openURL('mailto:support@punarmilan.com')}
            >
              <View style={[styles.supportIconBg, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
                <Mail size={20} color={accentGold} />
              </View>
              <View style={styles.supportOptionText}>
                <Text style={[styles.supportOptionLabel, { color: textColor }]}>Email Us</Text>
                <Text style={[styles.supportOptionSub, { color: mutedText }]}>Response time: Less than 24 hours</Text>
              </View>
              <ChevronRight size={18} color={mutedText} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.supportOptionCard, { borderColor: isDark ? '#333' : '#F0F0F0' }]}
            >
              <View style={[styles.supportIconBg, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <HelpCircle size={20} color="#4CAF50" />
              </View>
              <View style={styles.supportOptionText}>
                <Text style={[styles.supportOptionLabel, { color: textColor }]}>Browse FAQs</Text>
                <Text style={[styles.supportOptionSub, { color: mutedText }]}>Common questions & quick answers</Text>
              </View>
              <ChevronRight size={18} color={mutedText} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 100,
    paddingBottom: 40,
  },
  headerLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 5,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 5,
  },
  toggleWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 30,
    padding: 4,
  },
  toggleTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 25,
    alignItems: 'center',
  },
  toggleTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  attractiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 30,
  },
  bannerImage: {
    width: 80,
    height: 80,
  },
  bannerContent: {
    flex: 1,
    paddingLeft: 15,
    backgroundColor: 'transparent',
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4AF37',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 5,
  },
  bannerBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#3B1E54',
  },
  bannerMainText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#D4AF37',
  },
  bannerSubText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listPadding: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    gap: 20,
  },
  planCard: {
    width: width * 0.75,
    borderWidth: 1.5,
    borderRadius: 25,
    padding: 25,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  popularText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardDuration: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  priceContainer: {
    marginBottom: 25,
  },
  priceTag: {
    fontSize: 36,
    fontWeight: '900',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -2,
  },
  oldPriceTag: {
    fontSize: 16,
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  discountLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4CAF50',
  },
  featureList: {
    gap: 12,
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardButton: {
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  trustGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 40,
    paddingHorizontal: 20,
  },
  trustItem: {
    alignItems: 'center',
    gap: 8,
  },
  trustLabel: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.7,
  },
  guaranteeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    gap: 20,
    marginBottom: 40,
  },
  guaranteeImage: {
    width: 70,
    height: 70,
  },
  guaranteeContent: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  guaranteeDesc: {
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.7,
  },
  supportCenter: {
    paddingHorizontal: 20,
    marginBottom: 40,
    marginTop: 10,
  },
  supportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    marginBottom: 25,
  },
  supportHeaderText: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  supportSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  supportOptionsList: {
    gap: 12,
  },
  supportOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderRadius: 20,
    gap: 15,
  },
  supportIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportOptionText: {
    flex: 1,
  },
  supportOptionLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  supportOptionSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
});
