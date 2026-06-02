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
import { palette } from "../../theme/colors";
import { fonts } from "@/src/theme";

const { width, height } = Dimensions.get("window");

interface Props {
  route: any;
  navigation: any;
}

export default function VideoCallScreen({ route, navigation }: Props) {
  const { roomId, userId, callerName, callerPhoto, callType } = route.params;

  const auth = useAppSelector((state: RootState) => state.auth) as any;
  const myUserId = auth?.user?.id || userId;

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
  } = useWebRTC({ roomId, userId: myUserId, callType });

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
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
        />
      ) : (
        // Fallback layout (Audio Call, connecting, or remote video disabled)
        <View style={styles.fallbackContainer}>
          <View style={styles.avatarWrapper}>
            {resolvedPhoto ? (
              <Image source={{ uri: resolvedPhoto }} style={styles.largeAvatar} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <User size={64} color={palette.gold.main} />
              </View>
            )}
          </View>
          <Text style={styles.callerName}>{callerName}</Text>
          <Text style={styles.callStatus}>
            {!isCallActive
              ? "Call Ended"
              : !isConnected
              ? "Connecting..."
              : peerVideoOff
              ? "Camera paused by peer"
              : "Voice Connected"}
          </Text>
        </View>
      )}

      {/* Top Header Overlay info */}
      {isCallActive && isConnected && (
        <View style={styles.topHeader}>
          <Text style={styles.timerText}>{formatDuration(duration)}</Text>
          {peerMuted && (
            <View style={styles.peerStatusBadge}>
              <MicOff size={12} color="#FFF" />
              <Text style={styles.peerStatusText}>Peer Muted</Text>
            </View>
          )}
        </View>
      )}

      {/* Local PIP Video view (floating on top right/bottom right) */}
      {isVideoCall && isCallActive && isConnected && localStream && !isVideoOff && (
        <View style={styles.localPipBox}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={true}
          />
        </View>
      )}

      {/* Bottom controls panel */}
      <View style={styles.controlsContainer}>
        {/* Toggle Mute microphone */}
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
          onPress={toggleMute}
          disabled={!isConnected}
        >
          {isMuted ? (
            <MicOff size={24} color="#FFF" />
          ) : (
            <Mic size={24} color="rgba(255, 255, 255, 0.8)" />
          )}
        </TouchableOpacity>

        {/* Toggle camera video stream */}
        {isVideoCall && (
          <TouchableOpacity
            style={[styles.controlBtn, isVideoOff && styles.controlBtnActive]}
            onPress={toggleVideo}
            disabled={!isConnected}
          >
            {isVideoOff ? (
              <VideoOff size={24} color="#FFF" />
            ) : (
              <Camera size={24} color="rgba(255, 255, 255, 0.8)" />
            )}
          </TouchableOpacity>
        )}

        {/* Switch camera view (Front / Rear) */}
        {isVideoCall && !isVideoOff && (
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={switchCamera}
            disabled={!isConnected}
          >
            <RefreshCw size={24} color="rgba(255, 255, 255, 0.8)" />
          </TouchableOpacity>
        )}

        {/* Red End Call button */}
        <TouchableOpacity
          style={styles.hangUpBtn}
          onPress={handleHangUp}
          activeOpacity={0.8}
        >
          <PhoneOff size={28} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#150824",
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
  },
  avatarWrapper: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 3,
    borderColor: palette.gold.main,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2E1A47",
    marginBottom: 25,
    elevation: 8,
    shadowColor: palette.gold.main,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
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
    backgroundColor: "#2E1A47",
  },
  callerName: {
    fontSize: 24,
    ...fonts.bold,
    color: "#FFF",
    textAlign: "center",
    marginBottom: 10,
  },
  callStatus: {
    fontSize: 15,
    color: palette.gold.main,
    ...fonts.semibold,
    letterSpacing: 0.5,
  },
  topHeader: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 10,
  },
  timerText: {
    fontSize: 18,
    color: "#FFF",
    ...fonts.bold,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  peerStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 77, 77, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  peerStatusText: {
    color: "#FFF",
    fontSize: 11,
    ...fonts.semibold,
  },
  localPipBox: {
    position: "absolute",
    bottom: 120,
    right: 20,
    width: 105,
    height: 145,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: palette.gold.main,
    overflow: "hidden",
    backgroundColor: "#1E1E1E",
    zIndex: 5,
    elevation: 10,
  },
  localVideo: {
    width: "100%",
    height: "100%",
  },
  controlsContainer: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(37, 18, 54, 0.85)",
    borderWidth: 1.5,
    borderColor: "rgba(212, 175, 55, 0.15)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    zIndex: 10,
    elevation: 8,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnActive: {
    backgroundColor: palette.purple.deep,
    borderWidth: 1,
    borderColor: palette.gold.main,
  },
  hangUpBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.status.error,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.status.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});
