import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true,
  },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// we will use this function to check if the user is online or not
const userSocketMap = {}; // {userId: socketId}

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  const userId = socket.user._id.toString(); // use what the auth middleware already gave us
  userSocketMap[userId] = socket.id;

  console.log("Socket authenticated for user:", socket.user.fullName, `(${userId})`);

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });

  // --- WebRTC signaling relay ---

  socket.on("webrtc-offer", ({ targetUserId, offer }) => {
    console.log("Relaying offer from", userId, "to", targetUserId);
    const targetSocketId = getReceiverSocketId(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-offer", { fromUserId: userId, offer });
    } else {
      console.log("No socket found for target user:", targetUserId);
    }
  });

  socket.on("webrtc-answer", ({ targetUserId, answer }) => {
    console.log("Relaying answer from", userId, "to", targetUserId);
    const targetSocketId = getReceiverSocketId(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-answer", { fromUserId: userId, answer });
    }
  });

  socket.on("webrtc-ice-candidate", ({ targetUserId, candidate }) => {
    const targetSocketId = getReceiverSocketId(targetUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("webrtc-ice-candidate", { fromUserId: userId, candidate });
    }
  });
});

export { io, app, server };