import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  Easing,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { palette } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from "@/src/theme";
import { Heart, ShieldCheck, Lock } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

const logoImg = require('../../../assets/images/logo.png');
const coupleImg = require('../../../assets/images/welcome_couple.png');

interface SlideItem {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<any>;
}

const slides: SlideItem[] = [
  {
    id: '1',
    title: 'Find Your Perfect Match',
    subtitle: 'Discover genuine, highly compatible profiles tailored to your values and lifestyle.',
    icon: Heart,
  },
  {
    id: '2',
    title: '100% Manually Verified',
    subtitle: 'Every profile is manually checked and verified to ensure a safe and secure community.',
    icon: ShieldCheck,
  },
  {
    id: '3',
    title: 'Complete Privacy Control',
    subtitle: 'You are in control. Decide exactly who can view your photo, details, and contact info.',
    icon: Lock,
  },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);

  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<any>(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoSlideAnim = useRef(new Animated.Value(-40)).current;
  const coupleScaleAnim = useRef(new Animated.Value(0.9)).current;
  const coupleOpacityAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(150)).current;

  const startAutoPlay = () => {
    stopAutoPlay();
    timerRef.current = setInterval(() => {
      const nextIndex = (activeIndex + 1) % slides.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, 4500);
  };

  const stopAutoPlay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoSlideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.timing(coupleOpacityAnim, {
            toValue: 1,
            duration: 350,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(coupleScaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(cardSlideAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    startAutoPlay();

    return () => stopAutoPlay();
  }, [activeIndex]);

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const onScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    if (slideSize <= 0) return;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(index);
    if (roundIndex !== activeIndex) {
      setActiveIndex(roundIndex);
    }
  };

  const onScrollBeginDrag = () => {
    stopAutoPlay();
  };

  const onScrollEndDrag = () => {
    startAutoPlay();
  };

  const renderSlideItem = ({ item }: { item: SlideItem }) => {
    const IconComponent = item.icon;
    return (
      <View style={styles.slide}>
        <View style={styles.slideIconContainer}>
          <IconComponent size={22} color={palette.gold.main} />
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Top Section (White background with Logo & Illustration) */}
      <Animated.View style={[styles.topSection, { opacity: fadeAnim, paddingTop: Math.max(insets.top, 20) }]}>
        {/* Branding/Logo */}
        <Animated.View style={[styles.logoContainer, { transform: [{ translateY: logoSlideAnim }] }]}>
          <Image
            source={logoImg}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Illustration */}
        <Animated.View
          style={[
            styles.imageContainer,
            {
              opacity: coupleOpacityAnim,
              transform: [{ scale: coupleScaleAnim }],
            },
          ]}
        >
          <Image
            source={coupleImg}
            style={styles.coupleImage}
            resizeMode="contain"
          />
        </Animated.View>
      </Animated.View>

      {/* Bottom Section (Rounded Card) */}
      <Animated.View
        style={[
          styles.bottomCardContainer,
          {
            transform: [{ translateY: cardSlideAnim }],
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        {/* Swipeable Carousel */}
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlideItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={onScrollBeginDrag}
          onScrollEndDrag={onScrollEndDrag}
          style={styles.carousel}
          keyExtractor={(item) => item.id}
        />

        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            );
          })}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.signUpButton}
            activeOpacity={0.85}
            onPress={handleSignUp}
          >
            <Text style={styles.signUpButtonText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            activeOpacity={0.7}
            onPress={handleLogin}
          >
            <Text style={styles.loginButtonText}>
              Already have an account? <Text style={styles.loginButtonLinkText}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Legal Disclaimer */}
        <Text style={styles.footerText}>
          By continuing, you agree to our{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('TermsConditions')}>Terms&Condition</Text> and{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: width * 0.65,
    height: 60,
    marginTop: height * 0.015,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.purple.light,
    borderWidth: 1,
    borderColor: palette.purple.border,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  trustBadgeText: {
    fontSize: 11,
    color: palette.purple.deep,
    ...fonts.semibold,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    maxHeight: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  coupleImage: {
    width: width * 0.85,
    height: '100%',
  },
  bottomCardContainer: {
    backgroundColor: palette.purple.deep,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 28,
    alignItems: 'center',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  carousel: {
    width: width,
    height: 155,
    flexGrow: 0,
    marginBottom: 12,
  },
  slide: {
    width: width,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  slideIcon: {
    fontSize: 22,
  },
  slideTitle: {
    fontSize: 22,
    ...fonts.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 28,
  },
  slideSubtitle: {
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    lineHeight: 19,
    ...fonts.regular,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 16,
    backgroundColor: palette.gold.main,
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  signUpButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.gold.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: palette.gold.main,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  signUpButtonText: {
    color: palette.purple.deep,
    fontSize: 16,
    ...fonts.bold,
    letterSpacing: 0.3,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  loginButtonText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 14,
    ...fonts.regular,
  },
  loginButtonLinkText: {
    color: palette.gold.main,
    ...fonts.bold,
  },
  footerText: {
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    lineHeight: 15,
    ...fonts.regular,
    marginTop: 14,
    paddingHorizontal: 24,
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
});
