import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';
import db from '@/lib/firebase'

export async function GET(req, { params }) {
  const { shortCode } = params;

  try {
    const docRef = doc(db, 'links', shortCode);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const { originalUrl, expiresAt } = docSnap.data();

      if (expiresAt.toDate() < new Date()) {
        await deleteDoc(docRef);
        return NextResponse.json({ error: 'Link not found' }, { status: 404 });
      }

      return NextResponse.redirect(originalUrl, 302);
    } else {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}