
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics"; // Import isSupported

let rawAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
let cleanAuthDomain = rawAuthDomain;
let specificWarning = "";

if (!rawAuthDomain || rawAuthDomain.trim() === "") {
  console.error(
    "CRITICAL Firebase Config Error: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is not set or is empty in your environment variables. " +
    "Firebase authentication will likely fail with 'auth/configuration-not-found'. " +
    "Please set it to your Firebase project's auth domain (e.g., your-project-id.firebaseapp.com) in your .env file."
  );
  // cleanAuthDomain will remain undefined or empty, leading to Firebase init errors, which is indicative.
} else {
  let tempAuthDomain = rawAuthDomain.trim();

  // 1. Handle specific markdown link format: `[domain](anything)`
  const markdownLinkMatch = tempAuthDomain.match(/^\[([^\]]+)\]\(.*\)$/);
  if (markdownLinkMatch && markdownLinkMatch[1]) {
    tempAuthDomain = markdownLinkMatch[1].trim();
    specificWarning = `WARNING: Your NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ("${rawAuthDomain}") appeared to be a markdown link and was sanitized to "${tempAuthDomain}".`;
  }

  // 2. Attempt to treat as a URL and extract hostname
  // This helps strip protocols (http/https), ports (usually), paths, query params, fragments.
  try {
    // Add a dummy protocol if none is present to help URL constructor parse it as a host-based URL
    // Ensure it doesn't already have one before prefixing.
    const urlInput = tempAuthDomain.includes('://') ? tempAuthDomain : `https://${tempAuthDomain}`;
    const parsedUrl = new URL(urlInput);
    // Check if hostname is valid and different from the (potentially markdown-cleaned) tempAuthDomain
    if (parsedUrl.hostname && parsedUrl.hostname !== tempAuthDomain) {
       // Only set if markdown warning wasn't already set OR if this parsing provides a "more clean" domain
      if (!specificWarning || (specificWarning && tempAuthDomain !== parsedUrl.hostname)) {
         specificWarning = `NOTE: Your NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ("${rawAuthDomain}") was processed to use its hostname part "${parsedUrl.hostname}".`;
      }
      tempAuthDomain = parsedUrl.hostname;
    } else if (parsedUrl.hostname && parsedUrl.hostname === tempAuthDomain) {
      // Domain was already clean or markdown sanitization produced a clean hostname
    }
  } catch (e) {
    // If it's not a valid URL (e.g., just "project-id.firebaseapp.com"), URL constructor will throw.
    // In this case, tempAuthDomain (potentially after markdown cleaning) is likely the intended hostname.
    // This catch block means the input wasn't a full URL, which is often fine for hostnames.
  }

  cleanAuthDomain = tempAuthDomain;

  if (specificWarning) {
    console.warn(specificWarning + " Please ensure this value is your Firebase project's correct Auth Domain (e.g., your-project-id.firebaseapp.com).");
  }

  // General check for remaining suspicious characters if no specific warning was triggered by markdown or URL parsing.
  // Or if the cleaned domain still looks off.
  if (cleanAuthDomain.includes("[") || cleanAuthDomain.includes("(") || cleanAuthDomain.includes("]") || cleanAuthDomain.includes(" ") || cleanAuthDomain.includes("/") || (cleanAuthDomain.includes(":") && !cleanAuthDomain.match(/^\w+:\/\//) && !cleanAuthDomain.match(/^localhost:\d+$/) ) ) {
    // The colon check is tricky; allow localhost with port but not other colons unless part of a protocol (which should have been stripped).
    console.warn(
        `WARNING: Your NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ("${rawAuthDomain}") resulted in a cleaned domain "${cleanAuthDomain}" that might still be malformed. ` +
        `Firebase expects a clean hostname (e.g., your-project-id.firebaseapp.com). ` +
        `If authentication fails with 'auth/configuration-not-found' or 'auth/unauthorized-domain', please carefully verify this value in your .env file.`
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
// console.log("Attempting to initialize Firebase with config:", JSON.stringify(firebaseConfig, null, 2));

// Initialize Firebase
let app;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("CRITICAL Firebase Initialization Error:", error);
    console.error("Firebase config used:", JSON.stringify(firebaseConfig, null, 2));
    // Handle or throw error appropriately if app cannot be initialized
  }
} else {
  app = getApp(); // Use getApp() if already initialized
}

const auth = getAuth(app);

// Initialize Analytics only on the client side
let analytics;
if (typeof window !== 'undefined' && app) { // check app is initialized
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(err => {
    console.error("Error checking Firebase Analytics support:", err);
  });
}

export { app, auth, analytics };

