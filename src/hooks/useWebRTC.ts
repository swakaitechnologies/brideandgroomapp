/**
 * useWebRTC.ts
 * Core hook — manages peer connection, signaling, and media streams.
 * 
 * Usage:
 *   const { localStream, remoteStream, startCall, endCall, toggleMute, toggleVideo } = useWebRTC({ roomId, userId });
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from "react-native-webrtc";
import { io, Socket } from "socket.io-client";
import { DEV_HOST } from "../services/api";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SIGNALING_SERVER = `http://${DEV_HOST}:3001`;

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface UseWebRTCProps {
  roomId: string;
  userId: string;
  callType?: "video" | "audio"; // default: video
  token: string | null;
}

interface UseWebRTCReturn {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isConnected: boolean;
  isMuted: boolean;
  isVideoOff: boolean;
  isCallActive: boolean;
  peerMuted: boolean;
  peerVideoOff: boolean;
  startCall: () => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  switchCamera: () => void;
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────
export function useWebRTC({
  roomId,
  userId,
  callType = "video",
  token,
}: UseWebRTCProps): UseWebRTCReturn {
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCallActive, setIsCallActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [peerMuted, setPeerMuted] = useState(false);
  const [peerVideoOff, setPeerVideoOff] = useState(false);

  // ─── CLEANUP ──────────────────────────────────────────────
  const cleanup = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
    pcRef.current = null;
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIsConnected(false);
    setIsCallActive(false);
  }, []);

  // ─── GET LOCAL MEDIA ──────────────────────────────────────
  const getLocalStream = useCallback(async () => {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video"
          ? { facingMode: "user", width: 640, height: 480 }
          : false,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn("Failed to get local stream:", err);
      // Fallback for audio-only if camera fails, or re-throw
      throw err;
    }
  }, [callType]);

  // ─── CREATE PEER CONNECTION ───────────────────────────────
  const createPeerConnection = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to the connection
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    // When we receive remote tracks
    const pcAny = pc as any;
    pcAny.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    // Send ICE candidates to the other peer via signaling server
    pcAny.onicecandidate = (event: any) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", {
          to: (pcRef.current as any)?.remoteSocketId,
          candidate: event.candidate,
        });
      }
    };

    pcAny.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") setIsConnected(true);
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setIsConnected(false);
      }
    };

    pcRef.current = pc;
    return pc;
  }, []);

  // ─── SOCKET SETUP ─────────────────────────────────────────
  useEffect(() => {
    const socket = io(SIGNALING_SERVER, {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", { roomId, userId });
    });

    // Someone already in the room — we initiate the offer
    socket.on("room-users", async ({ users }: { users: string[] }) => {
      if (users.length > 0) {
        try {
          const stream = await getLocalStream();
          const pc = createPeerConnection(stream);
          const targetSocket = users[0];
          (pc as any).remoteSocketId = targetSocket;

          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: callType === "video",
          });
          await pc.setLocalDescription(offer);
          socket.emit("offer", { to: targetSocket, offer });
          setIsCallActive(true);
        } catch (err) {
          console.warn("Failed room-users negotiation:", err);
        }
      }
    });

    // New user joined — they will send us an offer
    socket.on("user-joined", ({ socketId }: { socketId: string }) => {
      console.log("User joined, waiting for their offer...", socketId);
    });

    // We received an offer — send back an answer
    socket.on("offer", async ({ from, offer }: { from: string; offer: any }) => {
      try {
        const stream = await getLocalStream();
        const pc = createPeerConnection(stream);
        (pc as any).remoteSocketId = from;

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { to: from, answer });
        setIsCallActive(true);
      } catch (err) {
        console.warn("Failed offer handling:", err);
      }
    });

    // We received an answer to our offer
    socket.on("answer", async ({ answer }: { answer: any }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.warn("Failed setting remote description:", err);
        }
      }
    });

    // ICE candidate from the other peer
    socket.on("ice-candidate", async ({ candidate }: { candidate: any }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("Failed adding ICE candidate:", err);
        }
      }
    });

    // Remote events
    socket.on("call-ended", cleanup);
    socket.on("user-left", cleanup);
    socket.on("peer-muted", ({ muted }: { muted: boolean }) => setPeerMuted(muted));
    socket.on("peer-video-off", ({ videoOff }: { videoOff: boolean }) => setPeerVideoOff(videoOff));

    return () => {
      cleanup();
      socket.disconnect();
    };
  }, [roomId, userId, callType, token, getLocalStream, createPeerConnection, cleanup]);

  // ─── ACTIONS ──────────────────────────────────────────────
  const startCall = useCallback(async () => {
    await getLocalStream();
  }, [getLocalStream]);

  const endCall = useCallback(() => {
    socketRef.current?.emit("end-call", { roomId });
    cleanup();
  }, [roomId, cleanup]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const muted = !audioTrack.enabled;
      setIsMuted(muted);
      socketRef.current?.emit("toggle-mute", { roomId, muted });
    }
  }, [roomId]);

  const toggleVideo = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const videoOff = !videoTrack.enabled;
      setIsVideoOff(videoOff);
      socketRef.current?.emit("toggle-video", { roomId, videoOff });
    }
  }, [roomId]);

  const switchCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0] as any;
    if (videoTrack && typeof videoTrack._switchCamera === "function") {
      videoTrack._switchCamera();
    }
  }, []);

  return {
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
  };
}
