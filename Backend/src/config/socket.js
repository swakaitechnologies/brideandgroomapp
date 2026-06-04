const { Server } = require("socket.io");
const logger = require("../utils/logger");

let io = null;

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

    socket.on("disconnect", () => {
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
