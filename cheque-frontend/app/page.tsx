'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ChequeForm from '@/components/ChequeForm';
import ChequeList from '@/components/ChequeList';
import ChequeReport from '@/components/ChequeReport';
import DashboardStats from '@/components/DashboardStats';
import Login from '@/components/Login';
import { Cheque, User } from '@/types';
import { getApiBaseUrl } from '@/app/config';

export default function Home() {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Real-time sync states
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Mark component as mounted to safely render client-only dates
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Rehydrate auth state from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('auth_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error reading auth state from localStorage:', error);
    } finally {
      setIsLoadingAuth(false);
    }
  }, []);

  // 2. Logout & clear storage
  const handleLogout = useCallback(() => {
    setUser(null);
    setToken(null);
    setCheques([]);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }, []);

  // 3. Fetch Cheques Data
  const fetchCheques = useCallback(
    async (isSilent = false) => {
      if (!token) return;
      try {
        if (!isSilent) setIsSyncing(true);

        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/cheques`, {
          headers: {
            Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const rawData = await response.json();

          // Robust extraction: Handle plain array [...] or wrapped object { data: [...] }
          const chequeArray: Cheque[] = Array.isArray(rawData)
            ? rawData
            : Array.isArray(rawData?.data)
            ? rawData.data
            : [];

          setCheques(chequeArray);
          setLastSynced(new Date());
        } else if (response.status === 401 || response.status === 403) {
          console.warn('Unauthorized or expired session. Logging out...');
          handleLogout();
        } else {
          console.error(`API response error status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching cheques data:', error);
      } finally {
        setIsSyncing(false);
      }
    },
    [token, handleLogout]
  );

  // 4. Periodic auto-polling (15s Interval)
  useEffect(() => {
    if (!token || isLoadingAuth) return;

    fetchCheques();

    const interval = setInterval(() => {
      fetchCheques(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [token, isLoadingAuth, fetchCheques]);

  // 5. Handle Login Success
  const handleLoginSuccess = (loggedInUser: User, userToken: string) => {
    setUser(loggedInUser);
    setToken(userToken);
    localStorage.setItem('auth_token', userToken);
    localStorage.setItem('auth_user', JSON.stringify(loggedInUser));
  };

  // Guard 1: Verify auth state before initial UI display
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-slate-600 font-semibold text-sm flex items-center space-x-2">
          <span className="h-3 w-3 bg-slate-600 rounded-full animate-ping" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  // Guard 2: Unauthenticated view
  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const isAdmin = user.role === 'ADMIN';

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER BAR */}
        <header className="flex justify-between items-center bg-slate-800 text-white p-5 rounded-2xl shadow-md">
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">CHEQUE MANAGE MASTER</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Welcome back,{' '}
              <span className="text-blue-400 font-bold uppercase">
                {user.username} ({user.role})
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition cursor-pointer"
          >
            🚪 Log Out
          </button>
        </header>

        {/* REAL-TIME SYNC BAR */}
        <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="text-xs text-slate-600 flex items-center space-x-2 font-medium">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'
              }`}
            />
            <span>
              {isSyncing
                ? 'Syncing ledger data...'
                : `Live Data Synced: ${
                    isMounted && lastSynced ? lastSynced.toLocaleTimeString() : 'Just now'
                  }`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchCheques()}
            disabled={isSyncing}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl shadow-sm disabled:opacity-50 transition cursor-pointer flex items-center space-x-1"
          >
            <span>{isSyncing ? '🔄 Syncing...' : '🔄 Refresh Data'}</span>
          </button>
        </div>

        {/* FINANCIAL SUMMARY METRICS GRID */}
        <DashboardStats cheques={cheques} />

        {/* --- DYNAMIC WORKSPACE GRID LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Entry Form Only (Span 4 Columns on Desktop) */}
          <div className="lg:col-span-4 lg:sticky lg:top-6">
            {isAdmin ? (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5">
                <ChequeForm onChequeAdded={() => fetchCheques()} token={token} />
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-4 rounded-2xl font-semibold shadow-sm">
                🔒 Standard User profile constraints active. Entry logs collection additions are managed by System Admins.
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Master Cheque List / Table (Span 8 Columns on Desktop) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
              <ChequeList
                cheques={cheques}
                onStatusUpdated={() => fetchCheques()}
                isAdmin={isAdmin}
                token={token}
              />
            </div>
          </div>

        </div>

        {/* --- FULL WIDTH SECTION: Audit Search & Report Engine --- */}
        {isAdmin && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
            <ChequeReport token={token} />
          </div>
        )}

      </div>
    </main>
  );
}