'use client';

import React, { useState, useEffect } from 'react';
import ChequeForm from '@/components/ChequeForm';
import ChequeList from '@/components/ChequeList';
import ChequeReport from '@/components/ChequeReport'; 
import DashboardStats from '@/components/DashboardStats';
import Login from '@/components/Login'; // Import Login view wrapper

export default function Home() {
  const [cheques, setCheques] = useState([]);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string; role: 'ADMIN' | 'USER' } | null>(null);

  const fetchCheques = async () => {
    try {
      const response = await fetch('http://localhost:3000/cheques');
      if (response.ok) {
        const data = await response.json();
        setCheques(data);
      }
    } catch (error) {
      console.error('Error fetching cheques data:', error);
    }
  };

  useEffect(() => {
    if (token) fetchCheques();
  }, [token]);

  const handleLoginSuccess = (loggedInUser: any, userToken: string) => {
    setUser(loggedInUser);
    setToken(userToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
  };

  // 1. Guard check: If no authenticated profile session exists, present the login gateway
  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = user.role === 'ADMIN';

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* HEADER BAR */}
        <header className="flex justify-between items-center bg-slate-800 text-white p-5 rounded-lg shadow-md">
          <div>
            <h1 className="text-2xl font-black tracking-tight">CHEQUE MANAGE MASTER</h1>
            <p className="text-xs text-slate-400 mt-0.5">Welcome back, <span className="text-blue-400 font-bold uppercase">{user.username} ({user.role})</span></p>
          </div>
          <button onClick={handleLogout} className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3 py-1.5 rounded transition cursor-pointer">
            🚪 Log Out
          </button>
        </header>

        {/* FINANCIAL SUMMARY METRICS GRID */}
        <DashboardStats cheques={cheques} />

        {/* DYNAMIC REGISTRY INTERFACES WORKSPACE */}
        <div className="grid grid-cols-1 gap-6">
          {/* ADMIN ONLY: Add Cheque Entry Form */}
          {isAdmin ? (
            <ChequeForm onChequeAdded={fetchCheques} />
          ) : (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded font-semibold">
              🔒 Standard User profile constraints active. Entry logs collection additions are managed by System Admins.
            </div>
          )}
          
          {/* ADMIN ONLY: Audit Search & Print Engine */}
          {isAdmin && <ChequeReport />} 

          {/* BOTH ROLES VIEW: Passes role flag to limit editing drop-downs inside list */}
          <ChequeList cheques={cheques} onStatusUpdated={fetchCheques} isAdmin={isAdmin} />
        </div>

      </div>
    </main>
  );
}