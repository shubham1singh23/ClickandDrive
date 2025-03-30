// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAxmIy7bHJBdwiWaJx3jMy6S9xXhtvnUH4",
  authDomain: "clickndrivemnp.firebaseapp.com",
  projectId: "clickndrivemnp",
  storageBucket: "clickndrivemnp.firebasestorage.app",
  messagingSenderId: "22533146088",
  appId: "1:22533146088:web:084ae736e4dd296387d05d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

export default app;