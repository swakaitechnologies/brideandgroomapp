/**
 * IncomingCallScreen.tsx
 * Shown when receiving an incoming call.
 */

import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Phone, PhoneOff, Video } from "lucide-react-native";
import LinearGradient from "react-native-linear-gradient";
import { resolvePhotoUrl, acceptCall, rejectCall, getCallStatus } from "../../services/api";
import { palette } from "../../theme/colors";
import { fonts } from "@/src/theme";

const { width } = Dimensions.get("window");

interface Props {
  route: any;
  navigation: any;
}

export default function IncomingCallScreen({ route, navigation }: Props) {
  const { roomId, callerId, callerName, callerPhoto, callType } = route.params;

  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Vibrate on incoming call: pattern [delay, vibrate, sleep, vibrate] with loop=true
    Vibration.vibrate([500, 1000, 500, 1000], true);

    // Ripple pulse animation
    const createPulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1.8,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();

    createPulse(pulse1, 0);
    createPulse(pulse2, 600);
    createPulse(pulse3, 1200);

    // Check if caller hung up/cancelled call
    const statusInterval = setInterval(async () => {
      try {
        const res = await getCallStatus(roomId);
        if (!res.data?.success || ["cancelled", "ended", "rejected"].includes(res.data.status)) {
          Vibration.cancel();
          navigation.goBack();
        }
      } catch (err) {
        Vibration.cancel();
        navigation.goBack();
      }
    }, 3000);

    return () => {
      Vibration.cancel();
      clearInterval(statusInterval);
    };
  }, [pulse1, pulse2, pulse3, roomId, navigation]);

  const handleAccept = async () => {
    Vibration.cancel();
    try {
      await acceptCall({ callId: roomId });
    } catch (err) {
      console.warn("Failed to notify accept call on backend:", err);
    }
    navigation.replace("VideoCall", {
      roomId,
      userId: callerId,
      callerName,
      callerPhoto,
      callType,
    });
  };

  const handleDecline = async () => {
    Vibration.cancel();
    try {
      await rejectCall({ callId: roomId });
    } catch (err) {
      console.warn("Failed to notify reject call on backend:", err);
    }
    navigation.goBack();
  };

  const resolvedPhoto = callerPhoto ? resolvePhotoUrl(callerPhoto) : null;

  return (
    <LinearGradient
      colors={[palette.purple.deep, "#251236", "#150824"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safe}>
        {/* Call type badge */}
        <View style={styles.typeBadge}>
          {callType === "video" ? (
            <Video size={16} color={palette.gold.main} />
          ) : (
            <Phone size={16} color={palette.gold.main} />
          )}
          <Text style={styles.typeText}>
            Incoming {callType === "video" ? "Video" : "Voice"} Call
          </Text>
        </View>

        {/* Avatar with gold pulse ripple */}
        <View style={styles.avatarSection}>
          <Animated.View style={[styles.pulse, styles.pulse3, { transform: [{ scale: pulse3 }] }]} />
          <Animated.View style={[styles.pulse, styles.pulse2, { transform: [{ scale: pulse2 }] }]} />
          <Animated.View style={[styles.pulse, styles.pulse1, { transform: [{ scale: pulse1 }] }]} />
          
          <View style={styles.avatarCircle}>
            {resolvedPhoto ? (
              <Image source={{ uri: resolvedPhoto }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {callerName ? callerName.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.callerName}>{callerName || "Bride & Groom Member"}</Text>
        <Text style={styles.callerSub}>Is calling you</Text>

        {/* Decline / Accept Action Controls */}
        <View style={styles.actionRow}>
          {/* Decline */}
          <View style={styles.actionItem}>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={handleDecline}
              activeOpacity={0.8}
            >
              <PhoneOff size={28} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Decline</Text>
          </View>

          {/* Accept */}
          <View style={styles.actionItem}>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={handleAccept}
              activeOpacity={0.8}
            >
              {callType === "video" ? (
                <Video size={28} color="#FFF" />
              ) : (
                <Phone size={28} color="#FFF" />
              )}
            </TouchableOpacity>
            <Text style={styles.actionLabel}>Accept</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 50,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(212, 175, 55, 0.2)",
    marginTop: 20,
  },
  typeText: {
    fontSize: 14,
    color: "#FFF",
    ...fonts.semibold,
    letterSpacing: 0.5,
  },
  avatarSection: {
    alignItems: "center",
    justifyContent: "center",
    height: 250,
  },
  pulse: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(212, 175, 55, 0.12)",
  },
  pulse1: {
    backgroundColor: "rgba(212, 175, 55, 0.15)",
  },
  pulse2: {
    backgroundColor: "rgba(212, 175, 55, 0.08)",
  },
  pulse3: {
    backgroundColor: "rgba(212, 175, 55, 0.04)",
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#2E1A47",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: palette.gold.main,
    overflow: "hidden",
    elevation: 8,
    shadowColor: palette.gold.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  avatarPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E1A47",
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 54,
    ...fonts.bold,
    color: "#FFF",
  },
  callerName: {
    fontSize: 28,
    ...fonts.bold,
    color: "#FFF",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  callerSub: {
    fontSize: 15,
    color: palette.purple.muted,
    ...fonts.semibold,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: -20,
  },
  actionRow: {
    flexDirection: "row",
    gap: 70,
    alignItems: "center",
    marginBottom: 20,
  },
  actionItem: {
    alignItems: "center",
    gap: 12,
  },
  declineBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: palette.status.error,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.status.error,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  acceptBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#34C759",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#34C759",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  actionLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    ...fonts.semibold,
    letterSpacing: 0.5,
  },
});
