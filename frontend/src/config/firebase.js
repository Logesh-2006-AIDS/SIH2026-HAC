import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// CRIMENEXUS AI Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBBB_MsSl7pQsJujJGQaASjj32djBq8n8M",
  authDomain: "sih2026-55f59.firebaseapp.com",
  projectId: "sih2026-55f59",
  storageBucket: "sih2026-55f59.firebasestorage.app",
  messagingSenderId: "859172269187",
  appId: "1:859172269187:web:8d8f01d2b29edfcfc43fb6",
  measurementId: "G-FZ6XNN3Q4L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
