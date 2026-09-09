import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { isConnected } from "./chatRequest.controller.js";
import ChatRequest from "../models/ChatRequest.js";

// helper: given a userId and a list of other user IDs, return a Set of the ones connected to userId
const getConnectedIdSet = async (userId) => {
  const acceptedRequests = await ChatRequest.find({
    status: "accepted",
    $or: [{ senderId: userId }, { receiverId: userId }],
  });

  return new Set(
    acceptedRequests.map((r) =>
      r.senderId.toString() === userId.toString()
        ? r.receiverId.toString()
        : r.senderId.toString()
    )
  );
};

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    const connectedIds = await getConnectedIdSet(loggedInUserId);

    const usersWithStatus = filteredUsers.map((user) => ({
      ...user.toObject(),
      isConnected: connectedIds.has(user._id.toString()),
    }));

    res.status(200).json(usersWithStatus);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    const connected = await isConnected(senderId, receiverId);
    if (!connected) {
      return res.status(403).json({
        message: "You must send and have an accepted chat request before messaging this user",
      });
    }

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const messages = await Message.find({
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

    const connectedIds = await getConnectedIdSet(loggedInUserId);

    const partnersWithStatus = chatPartners.map((user) => ({
      ...user.toObject(),
      isConnected: connectedIds.has(user._id.toString()),
    }));

    res.status(200).json(partnersWithStatus);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(error).json({ error: "Internal server error" });
  }
};