export const firebaseConfig = {
  apiKey: "AIzaSyDS8rJsB1PgB3oxJ6X2XU2WcI0TpO8bryk",
  authDomain: "master-prompt-5cb85.firebaseapp.com",
  projectId: "master-prompt-5cb85",
  storageBucket: "master-prompt-5cb85.firebasestorage.app",
  messagingSenderId: "111755994926",
  appId: "1:111755994926:web:3f53e924aa92af1f7d7cbf",
  measurementId: "G-7MFDRXHHK0"
};

// Validate configuration
const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  console.error('Missing Firebase configuration:', missingKeys);
  throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`);
}
