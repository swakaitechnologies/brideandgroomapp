import React, { useEffect, useRef } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { palette } from '../../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from "@/src/theme";

const { width, height } = Dimensions.get('window');

const logoImg = require('../../../assets/images/logo.png');
const coupleImg = require('../../../assets/images/welcome_couple.png');

const HeartCheckLogo = () => (
  <Svg width={38} height={38} viewBox="0 0 38 38" fill="none">
    <Defs>
      <SvgLinearGradient id="logoHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#FF4D4D" />
        <Stop offset="100%" stopColor={palette.gold.main} />
      </SvgLinearGradient>
    </Defs>
    <Path
      d="M11 26C6.5 22.2 4 17.2 4 12.5C4 7.5 8 3.5 13 3.5C17.2 3.5 20.3 6.8 21.2 9C22.1 6.8 25.2 3.5 29.4 3.5C34.4 3.5 38.4 7.5 38.4 12.5C38.4 15 37.2 18.5 35 21M13.5 17L19.5 23L34.5 8"
      stroke="url(#logoHeartGrad)"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoSlideAnim = useRef(new Animated.Value(-40)).current;
  const coupleScaleAnim = useRef(new Animated.Value(0.9)).current;
  const coupleOpacityAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(120)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(logoSlideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(coupleOpacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(coupleScaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(cardSlideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleSignUp = () => {
    navigation.navigate('Register');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent />

      {/* Top Section (White background) */}
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

      {/* Bottom Section (Slanted card with gradient) */}
      <Animated.View
        style={[
          styles.bottomCardContainer,
          {
            transform: [{ translateY: cardSlideAnim }],
          },
        ]}
      >
        {/* Wave Card Shape */}
        <View style={styles.cardBgWrapper}>
          <Svg width={width} height={height * 0.52} viewBox={`0 0 ${width} 380`} fill="none" preserveAspectRatio="none">
            <Defs>
              <SvgLinearGradient id="purpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={palette.purple.deep} />
                <Stop offset="100%" stopColor="#1C0A2E" />
              </SvgLinearGradient>
            </Defs>
            <Path
              d={`M0 50 C ${width * 0.35} 80, ${width * 0.65} 10, ${width} 40 L${width} 380 L0 380 Z`}
              fill="url(#purpleGrad)"
            />
          </Svg>
        </View>

        {/* Card Contents */}
        <View style={[styles.cardContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Text style={styles.cardTitle}>Find Your Best Partner</Text>

          <Text style={styles.cardSubtitle}>
            Your Information Is Safe With Us.{'\n'}You Can Also Control Who Can View Your Personal Details.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.signUpButton}
              activeOpacity={0.8}
              onPress={handleSignUp}
            >
              <Text style={styles.signUpButtonText}>Sign Up</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.8}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    height: 70,
    marginTop: height * 0.02,
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    maxHeight: height * 0.36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: -10,
  },
  coupleImage: {
    width: width * 0.9,
    height: '100%',
  },
  bottomCardContainer: {
    height: height * 0.48,
    width: '100%',
    position: 'relative',
  },
  cardBgWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 0,
  },
  cardContent: {
    flex: 1,
    zIndex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 55, // Offset for slant height
  },
  cardTitle: {
    fontSize: 32,
    ...fonts.semibold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 22,
    ...fonts.regular,
    marginBottom: 35,
    paddingHorizontal: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    gap: 16,
  },
  signUpButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    ...fonts.semibold,
  },
  loginButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    backgroundColor: palette.gold.main,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  loginButtonText: {
    color: palette.purple.deep,
    fontSize: 16,
    ...fonts.semibold,
  },
});
