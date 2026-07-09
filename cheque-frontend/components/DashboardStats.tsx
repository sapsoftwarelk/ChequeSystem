'use client';

import React from 'react';

interface Cheque {
  id: number;
  chequeType: 'INWARD' | 'OUTWARD';
  amount: string;
  status: 'PENDING' | 'DEPOSITED' | 'REALISED' | 'BOUNCED' | 'CANCELLED';
}

export default function DashboardStats({ cheques }: { cheques: Cheque[] }) {
  const calculations = cheques.reduce(
    (acc, chq) => {
      const amt = parseFloat(chq.amount) || 0;
      
      if (chq.status === 'PENDING' || chq.status === 'DEPOSITED') {
        if (chq.chequeType === 'INWARD') acc.pendingInward += amt;
        if (chq.chequeType === 'OUTWARD') acc.pendingOutward += amt;
      }
      if (chq.status === 'REALISED') {
        if (chq.chequeType === 'INWARD') acc.realisedInward += amt;
        if (chq.chequeType === 'OUTWARD') acc.realisedOutward += amt;
      }
      if (chq.status === 'BOUNCED') {
        if (chq.chequeType === 'INWARD') acc.bouncedInward += amt;
        if (chq.chequeType === 'OUTWARD') acc.bouncedOutward += amt;
      }
      return acc;
    },
    { 
      pendingInward: 0, 
      pendingOutward: 0, 
      realisedInward: 0, 
      realisedOutward: 0, 
      bouncedInward: 0, 
      bouncedOutward: 0 
    }
  );

  const formatCurrency = (val: number) => {
    return 'Rs. ' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
      {/* 1. UNREALISED / OPEN COMMITMENTS CARD GRID */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between space-y-4">
        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 tracking-tight uppercase bg-slate-50 -mx-5 -mt-5 p-3 rounded-t-lg">
          ⏳ In-Flight Pipeline (Unrealised)
        </h3>
        <div className="space-y-3">
          <div className="border-l-4 border-amber-500 pl-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Receivable (Pending Inward)</div>
            <div className="text-lg font-black text-slate-800 mt-0.5">{formatCurrency(calculations.pendingInward)}</div>
          </div>
          <div className="border-l-4 border-blue-500 pl-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payable (Our Pending Outward)</div>
            <div className="text-lg font-black text-slate-800 mt-0.5">{formatCurrency(calculations.pendingOutward)}</div>
          </div>
        </div>
      </div>

      {/* 2. REALISED / CLEARED CASHFLOW SETTLEMENTS */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between space-y-4">
        <h3 className="text-sm font-bold text-emerald-800 border-b pb-2 tracking-tight uppercase bg-emerald-50/50 -mx-5 -mt-5 p-3 rounded-t-lg">
          ✅ Cleared Ledger Settlements
        </h3>
        <div className="space-y-3">
          <div className="border-l-4 border-emerald-500 pl-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Inward Realised (Cash Inflow)</div>
            <div className="text-lg font-black text-emerald-700 mt-0.5">{formatCurrency(calculations.realisedInward)}</div>
          </div>
          <div className="border-l-4 border-teal-600 pl-3">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Our Outward Realised (Cash Outflow)</div>
            <div className="text-lg font-black text-slate-700 mt-0.5">{formatCurrency(calculations.realisedOutward)}</div>
          </div>
        </div>
      </div>

      {/* 3. RETURNED EXPOSURES & LIABILITIES */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between space-y-4 md:col-span-2 lg:col-span-1">
        <h3 className="text-sm font-bold text-rose-800 border-b pb-2 tracking-tight uppercase bg-rose-50/50 -mx-5 -mt-5 p-3 rounded-t-lg">
          ⚠️ Transaction Failure Logs (Bounced)
        </h3>
        <div className="space-y-3">
          <div className="border-l-4 border-rose-500 pl-3">
            <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Client Bounced (Inward Deficit)</div>
            <div className="text-lg font-black text-rose-700 mt-0.5">{formatCurrency(calculations.bouncedInward)}</div>
          </div>
          <div className="border-l-4 border-purple-600 pl-3">
            <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Our Bounced (Outward Breach Risk)</div>
            <div className="text-lg font-black text-purple-700 mt-0.5">{formatCurrency(calculations.bouncedOutward)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}