const { Server } = require("socket.io");
const logger = require("../utils/logger");

let io = null;

// rooms: { roomId: [socketId, socketId] }
const rooms = {};

/**
 * Initializes Socket.IO server attached to HTTP server.
 * 
 * @param {object} server - HTTP Server instance
 * @returns {object} Socket.IO Server instance
 */
function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    logger.info(`🔌 Socket client connected: ${socket.id}`);

    socket.on("join-profile-room", (userId) => {
      if (userId) {
        socket.join(`profile:${userId}`);
        logger.info(`👁️ Socket ${socket.id} joined profile room: profile:${userId}`);
      }
    });

    socket.on("leave-profile-room", (userId) => {
      if (userId) {
        socket.leave(`profile:${userId}`);
        logger.info(`🚪 Socket ${socket.id} left profile room: profile:${userId}`);
      }
    });

    // ─── WEBRTC SIGNALING EVENTS ──────────────────────────────────
    socket.on("join-room", ({ roomId, userId }) => {
      socket.join(roomId);
      socket.data.userId = userId;
      socket.data.roomId = roomId;

      if (!rooms[roomId]) rooms[roomId] = [];
      if (!rooms[roomId].includes(socket.id)) {
        rooms[roomId].push(socket.id);
      }

      logger.info(`👤 WebRTC: User ${userId} joined room ${roomId} (Socket: ${socket.id})`);

      // Tell the new user who else is already in the room
      const others = rooms[roomId].filter((id) => id !== socket.id);
      socket.emit("room-users", { users: others });

      // Tell others a new user joined
      socket.to(roomId).emit("user-joined", { userId, socketId: socket.id });
    });

    socket.on("offer", ({ to, offer }) => {
      io.to(to).emit("offer", { from: socket.id, offer });
    });

    socket.on("answer", ({ to, answer }) => {
      io.to(to).emit("answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    socket.on("end-call", ({ roomId }) => {
      socket.to(roomId).emit("call-ended");
    });

    socket.on("toggle-mute", ({ roomId, muted }) => {
      socket.to(roomId).emit("peer-muted", { socketId: socket.id, muted });
    });

    socket.on("toggle-video", ({ roomId, videoOff }) => {
      socket.to(roomId).emit("peer-video-off", { socketId: socket.id, videoOff });
    });

    socket.on("disconnect", () => {
      const { roomId } = socket.data;
      if (roomId && rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
        if (rooms[roomId].length === 0) delete rooms[roomId];
        socket.to(roomId).emit("user-left", { socketId: socket.id });
      }
      logger.info(`❌ Socket client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Gets the Socket.IO server instance.
 * 
 * @returns {object} Socket.IO Server
 */
function getIO() {
  return io;
}

/**
 * Broadcasts profile-updated event to WebSocket rooms.
 */
async function broadcastProfileUpdate(userId) {
  const io = getIO();
  if (!io) return;

  try {
    // Emit to UUID room
    io.to(`profile:${userId}`).emit("profile-updated", { userId });
    logger.info(`[SOCKET] Broadcasted profile-updated to room: profile:${userId}`);

    // Also look up customId to emit to customId-based room
    const { Profile } = require("../models/associations");
    const profile = await Profile.findOne({ where: { userId }, attributes: ["customId"] });
    if (profile && profile.customId) {
      io.to(`profile:${profile.customId}`).emit("profile-updated", { userId });
      logger.info(`[SOCKET] Broadcasted profile-updated to room: profile:${profile.customId}`);
    }
  } catch (err) {
    logger.error("❌ Socket broadcast error fetching customId:", err.message);
  }
}

module.exports = { initSocket, getIO, broadcastProfileUpdate };
