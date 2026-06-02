import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  Animated,
  Platform,
  View,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Heart, ShieldCheck, Crown, ArrowRight, ChevronRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from "@/src/theme";

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: Heart,
    title: 'Find Your\nPerfect Match',
    subtitle: 'Browse thousands of verified profiles tailored to your preferences. Our smart algorithm learns what you love.',
    accent: '#3B1E54',
  },
  {
    id: '2',
    icon: ShieldCheck,
    title: 'Verified &\nTrustworthy',
    subtitle: 'Every profile undergoes rigorous KYC verification. Connect with genuine people who share your values.',
    accent: '#3B1E54',
  },
  {
    id: '3',
    icon: Crown,
    title: 'Premium\nExperience',
    subtitle: 'Unlock direct contact reveals, unlimited messaging, and priority matching with our premium plans.',
    accent: '#3B1E54',
  },
];

export default function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    finishOnboarding();
  };

  const finishOnboarding = async () => {
    await AsyncStorage.setItem('onboardingDone', 'true');
    navigation.replace('Welcome');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderSlide = ({ item, index }: { item: typeof SLIDES[0]; index: number }) => {
    const IconComponent = item.icon;
    return (
      <View style={styles.slide}>
        {/* Background decoration */}
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />

        <View style={styles.slideContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <IconComponent size={48} color="#3B1E54" />
          </View>

          {/* Title */}
          <Text style={styles.slideTitle}>{item.title}</Text>

          {/* Subtitle */}
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
    );
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      {/* Bottom controls */}
      <SafeAreaView style={styles.controls} edges={['bottom']}>
        {/* Skip button */}
        {!isLastSlide && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}

        {/* Dot indicators */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 28, 8],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
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
                    backgroundColor: currentIndex === i ? '#3B1E54' : '#E0D6EC',
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Next / Get Started button */}
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          {isLastSlide ? (
            <>
              <Text style={styles.nextBtnText}>Get Started</Text>
              <ArrowRight size={20} color="#D4AF37" />
            </>
          ) : (
            <>
              <Text style={styles.nextBtnText}>Next</Text>
              <ChevronRight size={20} color="#D4AF37" />
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
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  bgCircle1: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: 'rgba(59, 30, 84, 0.03)',
    top: -width * 0.4,
    right: -width * 0.4,
  },
  bgCircle2: {
    position: 'absolute',
    width: width,
    height: width,
    borderRadius: width * 0.5,
    backgroundColor: 'rgba(59, 30, 84, 0.02)',
    bottom: -width * 0.2,
    left: -width * 0.3,
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 120,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(59, 30, 84, 0.06)',
  },
  slideTitle: {
    fontSize: 38,
    ...fonts.bold,
    color: '#3B1E54',
    textAlign: 'center',
    lineHeight: 46,
    letterSpacing: -1,
    marginBottom: 20,
  },
  slideSubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    ...fonts.medium,
    maxWidth: 300,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 30,
    paddingBottom: Platform.OS === 'android' ? 30 : 10,
    alignItems: 'center',
  },
  skipBtn: {
    position: 'absolute',
    top: -60,
    right: 30,
  },
  skipText: {
    color: '#3B1E54',
    fontSize: 15,
    ...fonts.semibold,
    opacity: 0.7,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 30,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 58,
    borderRadius: 29,
    gap: 10,
    backgroundColor: '#3B1E54',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  nextBtnText: {
    fontSize: 17,
    ...fonts.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
