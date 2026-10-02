import { Resend } from "resend";
import { ENV } from "./env.js";

// true only when a real key is present — construct the client lazily and
// only when actually needed, so a missing/placeholder key never crashes
// the server at startup (the SDK itself throws synchronously otherwise)
export const isResendConfigured = Boolean(
  ENV.RESEND_API_KEY && ENV.RESEND_API_KEY !== "your_resend_api_key"
);

export const resendClient = isResendConfigured ? new Resend(ENV.RESEND_API_KEY) : null;

if (!isResendConfigured) {
  console.warn(
    "⚠️  RESEND_API_KEY not found (or still a placeholder) in .env — welcome emails are disabled."
  );
}

export const sender = {
  email: ENV.EMAIL_FROM,
  name: ENV.EMAIL_FROM_NAME,
};