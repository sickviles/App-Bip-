/**
 * Configuración e inicialización de Firebase y Cloud Firestore (src/firebase/config.ts)
 */
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAliwed4lqpS6FPK-ovajIdgnsaOQV2Zc",
  authDomain: "app-bip-40333.firebaseapp.com",
  projectId: "app-bip-40333",
  storageBucket: "app-bip-40333.firebasestorage.app",
  messagingSenderId: "182026363489",
  appId: "1:182026363489:web:3e26255ce68e8291538020",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
