// import { resendClient, sender } from "../lib/resend.js";
// import { createWelcomeEmailTemplate } from "../emails/emailTemplates.js";

// export const sendWelcomeEmail = async (email, name, clientURL) => {
//   const { data, error } = await resendClient.emails.send({
//     from: `${sender.name} <${sender.email}>`,
//     to: email,
//     subject: "Welcome to Chatify!",
//     html: createWelcomeEmailTemplate(name, clientURL),
//   });

//   if (error) {
//     console.error("Error sending welcome email:", error);
//     throw new Error("Failed to send welcome email");
//   }

//   console.log("Welcome Email sent successfully", data);
// };

import { resendClient, sender } from "../lib/resend.js";
import { createWelcomeEmailTemplate } from "../emails/emailTemplates.js";

export const sendWelcomeEmail = async (email, name, clientURL) => {
  if (process.env.DISABLE_EMAILS === "true") {
    console.log("Email sending disabled — skipping welcome email");
    return;
  }
  try {
    const { data, error } = await resendClient.emails.send({
      from: `${sender.name} <${sender.email}>`,
      to: email,
      subject: "Welcome to Chatify!",
      html: createWelcomeEmailTemplate(name, clientURL),
    });

    if (error) {
      console.error("Error sending welcome email:", error);
      return; // don't throw — a failed email shouldn't break signup
    }

    console.log("Welcome Email sent successfully", data);
  } catch (err) {
    // catches network-level failures too (ECONNRESET, timeouts, etc.)
    console.error("Unexpected error sending welcome email:", err.message);
  }
};