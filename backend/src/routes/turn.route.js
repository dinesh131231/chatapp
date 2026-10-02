import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { ENV } from "../lib/env.js";

const router = express.Router();

const STUN_ONLY = [{ urls: "stun:stun.l.google.com:19302" }];

router.get("/turn-credentials", protectRoute, async (req, res) => {
 
  if (ENV.DISABLE_TURN) {
    return res.json({ iceServers: STUN_ONLY, turnEnabled: false });
  }

  try {
    const response = await fetch(
      `https://${ENV.METERED_APP_NAME}.metered.live/api/v1/turn/credentials?apiKey=${ENV.METERED_API_KEY}`
    );

    if (!response.ok) throw new Error(`Metered API returned ${response.status}`);

    const meteredServers = await response.json();
    res.json({ iceServers: [...STUN_ONLY, ...meteredServers], turnEnabled: true });
  } catch (error) {
    console.log("Error fetching TURN credentials, falling back to STUN-only:", error.message);
    res.json({ iceServers: STUN_ONLY, turnEnabled: false });
  }
});

export default router;