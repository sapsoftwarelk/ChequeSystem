'use client';

import React, { useMemo } from 'react';
import { Cheque } from '@/types';

interface DashboardStatsProps {
  cheques: Cheque[];
}

// Pre-instantiated formatter for high-performance string formatting
const lkrFormatter = new Intl.NumberFormat('en-LK', {
  style: 'currency',
  currency: 'LKR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function DashboardStats({ cheques }: DashboardStatsProps) {
  // Compute all metrics in a single O(N) loop
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

    const round2 = (val: number) => Math.round(val * 100) / 100;

    return {
      inward: {
        totalCount: inwardTotalCount,
        totalAmount: round2(inwardTotalAmount),
        pendingCount: inwardPendingCount,
        pendingAmount: round2(inwardPendingAmount),
        clearedCount: inwardClearedCount,
        clearedAmount: round2(inwardClearedAmount),
      },
      outward: {
        totalCount: outwardTotalCount,
        totalAmount: round2(outwardTotalAmount),
        pendingCount: outwardPendingCount,
        pendingAmount: round2(outwardPendingAmount),
        clearedCount: outwardClearedCount,
        clearedAmount: round2(outwardClearedAmount),
      },
      bouncedCount,
    };
  }, [cheques]);

  const formatLKR = (amount: number) => lkrFormatter.format(amount);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* BOUNCED SUMMARY ALERT BANNER */}
      {metrics.bouncedCount > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200 p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-rose-950 shadow-sm backdrop-blur-sm">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />
          <div className="flex items-center space-x-3 min-w-0 pl-1">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-600 flex-shrink-0 shadow-inner">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-rose-900 tracking-tight">Attention Required: Bounced Cheques Flagged</h4>
              <p className="text-[11px] text-rose-700/80">Immediate review needed for recent transaction exceptions.</p>
            </div>
          </div>
          <span className="text-xs font-bold bg-rose-600 text-white px-3.5 py-1.5 rounded-xl shadow-sm whitespace-nowrap">
            {metrics.bouncedCount} Record{metrics.bouncedCount > 1 ? 's' : ''} Flagged
          </span>
        </div>
      )}

      {/* INWARD CHEQUES SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10 flex-shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              Inward Cheques <span className="text-slate-400 font-normal normal-case ml-1">(Received)</span>
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          <StatCard
            label="Total Inward"
            count={`${metrics.inward.totalCount} Cheques`}
            amount={formatLKR(metrics.inward.totalAmount)}
            variant="emerald"
            icon="📥"
          />
          <StatCard
            label="Pending / Deposited"
            count={metrics.inward.pendingCount}
            amount={formatLKR(metrics.inward.pendingAmount)}
            variant="amber"
            icon="⏳"
          />
          <StatCard
            label="Realised / Cleared"
            count={metrics.inward.clearedCount}
            amount={formatLKR(metrics.inward.clearedAmount)}
            variant="neutral-emerald"
            icon="✅"
          />
        </div>
      </section>

      {/* OUTWARD CHEQUES SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-orange-500/10 flex-shrink-0" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              Outward Cheques <span className="text-slate-400 font-normal normal-case ml-1">(Issued)</span>
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          <StatCard
            label="Total Outward"
            count={`${metrics.outward.totalCount} Cheques`}
            amount={formatLKR(metrics.outward.totalAmount)}
            variant="orange"
            icon="📤"
          />
          <StatCard
            label="Pending Clearance"
            count={metrics.outward.pendingCount}
            amount={formatLKR(metrics.outward.pendingAmount)}
            variant="amber"
            icon="⏳"
          />
          <StatCard
            label="Realised / Debited"
            count={metrics.outward.clearedCount}
            amount={formatLKR(metrics.outward.clearedAmount)}
            variant="neutral-slate"
            icon="🏦"
          />
        </div>
      </section>
    </div>
  );
}

// Reusable Metric Card Sub-Component
interface StatCardProps {
  label: string;
  count: number | string;
  amount: string;
  variant: 'emerald' | 'amber' | 'orange' | 'neutral-emerald' | 'neutral-slate';
  icon: string;
}

function StatCard({ label, count, amount, variant, icon }: StatCardProps) {
  const styles = {
    emerald: {
      card: 'bg-gradient-to-br from-emerald-50/90 via-white to-emerald-100/40 border-emerald-200/80 shadow-emerald-900/5',
      label: 'text-emerald-900',
      badge: 'bg-emerald-200/90 text-emerald-950 shadow-xs',
      amount: 'text-emerald-950',
      iconBg: 'bg-emerald-100/80 text-emerald-700',
    },
    amber: {
      card: 'bg-gradient-to-br from-amber-50/90 via-white to-amber-100/40 border-amber-200/80 shadow-amber-900/5',
      label: 'text-amber-900',
      badge: 'bg-amber-200/90 text-amber-950 shadow-xs',
      amount: 'text-amber-950',
      iconBg: 'bg-amber-100/80 text-amber-700',
    },
    orange: {
      card: 'bg-gradient-to-br from-orange-50/90 via-white to-orange-100/40 border-orange-200/80 shadow-orange-900/5',
      label: 'text-orange-900',
      badge: 'bg-orange-200/90 text-orange-950 shadow-xs',
      amount: 'text-orange-950',
      iconBg: 'bg-orange-100/80 text-orange-700',
    },
    'neutral-emerald': {
      card: 'bg-gradient-to-br from-white via-slate-50/50 to-slate-100/40 border-slate-200/80 shadow-slate-900/5',
      label: 'text-slate-600',
      badge: 'bg-slate-200/70 text-slate-800 shadow-xs',
      amount: 'text-emerald-700',
      iconBg: 'bg-slate-100 text-slate-700',
    },
    'neutral-slate': {
      card: 'bg-gradient-to-br from-white via-slate-50/50 to-slate-100/40 border-slate-200/80 shadow-slate-900/5',
      label: 'text-slate-600',
      badge: 'bg-slate-200/70 text-slate-800 shadow-xs',
      amount: 'text-slate-900',
      iconBg: 'bg-slate-100 text-slate-700',
    },
  }[variant];

  return (
    <div className={`${styles.card} p-4 sm:p-5 rounded-2xl border shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 min-w-0 flex flex-col justify-between`}>
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs flex-shrink-0 ${styles.iconBg} shadow-inner`}>
            {icon}
          </span>
          <span className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate ${styles.label}`}>
            {label}
          </span>
        </div>
        <span className={`text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full font-bold flex-shrink-0 whitespace-nowrap ${styles.badge}`}>
          {count}
        </span>
      </div>
      <div className="mt-3 sm:mt-4">
        <p className={`text-xl sm:text-2xl font-black tracking-tight break-words ${styles.amount}`}>
          {amount}
        </p>
      </div>
    </div>
  );
}