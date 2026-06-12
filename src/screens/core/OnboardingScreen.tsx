import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  Platform,
  View,
  Text,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Heart, ShieldCheck, Crown, ArrowRight, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from "@/src/theme";
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: Heart,
    title: 'Find Your\nPerfect Match',
    subtitle: 'Browse thousands of verified profiles tailored to your preferences. Our smart algorithm learns what you love.',
    accent: '#3B1E54',
    image: require('../../../assets/images/onboarding_match.png'),
  },
  {
    id: '2',
    icon: ShieldCheck,
    title: 'Verified &\nTrustworthy',
    subtitle: 'Every profile undergoes rigorous KYC verification. Connect with genuine people who share your values.',
    accent: '#3B1E54',
    image: require('../../../assets/images/onboarding_match.png'),
  },
  {
    id: '3',
    icon: Crown,
    title: 'Premium\nExperience',
    subtitle: 'Unlock direct contact reveals, unlimited messaging, and priority matching with our premium plans.',
    accent: '#3B1E54',
    image: require('../../../assets/images/onboarding_match.png'),
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Optimize Animated.event to prevent recreation on every render pass
  const onScrollEvent = useRef(
    Animated.event(
      [{ nativeEvent: { contentOffset: { x: scrollX } } }],
      { useNativeDriver: false }
    )
  ).current;

  const finishOnboarding = useCallback(async () => {
    await AsyncStorage.setItem('onboardingDone', 'true');
    navigation.replace('Welcome');
  }, [navigation]);

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      finishOnboarding();
    }
  }, [currentIndex, finishOnboarding]);

  const handleSkip = useCallback(() => {
    finishOnboarding();
  }, [finishOnboarding]);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderSlide = useCallback(({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

    // Content text parallax slide (slides in opposite direction)
    const contentTranslateX = scrollX.interpolate({
      inputRange,
      outputRange: [width * 0.5, 0, -width * 0.5],
      extrapolate: 'clamp',
    });

    // Content text fade transition
    const contentOpacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View 
          style={[
            styles.slideContent,
            {
              opacity: contentOpacity,
              transform: [{ translateX: contentTranslateX }]
            }
          ]}
        >
          {/* Title */}
          <Text style={styles.slideTitle}>{item.title}</Text>

          {/* Subtitle */}
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        </Animated.View>
      </View>
    );
  }, [scrollX]);

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Sticky background image */}
      <Image 
        source={require('../../../assets/images/onboarding_match.png')} 
        style={styles.backgroundImage} 
        resizeMode="cover" 
      />

      {/* Premium ambient light gradient overlay fading background image to clean white/light purple */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.95)', '#FFFFFF']}
        locations={[0, 0.52, 0.85, 1.0]}
        style={styles.gradientOverlay}
      >
        <Animated.FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onScroll={onScrollEvent}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        />
      </LinearGradient>

      {/* Skip button at top right corner */}
      {!isLastSlide && (
        <SafeAreaView style={styles.skipContainer} edges={['top']}>
          <TouchableOpacity style={styles.topSkipBtn} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </SafeAreaView>
      )}

      {/* Bottom controls */}
      <SafeAreaView style={styles.controls} edges={['bottom']}>
        {/* Dot indicators on bottom left */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotWidth,
                    opacity: dotOpacity,
                    backgroundColor: currentIndex === i ? '#3B1E54' : '#EDE6F5',
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Next / Get Started button on bottom right */}
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          {isLastSlide ? (
            <>
              <Text style={styles.getStartedBtnText}>Get Started</Text>
              <ArrowRight size={14} color="#D4AF37" />
            </>
          ) : (
            <>
              <Text style={styles.nextBtnText}>Next</Text>
              <ChevronRight size={14} color="#D4AF37" />
            </>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F5FC',
  },
  slide: {
    width,
    height,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: -75,
    width: width + 110,
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 35,
    marginBottom: 155, // Safe margin for dots & controls overlay
  },

  slideTitle: {
    fontSize: 34,
    ...fonts.bold,
    color: '#3B1E54',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.5,
    marginBottom: 16,
  },
  slideSubtitle: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    ...fonts.medium,
    maxWidth: 300,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: Platform.OS === 'android' ? 30 : 10,
  },
  skipContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  topSkipBtn: {
    backgroundColor: 'rgba(15, 4, 25, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 10,
    marginRight: 20,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 13,
    ...fonts.bold,
    letterSpacing: 0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 130,
    height: 48,
    borderRadius: 24,
    gap: 6,
    backgroundColor: '#3B1E54',
    ...Platform.select({
      ios: { shadowColor: '#3B1E54', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  nextBtnText: {
    fontSize: 13,
    ...fonts.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  getStartedBtnText: {
    fontSize: 13,
    ...fonts.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
