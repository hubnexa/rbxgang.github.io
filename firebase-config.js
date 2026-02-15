import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAceW9Yh2jRfY3pCFawWCTzP4Hvngt1V8g",
  authDomain: "rbxgang-86d30.firebaseapp.com",
  projectId: "rbxgang-86d30",
  storageBucket: "rbxgang-86d30.firebasestorage.app",
  messagingSenderId: "35329039357",
  appId: "1:35329039357:web:2430fb26473ef1e9fd1794",
  measurementId: "G-JTFDFJ4GWP"
};

// Si no hay aplicaciones inicializadas, la creamos. Si ya hay una, usamos la existente.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);