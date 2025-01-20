import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyD96EWD8X72vD8h2W4Kv6ARpLTpValUMm0",
    authDomain: "bolt1-df5f6.firebaseapp.com",
    projectId: "bolt1-df5f6",
    storageBucket: "bolt1-df5f6.firebasestorage.app",
    messagingSenderId: "436032556148",
    appId: "1:436032556148:web:143738be6719b621789521"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);