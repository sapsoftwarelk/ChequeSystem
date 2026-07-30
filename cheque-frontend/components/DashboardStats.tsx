'use client';

import React, { useMemo } from 'react';
import { Cheque } from '@/types';

interface DashboardStatsProps {
  cheques: Cheque[];
}

export default function DashboardStats({ cheques }: DashboardStatsProps) {
  // Compute all metrics in a single loop for optimal performance
  const metrics = useMemo(() => {
    const parseAmount = (item: Cheque): number => {
      if (typeof item.amount === 'number') return item.amount;
      return parseFloat(item.amount || '0') || 0;
    };

    const isMatch = (val: string | undefined, target: string) =>
      val?.toUpperCase() === target.toUpperCase();

    const isCleared = (status?: string) => {
      const upper = status?.toUpperCase();
      return upper === 'REALISED' || upper === 'CLEARED';
    };

    let inwardTotalCount = 0;
    let inwardTotalAmount = 0;
    let inwardPendingCount = 0;
    let inwardPendingAmount = 0;
    let inwardClearedCount = 0;
    let inwardClearedAmount = 0;

    let outwardTotalCount = 0;
    let outwardTotalAmount = 0;
    let outwardPendingCount = 0;
    let outwardPendingAmount = 0;
    let outwardClearedCount = 0;
    let outwardClearedAmount = 0;

    let bouncedCount = 0;

    for (const c of cheques) {
      const amt = parseAmount(c);
      const isInward = isMatch(c.chequeType, 'INWARD');
      const isOutward = isMatch(c.chequeType, 'OUTWARD');

      if (isMatch(c.status, 'BOUNCED')) {
        bouncedCount++;
      }

      if (isInward) {
        inwardTotalCount++;
        inwardTotalAmount += amt;

        if (isMatch(c.status, 'PENDING') || isMatch(c.status, 'DEPOSITED')) {
          inwardPendingCount++;
          inwardPendingAmount += amt;
        } else if (isCleared(c.status)) {
          inwardClearedCount++;
          inwardClearedAmount += amt;
        }
      } else if (isOutward) {
        outwardTotalCount++;
        outwardTotalAmount += amt;

        if (isMatch(c.status, 'PENDING')) {
          outwardPendingCount++;
          outwardPendingAmount += amt;
        } else if (isCleared(c.status)) {
          outwardClearedCount++;
          outwardClearedAmount += amt;
        }
      }
    }

    return {
      inward: {
        totalCount: inwardTotalCount,
        totalAmount: inwardTotalAmount,
        pendingCount: inwardPendingCount,
        pendingAmount: inwardPendingAmount,
        clearedCount: inwardClearedCount,
        clearedAmount: inwardClearedAmount,
      },
      outward: {
        totalCount: outwardTotalCount,
        totalAmount: outwardTotalAmount,
        pendingCount: outwardPendingCount,
        pendingAmount: outwardPendingAmount,
        clearedCount: outwardClearedCount,
        clearedAmount: outwardClearedAmount,
      },
      bouncedCount,
    };
  }, [cheques]);

  const formatLKR = (amount: number) =>
    `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      {/* INWARD CHEQUES SECTION */}
      <section>
        <div className="flex items-center space-x-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Inward Cheques (Received)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Inward */}
          <div className="bg-gradient-to-br from-emerald-50/80 to-emerald-100/30 p-4 rounded-xl border border-emerald-200/80 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Total Inward
              </span>
              <span className="text-[11px] bg-emerald-200/80 text-emerald-900 px-2.5 py-0.5 rounded-full font-bold">
                {metrics.inward.totalCount} Cheques
              </span>
            </div>
            <p className="text-xl font-black text-emerald-950 mt-3 tracking-tight">
              {formatLKR(metrics.inward.totalAmount)}
            </p>
          </div>

          {/* Pending Inward */}
          <div className="bg-gradient-to-br from-amber-50/80 to-amber-100/30 p-4 rounded-xl border border-amber-200/80 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Pending / Deposited
              </span>
              <span className="text-[11px] bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                {metrics.inward.pendingCount}
              </span>
            </div>
            <p className="text-xl font-black text-amber-950 mt-3 tracking-tight">
              {formatLKR(metrics.inward.pendingAmount)}
            </p>
          </div>

          {/* Cleared Inward */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Realised / Cleared
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                {metrics.inward.clearedCount}
              </span>
            </div>
            <p className="text-xl font-black text-emerald-600 mt-3 tracking-tight">
              {formatLKR(metrics.inward.clearedAmount)}
            </p>
          </div>
        </div>
      </section>

      {/* OUTWARD CHEQUES SECTION */}
      <section>
        <div className="flex items-center space-x-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm shadow-orange-500/50" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Outward Cheques (Issued)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Total Outward */}
          <div className="bg-gradient-to-br from-orange-50/80 to-orange-100/30 p-4 rounded-xl border border-orange-200/80 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-orange-800 uppercase tracking-wider">
                Total Outward
              </span>
              <span className="text-[11px] bg-orange-200/80 text-orange-900 px-2.5 py-0.5 rounded-full font-bold">
                {metrics.outward.totalCount} Cheques
              </span>
            </div>
            <p className="text-xl font-black text-orange-950 mt-3 tracking-tight">
              {formatLKR(metrics.outward.totalAmount)}
            </p>
          </div>

          {/* Pending Outward */}
          <div className="bg-gradient-to-br from-amber-50/80 to-amber-100/30 p-4 rounded-xl border border-amber-200/80 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Pending Clearance
              </span>
              <span className="text-[11px] bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full font-bold">
                {metrics.outward.pendingCount}
              </span>
            </div>
            <p className="text-xl font-black text-amber-950 mt-3 tracking-tight">
              {formatLKR(metrics.outward.pendingAmount)}
            </p>
          </div>

          {/* Cleared Outward */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Realised / Debited
              </span>
              <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                {metrics.outward.clearedCount}
              </span>
            </div>
            <p className="text-xl font-black text-slate-800 mt-3 tracking-tight">
              {formatLKR(metrics.outward.clearedAmount)}
            </p>
          </div>
        </div>
      </section>

      {/* BOUNCED SUMMARY ALERT */}
      {metrics.bouncedCount > 0 && (
        <div className="bg-rose-50 border border-rose-200/80 p-3.5 rounded-xl flex items-center justify-between text-rose-900 shadow-sm">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-rose-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-bold">Bounced Cheques Flagged</span>
          </div>
          <span className="text-xs font-extrabold bg-rose-200/80 text-rose-950 px-3 py-1 rounded-full">
            {metrics.bouncedCount} Bounced Record{metrics.bouncedCount > 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}