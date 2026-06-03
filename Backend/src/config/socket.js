const { Server } = require("socket.io");
const logger = require("../utils/logger");

let io = null;

/**
 * Initializes Socket.IO server attached to HTTP server (local environment fallback).
 * 
 * @param {object} server - HTTP Server instance
 * @returns {object} Socket.IO Server instance
 */
function initSocket(server) {
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    logger.info("⚡ Serverless environment: Skipping local Socket.IO initialization.");
    return null;
  }

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
 * Gets the Socket.IO server instance or AWS API Gateway Websocket proxy client.
 * 
 * @returns {object} Socket.IO Server or WebSocket adapter
 */
function getIO() {
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const { ApiGatewayManagementApi, PostToConnectionCommand } = require("@aws-sdk/client-apigatewaymanagementapi");
    // Dynamic import to avoid circular dependency
    const WebSocketConnection = require("../models/WebSocketConnection");

    return {
      to: (roomName) => {
        return {
          emit: async (eventName, data) => {
            try {
              const connections = await WebSocketConnection.findAll({
                where: { roomName: roomName }
              });

              if (connections.length === 0) return;

              await Promise.all(
                connections.map(async (conn) => {
                  const client = new ApiGatewayManagementApi({
                    endpoint: conn.endpoint,
                    region: process.env.AWS_REGION || "us-east-1",
                  });

                  try {
                    await client.send(
                      new PostToConnectionCommand({
                        ConnectionId: conn.connectionId,
                        Data: Buffer.from(
                          JSON.stringify({
                            event: eventName,
                            data: data,
                          })
                        ),
                      })
                    );
                  } catch (err) {
                    if (err.name === "GoneException" || err.$metadata?.httpStatusCode === 410) {
                      logger.info(`🧹 Stale socket connection cleaned up: ${conn.connectionId}`);
                      await conn.destroy();
                    } else {
                      logger.error(`❌ Failed to post to websocket connection ${conn.connectionId}:`, err.message);
                    }
                  }
                })
              );
            } catch (err) {
              logger.error(`❌ Failed to emit WebSocket event to room: ${roomName}:`, err.message);
            }
          }
        };
      }
    };
  }

  return io;
}

/**
 * Serverless AWS API Gateway WebSocket Route Handler.
 * Tracks connect/disconnect/room-joining states inside the SQL database.
 */
async function handleWebSocketEvent(event) {
  const { routeKey, connectionId, domainName, stage } = event.requestContext;
  const endpoint = `https://${domainName}/${stage}`;
  const WebSocketConnection = require("../models/WebSocketConnection");

  try {
    if (routeKey === "$connect") {
      logger.info(`🔌 API Gateway WebSocket connected: ${connectionId}`);
      return { statusCode: 200, body: "Connected." };
    }

    if (routeKey === "$disconnect") {
      logger.info(`❌ API Gateway WebSocket disconnected: ${connectionId}`);
      await WebSocketConnection.destroy({ where: { connectionId } });
      return { statusCode: 200, body: "Disconnected." };
    }

    // Custom route / messages
    if (event.body) {
      const payload = JSON.parse(event.body);
      const action = payload.action;

      if (action === "join-profile-room" && payload.userId) {
        const roomName = `profile:${payload.userId}`;
        // Record connection mapping
        await WebSocketConnection.findOrCreate({
          where: { connectionId, roomName },
          defaults: { connectionId, roomName, endpoint }
        });
        logger.info(`👁️ WebSocket ${connectionId} joined profile room: ${roomName}`);
        return { statusCode: 200, body: "Joined room." };
      }

      if (action === "leave-profile-room" && payload.userId) {
        const roomName = `profile:${payload.userId}`;
        await WebSocketConnection.destroy({
          where: { connectionId, roomName }
        });
        logger.info(`🚪 WebSocket ${connectionId} left profile room: ${roomName}`);
        return { statusCode: 200, body: "Left room." };
      }
    }

    return { statusCode: 200, body: "Received." };
  } catch (err) {
    logger.error("❌ Error handling WebSocket event:", err);
    return { statusCode: 500, body: "Failed to process WebSocket event." };
  }
}

/**
 * Broadcasts profile-updated event to WebSocket rooms for both local and Lambda environments.
 */
async function broadcastProfileUpdate(userId) {
  const io = getIO();
  if (!io) return;

  try {
    // Emit to UUID room
    await io.to(`profile:${userId}`).emit("profile-updated", { userId });
    logger.info(`[SOCKET] Broadcasted profile-updated to room: profile:${userId}`);

    // Also look up customId to emit to customId-based room
    const { Profile } = require("../models/associations");
    const profile = await Profile.findOne({ where: { userId }, attributes: ["customId"] });
    if (profile && profile.customId) {
      await io.to(`profile:${profile.customId}`).emit("profile-updated", { userId });
      logger.info(`[SOCKET] Broadcasted profile-updated to room: profile:${profile.customId}`);
    }
  } catch (err) {
    logger.error("❌ Socket broadcast error fetching customId:", err.message);
  }
}

module.exports = { initSocket, getIO, handleWebSocketEvent, broadcastProfileUpdate };
