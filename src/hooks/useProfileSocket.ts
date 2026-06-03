import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { MAIN_SOCKET_URL } from "../services/api";

/**
 * React hook to listen for real-time updates for a specific profile.
 * 
 * @param {string|null|undefined} profileId - The profile ID (UUID or customId) to monitor
 * @param {function} onProfileUpdate - Callback when profile updates
 */
export function useProfileSocket(
  profileId: string | null | undefined,
  onProfileUpdate: () => void
) {
  const socketRef = useRef<Socket | WebSocket | null>(null);

  useEffect(() => {
    if (!profileId) return;

    const isAwsWebSocket = MAIN_SOCKET_URL.startsWith("ws://") || MAIN_SOCKET_URL.startsWith("wss://");

    if (isAwsWebSocket) {
      console.log(`[SOCKET] Connecting via native WebSocket to: ${MAIN_SOCKET_URL}`);
      const ws = new WebSocket(MAIN_SOCKET_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log(`[SOCKET] Native WS connected. Joining profile room: ${profileId}`);
        ws.send(JSON.stringify({ action: "join-profile-room", userId: profileId }));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === "profile-updated") {
            console.log(`[SOCKET] Profile updated event trigger for: ${profileId}`);
            onProfileUpdate();
          }
        } catch (err) {
          console.warn("[SOCKET] Failed to parse message:", err);
        }
      };

      ws.onerror = (error) => {
        console.warn("[SOCKET] Native WS connection error:", error);
      };

      return () => {
        console.log(`[SOCKET] Native WS disconnecting for profile: ${profileId}`);
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: "leave-profile-room", userId: profileId }));
          }
        } catch (err) {}
        ws.close();
      };
    } else {
      console.log(`[SOCKET] Connecting via Socket.IO to: ${MAIN_SOCKET_URL}`);
      const socket = io(MAIN_SOCKET_URL, {
        transports: ["websocket"],
        forceNew: true
      });
      
      socketRef.current = socket;

      socket.on("connect", () => {
        console.log(`[SOCKET] Connected. Joining profile room: profile:${profileId}`);
        socket.emit("join-profile-room", profileId);
      });

      socket.on("profile-updated", () => {
        console.log(`[SOCKET] Received profile-updated event for profile: ${profileId}`);
        onProfileUpdate();
      });

      socket.on("connect_error", (error) => {
        console.warn(`[SOCKET] Socket.IO connection error:`, error.message);
      });

      return () => {
        console.log(`[SOCKET] Leaving profile room and disconnecting: ${profileId}`);
        socket.emit("leave-profile-room", profileId);
        socket.disconnect();
      };
    }
  }, [profileId, onProfileUpdate]);
}
