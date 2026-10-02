import { v2 as cloudinary } from "cloudinary";
import { ENV } from "./env.js";

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = ENV;

// true only when all three keys are present — used elsewhere to skip
// image-upload logic instead of letting cloudinary throw mid-request
export const isCloudinaryConfigured = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
} else {
  // don't crash the server — just log it and let callers check isCloudinaryConfigured
  console.warn(
    "⚠️  Cloudinary keys not found in .env — image upload (chat images, profile pics) is disabled. Text chat still works fine."
  );
}

export default cloudinary;