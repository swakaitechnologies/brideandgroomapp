import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react-native";
import { palette } from "../theme/colors";
import { fonts } from "@/src/theme";

const OfflineOverlay = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [showRestored, setShowRestored] = useState(false);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(100)).current; // For bottom toast
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable !== false);
      
      if (online && !isConnected) {
        // Just transitioned from offline to online
        triggerRestoredToast();
      }
      setIsConnected(online);
    });

    // Subtle pulse animation loop for offline status icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  const triggerRestoredToast = () => {
    setShowRestored(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: 100,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowRestored(false);
        });
      }, 3000);
    });
  };

  const handleCheckConnection = () => {
    setIsChecking(true);
    setTimeout(() => {
      NetInfo.fetch().then((state) => {
        const online = !!(state.isConnected && state.isInternetReachable !== false);
        setIsConnected(online);
        setIsChecking(false);
        
        if (online) {
          triggerRestoredToast();
        }
      });
    }, 1200);
  };

  return (
    <>
      <Modal
        visible={!isConnected}
        transparent={false}
        animationType="fade"
        statusBarTranslucent
      >
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        <View style={styles.container}>
          {/* Main Minimal Container */}
          <View style={styles.content}>
            {/* Pulsing Icon Wrapper */}
            <View style={styles.iconContainer}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    opacity: pulseAnim.interpolate({
                      inputRange: [1, 1.08],
                      outputRange: [0.15, 0.02],
                    }),
                  },
                ]}
              />
              <View style={styles.iconWrapper}>
                <WifiOff size={32} color={palette.purple.deep} />
              </View>
            </View>

            {/* Typography */}
            <Text style={styles.title}>Connection Lost</Text>
            <Text style={styles.description}>
              Your network is not connected. Please check your Wi-Fi or mobile data to continue using the application.
            </Text>

            {/* Action Button */}
            <TouchableOpacity
              onPress={handleCheckConnection}
              disabled={isChecking}
              activeOpacity={0.8}
              style={styles.button}
            >
              {isChecking ? (
                <ActivityIndicator color={palette.neutral.white} size="small" />
              ) : (
                <View style={styles.buttonContent}>
                  <RefreshCw size={14} color={palette.neutral.white} style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>TRY RECONNECTING</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Floating Restored Toast */}
      {showRestored && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              transform: [{ translateY: slideAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.toast}>
            <View style={styles.toastIconWrapper}>
              <CheckCircle2 size={18} color={palette.purple.deep} />
            </View>
            <View style={styles.toastTextContainer}>
              <Text style={styles.toastTitle}>Connection Restored</Text>
              <Text style={styles.toastDesc}>You are back online. Syncing data...</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    backgroundColor: palette.purple.light,
  },
  content: {
    width: "100%",
    alignItems: "center",
    paddingVertical: 24,
  },
  iconContainer: {
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  pulseRing: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: palette.purple.muted,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: palette.purple.light,
    borderWidth: 1.5,
    borderColor: palette.purple.border,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    ...fonts.semibold,
    color: palette.purple.deep,
    marginBottom: 12,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: palette.purple.muted,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  button: {
    width: "100%",
    height: 52,
    backgroundColor: palette.purple.deep,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: palette.neutral.white,
    fontSize: 12,
    ...fonts.semibold,
    letterSpacing: 1.2,
  },
  toastContainer: {
    position: "absolute",
    bottom: 40,
    left: 24,
    right: 24,
    zIndex: 9999,
  },
  toast: {
    backgroundColor: palette.neutral.white,
    borderWidth: 1,
    borderColor: palette.purple.border,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: palette.purple.deep,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  toastIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: palette.purple.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    fontSize: 13,
    ...fonts.semibold,
    color: palette.purple.deep,
  },
  toastDesc: {
    fontSize: 11,
    color: palette.purple.muted,
    marginTop: 2,
  },
});

export default OfflineOverlay;
