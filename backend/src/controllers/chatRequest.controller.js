import ChatRequest from "../models/ChatRequest.js";
import Message from "../models/Message.js";
import { getReceiverSocketId, io } from "../lib/socket.js";


// Helper: check if two users already have an accepted connection (either direction)
export const isConnected = async (userA, userB) => {
  const existing = await ChatRequest.findOne({
    status: "accepted",
    $or: [
      { senderId: userA, receiverId: userB },
      { senderId: userB, receiverId: userA },
    ],
  });
  return !!existing;
};

export const sendChatRequest = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { receiverId } = req.params;

    if (senderId.toString() === receiverId) {
      return res.status(400).json({ message: "Cannot send a request to yourself" });
    }

    if (await isConnected(senderId, receiverId)) {
      return res.status(400).json({ message: "You are already connected" });
    }

    // if the other user already sent YOU a pending request, auto-accept instead
    const reverse = await ChatRequest.findOne({
      senderId: receiverId,
      receiverId: senderId,
      status: "pending",
    });
    if (reverse) {
      reverse.status = "accepted";
      await reverse.save();

      // notify the original sender that their request was auto-accepted
      const originalSenderSocketId = getReceiverSocketId(receiverId);
      if (originalSenderSocketId) {
        io.to(originalSenderSocketId).emit(
          "chatRequestAccepted",
          await reverse.populate("receiverId", "fullName profilePic")
        );
      }

      return res.status(200).json({ message: "Request accepted automatically", request: reverse });
    }

    const request = await ChatRequest.findOneAndUpdate(
      { senderId, receiverId },
      { senderId, receiverId, status: "pending" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // emit AFTER request exists
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "chatRequestReceived",
        await request.populate("senderId", "fullName profilePic")
      );
    }

    res.status(201).json(request);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Request already sent" });
    }
    console.log("Error in sendChatRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const respondToChatRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // "accept" | "reject"
    const userId = req.user._id;

    const request = await ChatRequest.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.receiverId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to respond to this request" });
    }

    request.status = action === "accept" ? "accepted" : "rejected";
    await request.save();

    const senderSocketId = getReceiverSocketId(request.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("chatRequestAccepted", await request.populate("receiverId", "fullName profilePic"));
    }

    res.status(200).json(request);
  } catch (error) {
    console.log("Error in respondToChatRequest:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const requests = await ChatRequest.find({
      receiverId: req.user._id,
      status: "pending",
    }).populate("senderId", "fullName profilePic");

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSentRequests = async (req, res) => {
  try {
    const requests = await ChatRequest.find({
      senderId: req.user._id,
    }).populate("receiverId", "fullName profilePic");

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};