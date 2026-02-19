import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyC_aES8Eg2pweGJMJ1A325rJapqk4SlQ9Y",
    authDomain: "elite-2037e.firebaseapp.com",
    projectId: "elite-2037e",
    storageBucket: "elite-2037e.firebasestorage.app",
    messagingSenderId: "417508742431",
    appId: "1:417508742431:web:8cf5d161e1449aa33c0c2a",
    measurementId: "G-M2G2EYB7S0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged };
