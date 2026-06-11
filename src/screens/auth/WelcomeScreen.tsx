import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
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
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');


const coupleImg = require('../../../assets/images/welcome_couple_ai.png');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    return (
      <View style={styles.slide}>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Full Screen Ambient Gradient */}
      <LinearGradient
        colors={['#2D114C', '#1B092A', '#0F0419']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Atmospheric Blur Glow Spheres */}
      <View style={[styles.glowBlob, styles.glowBlob1]} pointerEvents="none" />
      <View style={[styles.glowBlob, styles.glowBlob2]} pointerEvents="none" />

      {/* Couple Image background for top area */}
      <Animated.Image
        source={coupleImg}
        style={[
          styles.topBackgroundCoupleImage,
          {
            opacity: coupleOpacityAnim,
            transform: [{ scale: coupleScaleAnim }],
          },
        ]}
        resizeMode="cover"
      />

      {/* Full-screen Gradient Overlay to Fade Image to White at bottom */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.95)', '#FFFFFF']}
        style={styles.topImageGradientOverlay}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      {/* Top Spacer to push content down */}
      <View style={styles.topSpacer} />

      {/* Flat Content Panel */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            transform: [{ translateY: cardSlideAnim }],
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
      >
        {/* Interactive Features Carousel */}
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

        {/* Slide Pagination Indicator */}
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

        {/* Main CTA Action Triggers */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.signUpButtonContainer}
            activeOpacity={0.85}
            onPress={handleSignUp}
          >
            <LinearGradient
              colors={[palette.purple.deep, '#34005B']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signUpButton}
            >
              <Text style={styles.signUpButtonText}>GET STARTED</Text>
            </LinearGradient>
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

        {/* Dynamic Legal & Privacy Safeguard Disclosures */}
        <Text style={styles.footerText}>
          By continuing, you agree to our{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('TermsConditions')}>Terms & Conditions</Text> and{' '}
          <Text style={styles.footerLink} onPress={() => navigation.navigate('PrivacyPolicy')}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5FC',
  },
  glowBlob: {
    position: 'absolute',
    borderRadius: 150,
    width: 300,
    height: 300,
    opacity: 0.06,
  },
  glowBlob1: {
    top: -50,
    left: -50,
    backgroundColor: '#3B1E54',
  },
  glowBlob2: {
    bottom: 200,
    right: -100,
    backgroundColor: '#3B1E54',
    opacity: 0.04,
  },
  topSpacer: {
    height: height * 0.46,
  },
  topBackgroundCoupleImage: {
    position: 'absolute',
    top: 0,
    left: -85,
    width: width + 150,
    height: height,
  },
  topImageGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 24,
    alignItems: 'center',
    width: '100%',
  },
  carousel: {
    width: width,
    height: 155,
    flexGrow: 0,
    marginBottom: 15,
  },
  slide: {
    width: width,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    fontSize: 28,
    ...fonts.bold,
    color: palette.purple.deep,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    fontSize: 14,
    color: palette.purple.muted,
    textAlign: 'center',
    lineHeight: 22,
    ...fonts.regular,
    paddingHorizontal: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 14,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
    backgroundColor: palette.purple.deep,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#EDE6F5',
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 12,
  },
  signUpButtonContainer: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: palette.purple.deep,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  signUpButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    ...fonts.bold,
    letterSpacing: 0.5,
  },
  loginButton: {
    width: '100%',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: palette.purple.muted,
    fontSize: 14,
    ...fonts.regular,
  },
  loginButtonLinkText: {
    color: palette.purple.deep,
    ...fonts.bold,
  },
  footerText: {
    fontSize: 9.5,
    color: '#A39BB0',
    textAlign: 'center',
    lineHeight: 14,
    ...fonts.regular,
    marginTop: 16,
    paddingHorizontal: 28,
  },
  footerLink: {
    textDecorationLine: 'underline',
    color: palette.purple.deep,
    ...fonts.semibold,
  },
});
