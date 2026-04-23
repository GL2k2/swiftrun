import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyAZ_bruEO5OU2J8QE9jUfVpFYW17Xk5Qpk",
  authDomain: "swiftrun-a4124.firebaseapp.com",
  projectId: "swiftrun-a4124",
  storageBucket: "swiftrun-a4124.firebasestorage.app",
  messagingSenderId: "161225347224",
  appId: "1:161225347224:web:98964d927d7575e722c0ed",
  databaseURL: "https://swiftrun-a4124-default-rtdb.firebaseio.com" // URL estándar
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
