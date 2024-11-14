// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBj7QZC69zrldTNhx65gyqxXlZqc0EgyzU',
  authDomain: 'travelquest-dd8d8.firebaseapp.com',
  projectId: 'travelquest-dd8d8',
  storageBucket: 'travelquest-dd8d8.firebasestorage.app',
  messagingSenderId: '674108070126',
  appId: '1:674108070126:web:e428b756092883536d7bff',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const firebaseAuth = getAuth(app);
