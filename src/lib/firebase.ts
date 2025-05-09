
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics"; // Import isSupported

let rawAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
let cleanAuthDomain = rawAuthDomain;

if (!rawAuthDomain) {
  console.error(
    "CRITICAL Firebase Config Error: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is not set or is empty in your environment variables. " +
    "Firebase authentication will likely fail with 'auth/configuration-not-found'. " +
    "Please set it to your Firebase project's auth domain (e.g., your-project-id.firebaseapp.com) in your .env file."
  );
} else {
  // Check for the specific markdown-like format: `[domain](anything)`
  // This pattern tries to extract the `domain.com` part from `[domain.com](...)`
  const markdownLinkMatch = rawAuthDomain.match(/^\[([^\]]+)\]\(.*\)$/);
  if (markdownLinkMatch && markdownLinkMatch[1]) {
    cleanAuthDomain = markdownLinkMatch[1]; // Extract the content within the square brackets
    console.warn(
      `WARNING: Your NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN environment variable ("${rawAuthDomain}") appears to be in a markdown link format. ` +
      `It has been programmatically sanitized to "${cleanAuthDomain}" for Firebase initialization. ` +
      `To prevent potential issues and to ensure correct Firebase operation, please update your .env file to contain ONLY the clean hostname. For example: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${cleanAuthDomain}`
    );
  } else if (rawAuthDomain.includes("[") || rawAuthDomain.includes("(") || rawAuthDomain.includes("]")) {
    // General warning if it contains characters typical of markdown links but doesn't match the exact pattern
    console.warn(
        `WARNING: Your NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ("${rawAuthDomain}") may be malformed or contain unexpected characters. ` +
        `Firebase expects a clean hostname (e.g., your-project-id.firebaseapp.com). ` +
        `If authentication fails with 'auth/configuration-not-found' or URL errors, please ensure this value in your .env file is a plain hostname.`
    );
  }
}


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: cleanAuthDomain, // Use the potentially cleaned authDomain
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// For debugging, you can uncomment this to see what config Firebase is trying to use:
// console.log("Attempting to initialize Firebase with config:", firebaseConfig);

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp(); // Use getApp() if already initialized
}

const auth = getAuth(app);

// Initialize Analytics only on the client side
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(err => {
    console.error("Error checking Firebase Analytics support:", err);
  });
}

export { app, auth, analytics };
