import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDS8rJsB1PgB3oxJ6X2XU2WcI0TpO8bryk",
  authDomain: "master-prompt-5cb85.firebaseapp.com",
  projectId: "master-prompt-5cb85",
  storageBucket: "master-prompt-5cb85.firebasestorage.app",
  messagingSenderId: "111755994926",
  appId: "1:111755994926:web:3f53e924aa92af1f7d7cbf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
