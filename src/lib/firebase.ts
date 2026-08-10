import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDS8rJsB1PgB3oxJ6X2XU2WcI0TpO8bryk",
  authDomain: "master-prompt-5cb85.firebaseapp.com",
  projectId: "master-prompt-5cb85",
  storageBucket: "master-prompt-5cb85.firebasestorage.app",
  messagingSenderId: "111755994926",
  appId: "1:111755994926:web:3f53e924aa92af1f7d7cbf",
  measurementId: "G-7MFDRXHHK0"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
