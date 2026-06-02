const { Server } = require("socket.io");
const logger = require("../utils/logger");

let io = null;

/**
 * Initializes Socket.IO server attached to HTTP server.
 * Sets up listeners for profile viewing rooms.
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

    // Join room for specific profile to receive updates
    socket.on("join-profile-room", (userId) => {
      if (userId) {
        socket.join(`profile:${userId}`);
        logger.info(`👁️ Socket ${socket.id} joined profile room: profile:${userId}`);
      }
    });

    // Leave room
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
 * Gets the initialized Socket.IO server instance.
 * 
 * @returns {object|null} Socket.IO Server instance
 */
function getIO() {
  return io;
}

module.exports = { initSocket, getIO };
