'use client';

import React, { useState } from 'react';
import { getApiBaseUrl } from '@/app/config';
import { OUR_COMPANY_ACCOUNTS } from '@/constants/bankAccounts';

export interface ChequeReportProps {
  token?: string | null;
}

interface ChequeRecord {
  id: string;
  chequeType: 'INWARD' | 'OUTWARD';
  chequeNo: string;
  bankName: string;
  branchName?: string;
  amount: number | string;
  partyName: string;
  chequeDate: string;
  ourAccount?: string;
  notes?: string;
  status?: string;
  createdAt?: string;
}

const TYPE_LABELS: Record<string, string> = {
  ALL: 'All Types',
  INWARD: 'Received (Inward)',
  OUTWARD: 'Issued (Outward)',
};

export default function ChequeReport({ token }: ChequeReportProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [bankFilter, setBankFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [reportData, setReportData] = useState<ChequeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const fetchReport = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const baseUrl = getApiBaseUrl();
      const params = new URLSearchParams();

      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (accountFilter) params.append('ourAccount', accountFilter);
      if (bankFilter) params.append('bankName', bankFilter);
      if (typeFilter !== 'ALL') params.append('chequeType', typeFilter);

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      }

      const response = await fetch(`${baseUrl}/cheques/report?${params.toString()}`, {
        method: 'GET',
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(Array.isArray(data) ? data : data.records || []);
        setGeneratedAt(new Date());
      } else {
        const err = await response.json().catch(() => ({}));
        setErrorMsg(err.message || 'Failed to fetch audit report data.');
      }
    } catch (err) {
      console.error('Report fetch error:', err);
      setErrorMsg('Unable to connect to the backend database server.');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateTotal = () => {
    return reportData.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  };

  const calculateTypeTotal = (type: 'INWARD' | 'OUTWARD') => {
    return reportData
      .filter((r) => r.chequeType === type)
      .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  };

  const formatDate = (d?: string) => {
    if (!d) return '—';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusLabel = (status?: string) => (status || 'PENDING').toUpperCase();

  const activeFilterSummary = (): { label: string; value: string }[] => {
    const items: { label: string; value: string }[] = [];
    items.push({
      label: 'Date Range',
      value: startDate || endDate ? `${startDate ? formatDate(startDate) : 'Earliest'} — ${endDate ? formatDate(endDate) : 'Latest'}` : 'All dates',
    });
    items.push({ label: 'Company Account', value: accountFilter || 'All company accounts' });
    items.push({ label: 'Cheque Type', value: TYPE_LABELS[typeFilter] || 'All Types' });
    if (bankFilter) items.push({ label: 'Bank / Party Search', value: `"${bankFilter}"` });
    return items;
  };

  return (
    <div className="bg-white p-4 sm:p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-6xl mx-auto space-y-6 overflow-hidden print:shadow-none print:border-none print:p-0 print:max-w-none">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm 12mm;
          }
          html,
          body {
            background: #fff !important;
          }
          body * {
            visibility: hidden !important;
          }
          .printable-audit-report,
          .printable-audit-report * {
            visibility: visible !important;
          }
          .printable-audit-report {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          * {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .audit-report-table thead {
            display: table-header-group;
          }
          .audit-report-table tr {
            page-break-inside: avoid;
          }
          .audit-report-footer {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b border-slate-100 pb-4 print:hidden">
        <div>
          <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">Audit Search & Report Engine</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter ledger records by date range, company account, issuing bank, or transaction classification.
          </p>
        </div>
        {searched && reportData.length > 0 && (
          <button
            onClick={handlePrint}
            type="button"
            className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer space-x-1.5 w-full sm:w-auto print:hidden"
          >
            <span>🖨️</span>
            <span>Print Report</span>
          </button>
        )}
      </div>

      {/* FILTER CONTROLS - MOBILE RESPONSIVE GRID */}
      <form onSubmit={fetchReport} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 print:hidden bg-slate-50/60 p-4 sm:p-5 rounded-2xl border border-slate-100">
        <div className="relative">
          <label htmlFor="startDate" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Start Date</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none shadow-2xl block"
          />
        </div>

        <div className="relative">
          <label htmlFor="endDate" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">End Date</label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none shadow-2xl block"
          />
        </div>

        <div>
          <label htmlFor="accountFilter" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Our Company Account</label>
          <div className="relative">
            <select
              id="accountFilter"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full p-2.5 pr-8 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white shadow-2xs truncate appearance-none"
            >
              <option value="">All Company Accounts</option>
              {OUR_COMPANY_ACCOUNTS.map((account) => (
                <option key={account.id} value={account.label}>
                  {account.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500 text-xs">▼</div>
          </div>
        </div>

        <div>
          <label htmlFor="typeFilter" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Cheque Type</label>
          <div className="relative">
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full p-2.5 pr-8 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none bg-white shadow-2xs truncate appearance-none"
            >
              <option value="ALL">All Types</option>
              <option value="INWARD">Received (Inward)</option>
              <option value="OUTWARD">Issued (Outward)</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-500 text-xs">▼</div>
          </div>
        </div>

        <div>
          <label htmlFor="bankFilter" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">Search Bank / Party</label>
          <input
            id="bankFilter"
            type="text"
            placeholder="e.g. Commercial Bank"
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none shadow-2xs"
          />
        </div>

        <div className="sm:col-span-2 md:col-span-3 lg:col-span-5 flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md disabled:bg-slate-400 transition cursor-pointer"
          >
            {loading ? 'Searching Ledger...' : 'Generate Audit Report'}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl print:hidden">
          {errorMsg}
        </div>
      )}

      {/* REPORT DATA RESULTS */}
      {searched && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 text-xs sm:text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3 print:hidden">
            <span>Records Found: <strong className="text-slate-900">{reportData.length}</strong></span>
            <span>Total Value: <strong className="text-emerald-700 font-mono">LKR {calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
          </div>

          {reportData.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No matching cheque records found for the selected parameters.</p>
          ) : (
            <div className="printable-audit-report">
              {/* PRINT-ONLY LETTERHEAD */}
              <div className="hidden print:block mb-6">
                <div className="flex justify-between items-start border-b-4 border-double border-slate-800 pb-3">
                  <div>
                    <p className="text-[10px] tracking-[0.2em] text-slate-500 font-semibold uppercase">Cheque Manage Master</p>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">Cheque Audit Report</h1>
                  </div>
                  <div className="text-right text-[10px] text-slate-500 leading-relaxed">
                    <p>Generated: {generatedAt ? generatedAt.toLocaleString('en-GB') : '—'}</p>
                    <p>Records in scope: {reportData.length}</p>
                  </div>
                </div>

                <dl className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-[10px] text-slate-700">
                  {activeFilterSummary().map((item) => (
                    <div key={item.label} className="flex">
                      <dt className="font-semibold w-32 shrink-0 text-slate-500 uppercase tracking-wide">{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* MOBILE CARD VIEW (< 640px) - Eliminates horizontal table squishing */}
              <div className="block sm:hidden space-y-3 print:hidden">
                {reportData.map((item, index) => {
                  const isInward = item.chequeType === 'INWARD';
                  return (
                    <div key={item.id || index} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-slate-400">#{index + 1}</span>
                          <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.chequeNo}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700`}>
                            {getStatusLabel(item.status)}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full tracking-wider ${
                              isInward ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            }`}
                          >
                            {item.chequeType}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-400">Bank / Branch</span>
                          <span className="font-medium text-slate-700 truncate block">{item.bankName} {item.branchName ? `(${item.branchName})` : ''}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-slate-400">Cheque Date</span>
                          <span className="font-medium text-slate-700">{formatDate(item.chequeDate)}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="block text-[10px] uppercase font-bold text-slate-400">Party Name</span>
                          <span className="font-medium text-slate-800">{item.partyName || 'N/A'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="block text-[10px] uppercase font-bold text-slate-400">Company Account</span>
                          <span className="font-medium text-slate-600 truncate block text-[11px]">{item.ourAccount || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Amount</span>
                        <span className="text-sm font-black text-slate-900 font-mono">LKR {Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW (≥ 640px) & PRINT VIEW */}
              <div className="hidden sm:block print:block w-full overflow-x-auto rounded-xl border border-slate-200/80 shadow-2xs">
                <table className="audit-report-table w-full text-left border-collapse text-xs print:text-[10px] min-w-[750px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 print:bg-slate-50">
                      <th className="p-3 border-r border-slate-200 font-bold print:text-[9px] print:uppercase print:tracking-wide">#</th>
                      <th className="p-3 border-r border-slate-200 font-bold print:text-[9px] print:uppercase print:tracking-wide">Cheque No</th>
                      <th className="p-3 border-r border-slate-200 font-bold print:text-[9px] print:uppercase print:tracking-wide">Type</th>
                      <th className="p-3 border-r border-slate-200 font-bold print:text-[9px] print:uppercase print:tracking-wide">Company Account</th>
                      <th className="p-3 border-r border-slate-200 font-bold print:text-[9px] print:uppercase print:tracking-wide">Bank &amp; Branch</th>
                      <th className="p-3 border-r border-slate-200 font-bold print:text-[9px] print:uppercase print:tracking-wide">Party Name</th>
                      <th className="p-3 border-r border-slate-200 font-bold print:text-[9px] print:uppercase print:tracking-wide">Cheque Date</th>
                      <th className="p-3 border-r border-slate-200 font-bold print:text-[9px] print:uppercase print:tracking-wide">Status</th>
                      <th className="p-3 font-bold text-right print:text-[9px] print:uppercase print:tracking-wide">Amount (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors print:hover:bg-transparent">
                        <td className="p-3 border-r border-slate-100 text-slate-400 print:text-slate-500">{idx + 1}</td>
                        <td className="p-3 border-r border-slate-100 font-mono font-bold text-slate-800">{item.chequeNo}</td>
                        <td className="p-3 border-r border-slate-100">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold inline-block print:px-0 print:py-0 print:rounded-none print:bg-transparent print:font-bold ${
                            item.chequeType === 'INWARD' ? 'bg-emerald-50 text-emerald-700 print:text-emerald-800' : 'bg-amber-50 text-amber-700 print:text-amber-800'
                          }`}>
                            {item.chequeType}
                          </span>
                        </td>
                        <td className="p-3 border-r border-slate-100 text-slate-600 max-w-[180px] truncate print:max-w-none print:whitespace-normal" title={item.ourAccount}>
                          {item.ourAccount || 'N/A'}
                        </td>
                        <td className="p-3 border-r border-slate-100 text-slate-700">{item.bankName} {item.branchName ? `(${item.branchName})` : ''}</td>
                        <td className="p-3 border-r border-slate-100 text-slate-700 font-medium">{item.partyName}</td>
                        <td className="p-3 border-r border-slate-100 whitespace-nowrap text-slate-600">{formatDate(item.chequeDate)}</td>
                        <td className="p-3 border-r border-slate-100 whitespace-nowrap text-[10px] font-bold text-slate-700">
                          {getStatusLabel(item.status)}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">
                          {Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50/50 text-slate-600 print:bg-transparent">
                      <td colSpan={8} className="p-3 border-r border-t border-slate-200 text-right text-xs font-semibold print:text-[9px]">
                        Inward Subtotal ({reportData.filter((r) => r.chequeType === 'INWARD').length} records):
                      </td>
                      <td className="p-3 border-t border-slate-200 text-right font-mono text-xs font-semibold print:text-[9px]">
                        {calculateTypeTotal('INWARD').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/50 text-slate-600 print:bg-transparent">
                      <td colSpan={8} className="p-3 border-r border-slate-200 text-right text-xs font-semibold print:text-[9px]">
                        Outward Subtotal ({reportData.filter((r) => r.chequeType === 'OUTWARD').length} records):
                      </td>
                      <td className="p-3 text-right font-mono text-xs font-semibold print:text-[9px]">
                        {calculateTypeTotal('OUTWARD').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="bg-slate-900 text-white font-bold">
                      <td colSpan={8} className="p-3 border-r border-slate-800 text-right text-xs uppercase tracking-wider">Total Summary:</td>
                      <td className="p-3 text-right font-mono text-xs text-emerald-400">
                        LKR {calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* PRINT-ONLY SIGN-OFF BLOCK */}
              <div className="audit-report-footer hidden print:block mt-10 pt-4 border-t border-slate-300">
                <div className="grid grid-cols-3 gap-8 text-[10px] text-slate-600">
                  <div>
                    <div className="h-10 border-b border-slate-400" />
                    <p className="mt-1 font-semibold uppercase tracking-wide">Prepared By</p>
                  </div>
                  <div>
                    <div className="h-10 border-b border-slate-400" />
                    <p className="mt-1 font-semibold uppercase tracking-wide">Checked By</p>
                  </div>
                  <div>
                    <div className="h-10 border-b border-slate-400" />
                    <p className="mt-1 font-semibold uppercase tracking-wide">Approved By</p>
                  </div>
                </div>
                <p className="text-center text-[9px] text-slate-400 mt-6">
                  This document was system-generated by Cheque Manage Master and reflects ledger data at the time of generation.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}