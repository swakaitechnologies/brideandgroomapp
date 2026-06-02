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
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!profileId) return;

    console.log(`[SOCKET] Connecting to main backend for profile: ${profileId}`);
    
    // Connect to Main Backend port 5000
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
      console.warn(`[SOCKET] Main backend socket connection error:`, error.message);
    });

    return () => {
      if (socketRef.current) {
        console.log(`[SOCKET] Leaving profile room and disconnecting: ${profileId}`);
        socketRef.current.emit("leave-profile-room", profileId);
        socketRef.current.disconnect();
      }
    };
  }, [profileId, onProfileUpdate]);
}
