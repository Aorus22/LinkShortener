"use client";

import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, setDoc, getDoc, doc } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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

export default function Home() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [expiryDays, setExpiryDays] = useState(1);
  const [customId, setCustomId] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [links, setLinks] = useState([]);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedLinks = localStorage.getItem('shortenedLinks');
    if (savedLinks) {
      const parsedLinks = JSON.parse(savedLinks);
      const validLinks = parsedLinks.filter(link => new Date(link.expiresAt) >= new Date());
      setLinks(validLinks);
      localStorage.setItem('shortenedLinks', JSON.stringify(validLinks));
    }
  }, []);

  const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch (_) {
      return false;
    }
  };

  const shortenUrl = async () => {
    if (!isValidUrl(originalUrl)) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    try {
      let shortCode = useCustom ? customId : nanoid(6);

      if (useCustom) {
        const docRef = doc(db, 'links', customId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setError('Custom ID is already taken');
          setLoading(false);
          return;
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

      const newLink = {
        id: docRef.id,
        shortUrl: `${window.location.origin}/${shortCode}`,
        originalUrl,
        expiresAt
      };

      setLinks([newLink, ...links]);
      localStorage.setItem('shortenedLinks', JSON.stringify([newLink, ...links]));
      setOriginalUrl('');
      setCustomId('');
      setExpiryDays(1);
      setUseCustom(false);
      setError('');
    } catch (e) {
      setError('Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    await navigator.clipboard.writeText(text);
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setOriginalUrl(text);
    } catch (err) {
      setError('Failed to paste from clipboard');
    }
  };

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} min-h-screen flex flex-col items-center p-6 transition-colors duration-300`}>
      {/* Dark/Light Mode Switch */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="relative w-16 h-8 bg-gray-600 rounded-full p-1 focus:outline-none"
        >
          <div
            className={`${isDarkMode ? 'translate-x-8 bg-purple-600' : 'translate-x-0 bg-yellow-400'} absolute top-1 w-6 h-6 rounded-full transition-transform duration-300 flex items-center justify-center`}
          >
            {isDarkMode ? (
              <span className="text-white">🌙</span>
            ) : (
              <span className="text-white">☀️</span>
            )}
          </div>
        </button>
      </div>

      <h1 className="text-5xl font-extrabold mb-8 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 bg-clip-text text-transparent animate-pulse tracking-tight">
        URL Shortener
        <span className={`block text-sm font-normal text-center mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Make your links short & sweet
        </span>
      </h1>

      <div className="w-full max-w-2xl mb-8 relative">
        <Input
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          type="url"
          placeholder="Paste your long URL here..."
          className={`${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} w-full text-lg px-6 py-4 pr-12 rounded-xl border-2 shadow-lg focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300`}
        />
        <button
          onClick={pasteFromClipboard}
          className={`absolute right-2 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
          title="Paste from clipboard"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
          </svg>
        </button>
      </div>

      {originalUrl && (
        <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} w-full max-w-xl transition-all duration-300`}>
          <CardContent className="p-6 space-y-4">
            {error && (
              <div className="text-red-400 text-sm font-medium">{error}</div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={useCustom}
                onCheckedChange={setUseCustom}
                className="text-purple-500"
              />
              <Label className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Use custom URL
              </Label>
            </div>

            {useCustom && (
              <div className="flex items-center space-x-2">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {window.location.hostname}/
                </span>
                <Input
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  placeholder="your-custom-id"
                  className={`${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-300'} flex-1`}
                />
              </div>
            )}

            <div>
              <Label className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                Expire after
              </Label>
              <Input
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
                type="number"
                min="1"
                className={isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-300'}
              />
            </div>

            <Button
              onClick={shortenUrl}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Shorten URL'}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="w-full max-w-xl mt-8 space-y-4">
        {links.map((link) => (
          <Card
            key={link.id}
            className={`${isDarkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-gray-300'} transition-all`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <a
                  href={link.shortUrl}
                  target="_blank"
                  className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
                >
                  {link.shortUrl}
                </a>
                <Button
                  variant="ghost"
                  onClick={() => copyToClipboard(link.shortUrl)}
                  className={isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'}
                >
                  Copy
                </Button>
              </div>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm mb-2 line-clamp-1`}>
                {link.originalUrl}
              </p>
              <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'} text-xs`}>
                Expires: {new Date(link.expiresAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}