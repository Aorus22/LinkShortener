import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

const firebaseConfig = {
  apiKey: "AIzaSyDzOxE6KUMv3C-Wmc0bdylLtzadxO6P-Tw",
  authDomain: "personal-project-fde5f.firebaseapp.com",
  projectId: "personal-project-fde5f",
  storageBucket: "personal-project-fde5f.appspot.com",
  messagingSenderId: "65244514551",
  appId: "1:65244514551:web:d0d99051003c1856282bf2",
  measurementId: "G-80F9TRE0Z3"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function GET(request, { params }) {
  const { shortCode } = params;

  try {
    const docRef = doc(db, 'links', shortCode);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { originalUrl, expiresAt } = docSnap.data();
      console.log('Document data:', { originalUrl, expiresAt });

      if (new Date(expiresAt) < new Date()) {
        return NextResponse.json({ error: 'Link expired' }, { status: 410 });
      }
      
      return NextResponse.redirect(originalUrl, 302);
    } else {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error in route handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}