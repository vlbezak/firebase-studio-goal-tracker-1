"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analytics = exports.db = exports.auth = exports.app = void 0;
var app_1 = require("firebase/app");
var auth_1 = require("firebase/auth");
var analytics_1 = require("firebase/analytics"); // Import isSupported
var firestore_1 = require("firebase/firestore");
var firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};
// Initialize Firebase
var app;
if (!(0, app_1.getApps)().length) {
    try {
        exports.app = app = (0, app_1.initializeApp)(firebaseConfig);
    }
    catch (error) {
        console.error("CRITICAL Firebase Initialization Error:", error);
        console.error("Firebase config used:", JSON.stringify(firebaseConfig, null, 2));
        // Handle or throw error appropriately if app cannot be initialized
    }
}
else {
    exports.app = app = (0, app_1.getApp)(); // Use getApp() if already initialized
}
var auth = (0, auth_1.getAuth)(app);
exports.auth = auth;
var db = (0, firestore_1.getFirestore)(app); // Initialize Firestore with the app instance
exports.db = db;
// Initialize Analytics only on the client side
var analytics;
if (typeof window !== 'undefined' && app) { // check app is initialized
    (0, analytics_1.isSupported)().then(function (supported) {
        if (supported) {
            exports.analytics = analytics = (0, analytics_1.getAnalytics)(app);
        }
    }).catch(function (err) {
        console.error("Error checking Firebase Analytics support:", err);
    });
}
