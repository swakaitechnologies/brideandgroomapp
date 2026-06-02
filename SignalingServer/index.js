const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// rooms: { roomId: [socketId, socketId] }
const rooms = {};

io.on("connection", (socket) => {
  console.log("🔌 Connected:", socket.id);

  // ─── JOIN ROOM ────────────────────────────────────────────
  socket.on("join-room", ({ roomId, userId }) => {
    socket.join(roomId);
    socket.data.userId = userId;
    socket.data.roomId = roomId;

    if (!rooms[roomId]) rooms[roomId] = [];
    rooms[roomId].push(socket.id);

    console.log(`👤 ${userId} joined room ${roomId}`);

    // Tell the new user who else is already in the room
    const others = rooms[roomId].filter((id) => id !== socket.id);
    socket.emit("room-users", { users: others });

    // Tell others a new user joined
    socket.to(roomId).emit("user-joined", { userId, socketId: socket.id });
  });

  // ─── OFFER ────────────────────────────────────────────────
  socket.on("offer", ({ to, offer }) => {
    io.to(to).emit("offer", { from: socket.id, offer });
  });

  // ─── ANSWER ───────────────────────────────────────────────
  socket.on("answer", ({ to, answer }) => {
    io.to(to).emit("answer", { from: socket.id, answer });
  });

  // ─── ICE CANDIDATE ────────────────────────────────────────
  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  // ─── CALL ACTIONS ─────────────────────────────────────────
  socket.on("end-call", ({ roomId }) => {
    socket.to(roomId).emit("call-ended");
  });

  socket.on("toggle-mute", ({ roomId, muted }) => {
    socket.to(roomId).emit("peer-muted", { socketId: socket.id, muted });
  });

  socket.on("toggle-video", ({ roomId, videoOff }) => {
    socket.to(roomId).emit("peer-video-off", { socketId: socket.id, videoOff });
  });

  // ─── DISCONNECT ───────────────────────────────────────────
  socket.on("disconnect", () => {
    const { roomId } = socket.data;
    if (roomId && rooms[roomId]) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) delete rooms[roomId];
      socket.to(roomId).emit("user-left", { socketId: socket.id });
    }
    console.log("❌ Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`🚀 Signaling server on port ${PORT}`));
