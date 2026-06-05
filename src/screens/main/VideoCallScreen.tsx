/**
 * VideoCallScreen.tsx
 * Screen hosting active voice and video call peer connection.
 */

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  SafeAreaView,
  Platform,
} from "react-native";
import {
  PhoneOff,
  Mic,
  MicOff,
  Camera,
  VideoOff,
  RefreshCw,
  User,
} from "lucide-react-native";
import { RTCView } from "react-native-webrtc";
import { useSelector as useAppSelector } from 'react-redux';
import { RootState } from '../../store';
import { useWebRTC } from "../../hooks/useWebRTC";
import { resolvePhotoUrl, cancelCall, endCall as endCallApi } from "../../services/api";
import { secureStorage } from "../../services/secureStorage";
import { palette } from "../../theme/colors";
import { fonts } from "@/src/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

interface Props {
  route: any;
  navigation: any;
}

export default function VideoCallScreen({ route, navigation }: Props) {
  const { roomId, userId, callerName, callerPhoto, callType } = route.params;
  const insets = useSafeAreaInsets();

  const auth = useAppSelector((state: RootState) => state.auth) as any;
  const myUserId = auth?.user?.id || userId;

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const storedToken = await secureStorage.getItem('token');
        setToken(storedToken);
      } catch (err) {
        console.warn("Failed to retrieve token for WebRTC connection:", err);
      }
    };
    fetchToken();
  }, []);

  const {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isVideoOff,
    isCallActive,
    peerMuted,
    peerVideoOff,
    startCall,
    endCall,
    toggleMute,
    toggleVideo,
    switchCamera,
  } = useWebRTC({ roomId, userId: myUserId, callType, token });

  const [duration, setDuration] = useState(0);
  const isCallEndedRef = useRef(false);

  // Active call duration timer
  useEffect(() => {
    let interval: any = null;
    if (isConnected) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  // Handle call ending (either remote peer hung up or connection closed)
  useEffect(() => {
    if (!isCallActive && !isCallEndedRef.current) {
      isCallEndedRef.current = true;
      // Navigate back after a short delay to display "Call Ended"
      const timer = setTimeout(() => {
        navigation.goBack();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isCallActive, navigation]);

  const handleHangUp = async () => {
    try {
      if (isConnected) {
        await endCallApi({ callId: roomId });
      } else {
        await cancelCall({ callId: roomId });
      }
    } catch (err) {
      console.warn("Failed to notify backend of call termination:", err);
    }
    endCall();
    isCallEndedRef.current = true;
    navigation.goBack();
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins < 10 ? "0" : ""}${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  const resolvedPhoto = callerPhoto ? resolvePhotoUrl(callerPhoto) : null;
  const isVideoCall = callType === "video";

  return (
    <SafeAreaView style={styles.container}>
      {/* Remote Video Stream Viewport */}
      {isVideoCall && isCallActive && isConnected && remoteStream && !peerVideoOff ? (
        <View style={styles.videoWrapper}>
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteVideo}
            objectFit="cover"
          />
        </View>
      ) : (
        // Fallback layout (Audio Call, connecting, or remote video disabled)
        <View style={styles.fallbackContainer}>
          {/* Subtle concentric vector background circles to simulate audio waves */}
          <View style={styles.soundWaveCircle3} />
          <View style={styles.soundWaveCircle2} />
          <View style={styles.soundWaveCircle1} />

          <View style={styles.avatarWrapper}>
            {resolvedPhoto ? (
              <Image source={{ uri: resolvedPhoto }} style={styles.largeAvatar} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <User size={64} color={palette.gold.main} />
              </View>
            )}
          </View>
          
          <Text style={styles.callerName}>{callerName || "Bride & Groom Member"}</Text>
          
          <View style={styles.statusBadge}>
            <Text style={styles.callStatus}>
              {!isCallActive
                ? "Call Ended"
                : !isConnected
                ? "Connecting..."
                : peerVideoOff
                ? "Camera paused by partner"
                : "Voice Connected"}
            </Text>
          </View>

          {/* Fallback Screen Encryption Badge */}
          <View style={styles.fallbackEncryptedBadge}>
            <Text style={styles.fallbackEncryptedText}>🔒 End-to-End Encrypted Match Call</Text>
          </View>
        </View>
      )}

      {/* Camera Off Overlay (When video is active but partner paused camera) */}
      {isVideoCall && isCallActive && isConnected && peerVideoOff && (
        <View style={styles.peerCameraOffOverlay}>
          <VideoOff size={40} color="rgba(255, 255, 255, 0.4)" style={styles.overlayIcon} />
          <Text style={styles.peerCameraOffText}>{callerName}'s camera is paused</Text>
        </View>
      )}

      {/* Top Header Overlay info */}
      {isCallActive && (
        <View style={styles.topHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.secureHeaderBadge}>
              <Text style={styles.secureHeaderText}>🔒 SECURE</Text>
            </View>
            {isConnected && (
              <Text style={styles.timerText}>{formatDuration(duration)}</Text>
            )}
          </View>

          <View style={styles.headerRight}>
            {peerMuted && (
              <View style={styles.peerStatusBadge}>
                <MicOff size={12} color="#FFF" />
                <Text style={styles.peerStatusText}>Partner Muted</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Local PIP Video view (floating on top right/bottom right) */}
      {isVideoCall && isCallActive && localStream && !isVideoOff && (
        <View style={[styles.localPipBox, { bottom: Math.max(insets.bottom, 20) + 96 }]}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={true}
          />
        </View>
      )}

      {/* Bottom controls panel */}
      <View style={[styles.controlsContainer, { bottom: Math.max(insets.bottom, 20) + 12 }]}>
        {/* Toggle Mute microphone */}
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
          onPress={toggleMute}
          disabled={!localStream}
          activeOpacity={0.8}
        >
          {isMuted ? (
            <MicOff size={22} color="#FFF" />
          ) : (
            <Mic size={22} color="rgba(255, 255, 255, 0.8)" />
          )}
        </TouchableOpacity>

        {/* Toggle camera video stream */}
        {isVideoCall && (
          <TouchableOpacity
            style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]}
            onPress={toggleVideo}
            disabled={!localStream}
            activeOpacity={0.8}
          >
            {isVideoOff ? (
              <VideoOff size={22} color="#FFF" />
            ) : (
              <Camera size={22} color="rgba(255, 255, 255, 0.8)" />
            )}
          </TouchableOpacity>
        )}

        {/* Switch camera view (Front / Rear) */}
        {isVideoCall && !isVideoOff && (
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={switchCamera}
            disabled={!localStream}
            activeOpacity={0.8}
          >
            <RefreshCw size={22} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        )}

        {/* Red End Call button */}
        <TouchableOpacity
          style={styles.hangUpBtn}
          onPress={handleHangUp}
          activeOpacity={0.8}
        >
          <PhoneOff size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#120520",
  },
  videoWrapper: {
    flex: 1,
    backgroundColor: "#000",
  },
  remoteVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 1,
  },
  fallbackContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
    backgroundColor: "#120520",
  },
  soundWaveCircle1: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: "rgba(214, 175, 55, 0.12)",
  },
  soundWaveCircle2: {
    position: "absolute",
    width: 310,
    height: 310,
    borderRadius: 155,
    borderWidth: 1,
    borderColor: "rgba(214, 175, 55, 0.06)",
  },
  soundWaveCircle3: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: 200,
    borderWidth: 1,
    borderColor: "rgba(214, 175, 55, 0.03)",
  },
  avatarWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: palette.gold.main,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F0A33",
    marginBottom: 24,
    shadowColor: palette.gold.main,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 2,
  },
  largeAvatar: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderAvatar: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F0A33",
  },
  callerName: {
    fontSize: 26,
    ...fonts.bold,
    color: "#FFF",
    textAlign: "center",
    marginBottom: 10,
    zIndex: 2,
    letterSpacing: 0.5,
  },
  statusBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(214, 175, 55, 0.15)",
    zIndex: 2,
  },
  callStatus: {
    fontSize: 13,
    color: palette.gold.main,
    ...fonts.semibold,
    letterSpacing: 0.5,
  },
  fallbackEncryptedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 199, 89, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 24,
    zIndex: 2,
  },
  fallbackEncryptedText: {
    fontSize: 11,
    color: "#34C759",
    ...fonts.semibold,
    letterSpacing: 0.2,
  },
  peerCameraOffOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#120520",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  overlayIcon: {
    marginBottom: 12,
  },
  peerCameraOffText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
    ...fonts.medium,
  },
  topHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 25,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  timerText: {
    fontSize: 16,
    color: "#FFF",
    ...fonts.bold,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  secureHeaderBadge: {
    backgroundColor: "rgba(52, 199, 89, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(52, 199, 89, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  secureHeaderText: {
    color: "#34C759",
    fontSize: 10,
    ...fonts.bold,
    letterSpacing: 0.5,
  },
  peerStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FF4D4D",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  peerStatusText: {
    color: "#FFF",
    fontSize: 11,
    ...fonts.semibold,
  },
  localPipBox: {
    position: "absolute",
    right: 20,
    width: 100,
    height: 145,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: palette.gold.main,
    overflow: "hidden",
    backgroundColor: "#1D0D2E",
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  localVideo: {
    width: "100%",
    height: "100%",
  },
  controlsContainer: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1F0A33",
    borderWidth: 1.5,
    borderColor: "rgba(214, 175, 55, 0.25)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnActive: {
    backgroundColor: "#FF4D4D",
    borderColor: "#FF4D4D",
  },
  hangUpBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: palette.status.error,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.status.error,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
});
