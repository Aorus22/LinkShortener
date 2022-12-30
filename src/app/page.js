"use client";

import { useState, useEffect, use } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [expiryDays, setExpiryDays] = useState("");
  const [customId, setCustomId] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [links, setLinks] = useState([]);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(false);

  const [githubData, setGithubData] = useState({ login: '', avatar_url: '', html_url: '', name: '' });
  useEffect(() => {
    const fetchGithubData = async () => {
      try {
        const response = await fetch('https://api.github.com/users/Aorus22');
        const data = await response.json();
        setGithubData({
          login: data.login,
          avatar_url: data.avatar_url,
          html_url: data.html_url,
          name: data.name,
        });
      } catch (error) {
        console.error("Error fetching GitHub data:", error);
      }
    };

    fetchGithubData();
  }, []);

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

    const days = Number(expiryDays);
    if (isNaN(days) || days < 1 || days > 30) {
      setError('Invalid expiry days');
      return;
    }

    if (useCustom && !customId) {
      setError('Please enter a custom ID');
      return;
    }
    setError('')

    setLoading(true);
    try {
      const response = await fetch('/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl,
          expiryDays: days,
          customId,
          useCustom,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 409){
          throw new Error('Custom ID is already taken');
        }
        throw new Error("Failed to shorten URL");
      }

      const newLink = {
        id: data.id,
        shortUrl: data.shortUrl,
        originalUrl: data.originalUrl,
        expiresAt: data.expiresAt,
      };

      setLinks([newLink, ...links]);
      localStorage.setItem('shortenedLinks', JSON.stringify([newLink, ...links]));
      setOriginalUrl('');
      setCustomId('');
      setExpiryDays(1);
      setUseCustom(false);
      setError('');
    } catch (e) {
      setError(e.message);
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

      <h1 className="mt-10 text-5xl font-extrabold mb-8 bg-gradient-to-r from-purple-500 via-blue-500 to-pink-500 bg-clip-text text-transparent animate-pulse tracking-tight">
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
          className={`h-12 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} w-full text-lg px-6 py-4 pr-12 rounded-xl border-2 focus:ring-4 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300`}
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
                onChange={(e) => {
                  const value = e.target.value;
                  const number = Number(value);

                  if (number > 30) {
                    setExpiryDays("30");
                  } else {
                    setExpiryDays(value);
                  }
                }}
                type="number"
                min="1"
                max="30"
                placeholder="days"
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
                Expires: {new Date(link.expiresAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {githubData.avatar_url && (
        <div
          className={`cursor-pointer fixed bottom-4 right-4 flex items-center gap-3 ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white text-gray-900 border-gray-300'} border rounded-xl px-4 py-2 backdrop-blur-md transition-all`}
          onClick={() => window.open(githubData.html_url, '_blank')}
        >
          <div className="text-right leading-tight">
            <p className="text-sm font-semibold">
              {githubData.name}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Github @{githubData.login}</p>
          </div>
          <img
            src={githubData.avatar_url}
            alt="GitHub Profile"
            className="w-10 h-10 rounded-full border border-gray-300 dark:border-gray-600 object-cover shadow-sm"
          />
        </div>
      )}


    </div>
  );
}