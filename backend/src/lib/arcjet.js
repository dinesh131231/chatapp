import arcjet, { shield, detectBot, slidingWindow } from "@arcjet/node";

import { ENV } from "./env.js";

// null when no key is set — middleware checks this and skips protection
// instead of letting the arcjet() constructor throw at startup
export const isArcjetConfigured = Boolean(ENV.ARCJET_KEY);

const aj = isArcjetConfigured
  ? arcjet({
      key: ENV.ARCJET_KEY,
      rules: [
        // Shield protects your app from common attacks e.g. SQL injection
        shield({ mode: "LIVE" }),
        // Create a bot detection rule
        detectBot({
          mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
          // Block all bots except the following
          allow: [
            "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
            // Uncomment to allow these other common bot categories
            // See the full list at https://arcjet.com/bot-list
            //"CATEGORY:MONITOR", // Uptime monitoring services
            //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
          ],
        }),
        // Create a token bucket rate limit. Other algorithms are supported.
        slidingWindow({
          mode: "LIVE", // Blocks requests. Use "DRY_RUN" to log only
          max: 100,
          interval: 60,
        }),
      ],
    })
  : null;

if (!isArcjetConfigured) {
  console.warn(
    "⚠️  ARCJET_KEY not found in .env — bot detection, shield, and rate limiting are disabled. Requests will pass through unprotected."
  );
}

export default aj;