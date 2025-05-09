import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics"; // Import isSupported

// Attempt to sanitize the authDomain if it matches the malformed pattern from the error
let rawAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
let cleanAuthDomain = rawAuthDomain;

if (rawAuthDomain && rawAuthDomain.startsWith('[') && rawAuthDomain.includes('](')) {
  const match = rawAuthDomain.match(/^\[([^\]]+)\]\(http[s]?:\/\/\1\/?\)$/); // More specific match for "DOMAIN](PROTOCOL//DOMAIN/)"
  if (match && match[1]) {
    cleanAuthDomain = match[1];
    console.warn(
      `Sanitized NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN from "${rawAuthDomain}" to "${cleanAuthDomain}". ` +
      `Please ensure NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN in your .env file is set to a clean hostname (e.g., your-project-id.firebaseapp.com).`
    );
  } else {
    // Fallback for a slightly different pattern observed in the error log if the above doesn't match perfectly
    const genericMatch = rawAuthDomain.match(/^\[([^\]]+)\]\(.+\)$/);
    if (genericMatch && genericMatch[1]) {
        cleanAuthDomain = genericMatch[1];
        console.warn(
          `Sanitized NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN from "${rawAuthDomain}" to "${cleanAuthDomain}" using a generic pattern. ` +
          `Please ensure NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN in your .env file is set to a clean hostname (e.g., your-project-id.firebaseapp.com).`
        );
    } else {
        console.error(
          `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ("${rawAuthDomain}") appears malformed but could not be reliably sanitized. ` +
          `Firebase auth may fail. Please ensure it's a clean hostname in your .env file.`
        );
    }
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