'use client';

import React, { useState } from 'react';
import { getApiBaseUrl } from '@/app/config';

interface Cheque {
  id: number;
  chequeType: 'INWARD' | 'OUTWARD';
  chequeNo: string;
  bankName: string;
  partyName: string;
  chequeDate: string;
  status: string;
  amount: string;
  ourAccount?: string;
}

export default function ChequeReport() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reportRecords, setReportRecords] = useState<Cheque[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safe Date Formatter to avoid timezone off-by-one shifts
  const formatDateSafe = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const cleanDate = dateStr.split('T')[0];
    const [year, month, day] = cleanDate.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  const summary = reportRecords.reduce(
    (acc, chq) => {
      const amt = parseFloat(chq.amount) || 0;
      if (chq.chequeType === 'INWARD') acc.totalInward += amt;
      if (chq.chequeType === 'OUTWARD') acc.totalOutward += amt;
      return acc;
    },
    { totalInward: 0, totalOutward: 0 }
  );

  const fetchReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setLoading(true);
    setError(null);

    try {
      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/cheques/report/filter?startDate=${startDate}&endDate=${endDate}&status=${statusFilter}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: Failed to generate report`);
      }

      const data = await response.json();
      setReportRecords(data);
      setHasGenerated(true);
    } catch (err) {
      console.error('Error generating report summaries:', err);
      setError('Unable to fetch report records. Please verify the date range and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'REALISED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'BOUNCED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'DEPOSITED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  return (
    <>
      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-audit-area,
          #printable-audit-area * {
            visibility: visible;
          }
          #printable-audit-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 16px;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
        {/* Input Parameters Form */}
        <div className="space-y-4 no-print">
          <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
            Financial Registry Report Engine
          </h2>

          <form onSubmit={fetchReport} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Status Classification
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">ALL STATUSES</option>
                <option value="PENDING">PENDING</option>
                <option value="DEPOSITED">DEPOSITED</option>
                <option value="REALISED">REALISED</option>
                <option value="BOUNCED">BOUNCED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold p-2 text-sm rounded transition cursor-pointer shadow-sm disabled:opacity-50"
            >
              {loading ? 'Fetching Records...' : 'Generate Report'}
            </button>
          </form>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Report Output Section */}
        {hasGenerated && (
          <div className="mt-8 border-t pt-6">
            <div className="flex justify-end mb-4 no-print">
              <button
                type="button"
                onClick={handleNativePrint}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 text-xs rounded transition shadow-md flex items-center space-x-1 cursor-pointer"
              >
                <span>🖨️ Print Statement</span>
              </button>
            </div>

            <div id="printable-audit-area" className="space-y-6">
              {/* Report Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-800 pb-4">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                    Cheque Valuation Audit Statement
                  </h1>
                  <p className="text-xs text-gray-500 mt-1">
                    Statement Period:{' '}
                    <span className="font-bold text-slate-800">{formatDateSafe(startDate)}</span> to{' '}
                    <span className="font-bold text-slate-800">{formatDateSafe(endDate)}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Filter Parameter Scope:{' '}
                    <span className="font-bold uppercase text-blue-600">{statusFilter}</span>
                  </p>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-emerald-50/40 p-4 border border-emerald-100 rounded-lg shadow-sm">
                  <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    Aggregate Inward (Received Value)
                  </div>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    Rs. {summary.totalInward.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="bg-rose-50/40 p-4 border border-rose-100 rounded-lg shadow-sm">
                  <div className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                    Aggregate Outward (Issued Drawn Value)
                  </div>
                  <div className="text-2xl font-black text-rose-700 mt-1">
                    Rs. {summary.totalOutward.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                <table className="w-full text-left text-xs text-gray-700 border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-slate-800 font-bold uppercase tracking-wider">
                      <th className="p-3">Maturity Date</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Cheque No</th>
                      <th className="p-3">Our Corporate Account</th>
                      <th className="p-3">Associated Bank</th>
                      <th className="p-3">Counterparty / Entity</th>
                      <th className="p-3">Current Status</th>
                      <th className="p-3 text-right">Settlement Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {reportRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-400 italic font-medium">
                          No records match the requested auditing bounds.
                        </td>
                      </tr>
                    ) : (
                      reportRecords.map((chq) => {
                        const parsedAmt = parseFloat(chq.amount) || 0;
                        return (
                          <tr key={chq.id} className="hover:bg-gray-50/80 transition">
                            <td className="p-3 whitespace-nowrap text-gray-600 font-medium">
                              {formatDateSafe(chq.chequeDate)}
                            </td>
                            <td className="p-3 font-bold">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  chq.chequeType === 'INWARD'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : 'bg-orange-50 text-orange-600 border border-orange-200'
                                }`}
                              >
                                {chq.chequeType}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-slate-900">{chq.chequeNo}</td>
                            <td className="p-3 max-w-[200px] break-words">
                              {chq.ourAccount ? (
                                <span
                                  className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] block truncate text-slate-600"
                                  title={chq.ourAccount}
                                >
                                  {chq.ourAccount}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic text-[11px]">Unlinked</span>
                              )}
                            </td>
                            <td className="p-3 text-gray-600">{chq.bankName}</td>
                            <td className="p-3 text-gray-800 font-medium truncate max-w-[140px]">
                              {chq.partyName}
                            </td>
                            <td className="p-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeColor(
                                  chq.status
                                )}`}
                              >
                                {chq.status}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-black text-slate-900">
                              Rs. {parsedAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Print Signatures */}
              <div className="hidden print:flex justify-between pt-16 text-xs text-slate-700">
                <div className="text-center border-t border-dashed border-slate-400 w-44 pt-2">
                  Prepared By / Accountant
                </div>
                <div className="text-center border-t border-dashed border-slate-400 w-44 pt-2">
                  Audited / Certified By
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}