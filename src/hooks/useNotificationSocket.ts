import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Toast from "react-native-toast-message";
import { MAIN_SOCKET_URL } from "../services/api";

/**
 * Custom React hook to listen for real-time notification socket events.
 * Displays a styled Toast message inside the app when a new notification arrives.
 * 
 * @param {string|null|undefined} userId - The authenticated user's ID
 * @param {object} [navigationRef] - App navigation reference to handle toast clicks
 * @param {function} [onNewNotification] - Optional callback to refresh counts/lists
 */
export function useNotificationSocket(
  userId: string | null | undefined,
  navigationRef?: any,
  onNewNotification?: () => void
) {
  const socketRef = useRef<Socket | WebSocket | null>(null);

  useEffect(() => {
    if (!userId) return;

    const isAwsWebSocket = MAIN_SOCKET_URL.startsWith("ws://") || MAIN_SOCKET_URL.startsWith("wss://");

    if (isAwsWebSocket) {
      console.log(`[SOCKET] Connecting via native WebSocket to: ${MAIN_SOCKET_URL}`);
      const ws = new WebSocket(MAIN_SOCKET_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log(`[SOCKET] Native WS connected. Joining user notification room: ${userId}`);
        ws.send(JSON.stringify({ action: "join-profile-room", userId: userId }));
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === "new-notification") {
            const data = payload.data;
            console.log("[SOCKET] Received new-notification via WS:", data);

            if (onNewNotification) {
              onNewNotification();
            }

            Toast.show({
              type: getToastType(data.type),
              text1: formatToastTitle(data.type),
              text2: data.message,
              position: "top",
              visibilityTime: 4000,
              autoHide: true,
              onPress: () => {
                Toast.hide();
                handleToastClick(data, navigationRef);
              },
            });
          }
        } catch (err) {
          console.warn("[SOCKET] Failed to parse WS notification message:", err);
        }
      };

      ws.onerror = (error) => {
        console.warn("[SOCKET] Native WS notification connection error:", error);
      };

      return () => {
        console.log(`[SOCKET] Native WS disconnecting notification listener for user: ${userId}`);
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: "leave-profile-room", userId: userId }));
          }
        } catch (err) {}
        ws.close();
      };
    } else {
      console.log(`[SOCKET] Connecting via Socket.IO to: ${MAIN_SOCKET_URL}`);
      const socket = io(MAIN_SOCKET_URL, {
        transports: ["websocket"],
        forceNew: true,
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        console.log(`[SOCKET] Connected. Joining user notification room: profile:${userId}`);
        socket.emit("join-profile-room", userId);
      });

      socket.on("new-notification", (data: any) => {
        console.log("[SOCKET] Received new-notification:", data);

        if (onNewNotification) {
          onNewNotification();
        }

        Toast.show({
          type: getToastType(data.type),
          text1: formatToastTitle(data.type),
          text2: data.message,
          position: "top",
          visibilityTime: 4000,
          autoHide: true,
          onPress: () => {
            Toast.hide();
            handleToastClick(data, navigationRef);
          },
        });
      });

      socket.on("connect_error", (error) => {
        console.warn(`[SOCKET] Socket.IO connection error:`, error.message);
      });

      return () => {
        console.log(`[SOCKET] Leaving notification room and disconnecting user: ${userId}`);
        socket.emit("leave-profile-room", userId);
        socket.disconnect();
      };
    }
  }, [userId, navigationRef, onNewNotification]);
}

/**
 * Map notification types to toast types (success, info, warning, error)
 */
function getToastType(type: string): string {
  switch (type) {
    case "interest_accept":
    case "photo_approve":
    case "contact_accept":
      return "success";
    case "contact_reject":
      return "error";
    case "chat":
    case "message":
    case "interest":
    case "photo_request":
    case "contact_request":
      return "info";
    default:
      return "info";
  }
}

/**
 * Format title for toast banners
 */
function formatToastTitle(type: string): string {
  switch (type) {
    case "interest":
      return "New Interest!";
    case "interest_accept":
      return "Interest Accepted!";
    case "chat":
    case "message":
      return "New Message";
    case "photo_request":
      return "Photo Request";
    case "photo_approve":
      return "Photo Access Approved!";
    case "contact_request":
      return "Contact Request";
    case "contact_accept":
      return "Contact Revealed!";
    case "contact_reject":
      return "Contact Request Rejected";
    case "contact_reveal":
      return "Contact Viewed";
    case "kyc":
      return "KYC Update";
    case "feedback":
      return "Support Update";
    default:
      return "Notification";
  }
}

/**
 * Route user on Toast press
 */
function handleToastClick(data: any, navigationRef: any) {
  if (!navigationRef) return;

  const { type, relatedId, senderId } = data;

  try {
    switch (type) {
      case "chat":
      case "message":
        if (relatedId) {
          navigationRef.navigate("ChatDetail", { chatId: relatedId });
        } else {
          navigationRef.navigate("Tabs", { screen: "Chats" });
        }
        break;
      case "kyc":
        navigationRef.navigate("KYCVerification");
        break;
      case "feedback":
        navigationRef.navigate("HelpSupport");
        break;
      default:
        navigationRef.navigate("Notifications");
        break;
    }
  } catch (err: any) {
    console.warn("[SOCKET] Failed to navigate on toast click:", err.message);
  }
}
