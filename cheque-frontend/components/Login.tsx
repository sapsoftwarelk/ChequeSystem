'use client';

import React, { useState } from 'react';

export default function Login({ onLoginSuccess }: { onLoginSuccess: (user: any, token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.user, data.access_token);
      } else {
        setError('Invalid username or password configuration.');
      }
    } catch (err) {
      setError('Cannot establish uplink connection to security engine.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">CHEQUE MANAGE MASTER</h2>
          <p className="text-xs text-gray-400 mt-1">Authorized Gateway Access Required</p>
        </div>

        {error && <div className="bg-rose-50 text-rose-600 text-xs font-bold p-3 rounded mb-4 border border-rose-100">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full mt-1 p-2.5 border rounded-md text-sm text-gray-800 focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full mt-1 p-2.5 border rounded-md text-sm text-gray-800 focus:ring-1 focus:ring-blue-500" />
          </div>
          <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-md text-sm shadow transition cursor-pointer">
            Sign In Securely
          </button>
        </form>
      </div>
    </div>
  );
}