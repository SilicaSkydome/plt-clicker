import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDhJUkYGTAJZGB04HmKKpLDDKWjbLMoHBU",
  authDomain: "plt-clicker.firebaseapp.com",
  projectId: "plt-clicker",
  storageBucket: "plt-clicker.firebasestorage.app",
  messagingSenderId: "883451980768",
  appId: "1:883451980768:web:4882760ea97f7026bad985",
  measurementId: "G-422NBVPW5V",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
