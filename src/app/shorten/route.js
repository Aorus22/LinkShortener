import { NextResponse } from "next/server";
import { setDoc, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import db from '@/lib/firebase'

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (_) {
    return false;
  }
};

export async function POST(req){

  const { originalUrl, expiryDays, customId, useCustom } = await req.json();

  if (expiryDays < 1 || expiryDays > 30) {
    return NextResponse.json({ error: 'Invalid expiry days' }, { status: 400 });
  }

  if (!isValidUrl(originalUrl)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    let shortCode = useCustom ? customId : nanoid(6);

    if (useCustom) {
      const docRef = doc(db, 'links', customId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const now = new Date();

        if (data.expiresAt.toDate() < now) {
          await deleteDoc(docRef);
        } else {
          return NextResponse.json({ error: 'Custom ID is already taken' }, { status: 409 });
        }
      }
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (expiryDays || 1));

    const docRef = doc(db, 'links', shortCode);
    await setDoc(docRef, {
      originalUrl,
      shortCode,
      expiresAt,
      createdAt: new Date()
    });

    const origin = req.headers.get('origin') || '';
    const newLink = {
      id: docRef.id,
      shortUrl: `${origin}/${shortCode}`,
      originalUrl,
      expiresAt
    };

    return NextResponse.json(newLink, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}