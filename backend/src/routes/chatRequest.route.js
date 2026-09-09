import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  sendChatRequest,
  respondToChatRequest,
  getPendingRequests,
  getSentRequests,
} from "../controllers/chatRequest.controller.js";

const router = express.Router();

router.post("/send/:receiverId", protectRoute, sendChatRequest);
router.put("/respond/:requestId", protectRoute, respondToChatRequest);
router.get("/pending", protectRoute, getPendingRequests);
router.get("/sent", protectRoute, getSentRequests);

export default router;