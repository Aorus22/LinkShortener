import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = process.env.FIREBASE_CREDENTIALS
  ? JSON.parse(Buffer.from(process.env.FIREBASE_CREDENTIALS, 'base64').toString('utf-8'))
  : undefined;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default db;