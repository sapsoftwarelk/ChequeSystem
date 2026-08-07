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

  // Human-readable summary of whatever filters produced this result set —
  // this is what turns the printout into a self-contained audit record
  // instead of a bare table (a reviewer six months from now needs to know
  // exactly what scope this report covers without asking the person who ran it).
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
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-6xl mx-auto space-y-6 print:shadow-none print:border-none print:p-0 print:max-w-none">
      {/*
        Print isolation: by default `window.print()` prints the ENTIRE page —
        header, dashboard stats, the cheque entry form, the cheque list table,
        everything — because those all live outside this component's own DOM
        tree, so scattered `print:hidden` classes inside ChequeReport can't
        reach them.

        The fix: hide every single element on the page during print, then
        explicitly re-reveal only the `.printable-audit-report` subtree (and
        pull it out of normal flow so it isn't left in whatever empty space
        the rest of the now-invisible page used to occupy). This is a global
        stylesheet, so it reaches outside this component regardless of what
        else is rendered on the page around it.
      */}
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

      <div className="flex justify-between items-center border-b pb-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Audit Search & Report Engine</h2>
          <p className="text-xs text-gray-500">
            Filter ledger records by date range, company account, issuing bank, or transaction classification.
          </p>
        </div>
        {searched && reportData.length > 0 && (
          <button
            onClick={handlePrint}
            type="button"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded shadow transition cursor-pointer"
          >
            🖨️ Print Report
          </button>
        )}
      </div>

      {/* FILTER CONTROLS - HIDDEN WHEN PRINTING */}
      <form onSubmit={fetchReport} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 print:hidden">
        <div>
          <label htmlFor="startDate" className="block text-xs font-semibold text-gray-700">Start Date</label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="endDate" className="block text-xs font-semibold text-gray-700">End Date</label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="accountFilter" className="block text-xs font-semibold text-gray-700">Our Company Account</label>
          <select
            id="accountFilter"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="">All Company Accounts</option>
            {OUR_COMPANY_ACCOUNTS.map((account) => (
              <option key={account.id} value={account.label}>
                {account.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="typeFilter" className="block text-xs font-semibold text-gray-700">Cheque Type</label>
          <select
            id="typeFilter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
          >
            <option value="ALL">All Types</option>
            <option value="INWARD">Received (Inward)</option>
            <option value="OUTWARD">Issued (Outward)</option>
          </select>
        </div>

        <div>
          <label htmlFor="bankFilter" className="block text-xs font-semibold text-gray-700">Search Bank / Party</label>
          <input
            id="bankFilter"
            type="text"
            placeholder="e.g. Commercial Bank"
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="w-full mt-1 p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2 md:col-span-3 lg:col-span-5 flex justify-end space-x-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded shadow disabled:bg-slate-400 transition cursor-pointer"
          >
            {loading ? 'Searching Ledger...' : 'Generate Audit Report'}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded print:hidden">
          {errorMsg}
        </div>
      )}

      {/* REPORT DATA RESULTS */}
      {searched && (
        <div className="space-y-4">
          {/* Screen-only summary bar — intentionally left OUTSIDE
              printable-audit-report, so it's hidden by the global print
              rule along with the rest of the page chrome. The print
              version gets its own letterhead below instead. */}
          <div className="flex justify-between items-center text-sm font-medium text-gray-700 border-b pb-2 print:hidden">
            <span>Records Found: <strong>{reportData.length}</strong></span>
            <span>Total Value: <strong className="text-emerald-700">LKR {calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
          </div>

          {reportData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No matching cheque records found for the selected parameters.</p>
          ) : (
            <div className="printable-audit-report">
              {/* PRINT-ONLY LETTERHEAD — lives inside printable-audit-report
                  so it's one of the only things that survives the print
                  hide-everything rule. This is what makes the printed page
                  read as a standalone audit document (title, generation
                  timestamp, and the exact filter scope applied) rather than
                  a bare table. */}
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

              <div className="overflow-x-auto">
                <table className="audit-report-table w-full text-left border-collapse text-xs print:text-[10px]">
                  <thead>
                    <tr className="bg-slate-100 border-b text-slate-700 print:bg-slate-50">
                      <th className="p-2 border font-bold print:text-[9px] print:uppercase print:tracking-wide">#</th>
                      <th className="p-2 border font-bold print:text-[9px] print:uppercase print:tracking-wide">Cheque No</th>
                      <th className="p-2 border font-bold print:text-[9px] print:uppercase print:tracking-wide">Type</th>
                      <th className="p-2 border font-bold print:text-[9px] print:uppercase print:tracking-wide">Company Account</th>
                      <th className="p-2 border font-bold print:text-[9px] print:uppercase print:tracking-wide">Bank &amp; Branch</th>
                      <th className="p-2 border font-bold print:text-[9px] print:uppercase print:tracking-wide">Party Name</th>
                      <th className="p-2 border font-bold print:text-[9px] print:uppercase print:tracking-wide">Cheque Date</th>
                      <th className="p-2 border font-bold print:text-[9px] print:uppercase print:tracking-wide">Status</th>
                      <th className="p-2 border font-bold text-right print:text-[9px] print:uppercase print:tracking-wide">Amount (LKR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((item, idx) => (
                      <tr key={item.id} className="border-b hover:bg-slate-50 print:hover:bg-transparent">
                        <td className="p-2 border text-gray-400 print:text-slate-500">{idx + 1}</td>
                        <td className="p-2 border font-mono font-semibold text-slate-800">{item.chequeNo}</td>
                        <td className="p-2 border">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold print:px-0 print:py-0 print:rounded-none print:bg-transparent print:font-bold ${
                            item.chequeType === 'INWARD' ? 'bg-emerald-100 text-emerald-800 print:text-emerald-800' : 'bg-amber-100 text-amber-800 print:text-amber-800'
                          }`}>
                            {item.chequeType}
                          </span>
                        </td>
                        <td className="p-2 border text-gray-600 max-w-xs truncate print:max-w-none print:whitespace-normal" title={item.ourAccount}>
                          {item.ourAccount || 'N/A'}
                        </td>
                        <td className="p-2 border">{item.bankName} {item.branchName ? `(${item.branchName})` : ''}</td>
                        <td className="p-2 border">{item.partyName}</td>
                        <td className="p-2 border whitespace-nowrap">{formatDate(item.chequeDate)}</td>
                        <td className="p-2 border whitespace-nowrap text-[10px] font-semibold print:text-[9px]">
                          {getStatusLabel(item.status)}
                        </td>
                        <td className="p-2 border text-right font-mono font-semibold">
                          {Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {/* Break-down subtotals — small addition, but for an accounting
                        audience "inward vs outward totals" is the number people
                        actually reach for, not just the grand total. */}
                    <tr className="bg-slate-50 text-slate-600 print:bg-transparent">
                      <td colSpan={8} className="p-2 border text-right text-[10px] print:text-[9px]">
                        Inward Subtotal ({reportData.filter((r) => r.chequeType === 'INWARD').length} records):
                      </td>
                      <td className="p-2 border text-right font-mono text-[10px] print:text-[9px]">
                        {calculateTypeTotal('INWARD').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 text-slate-600 print:bg-transparent">
                      <td colSpan={8} className="p-2 border text-right text-[10px] print:text-[9px]">
                        Outward Subtotal ({reportData.filter((r) => r.chequeType === 'OUTWARD').length} records):
                      </td>
                      <td className="p-2 border text-right font-mono text-[10px] print:text-[9px]">
                        {calculateTypeTotal('OUTWARD').toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    <tr className="bg-slate-200 font-bold">
                      <td colSpan={8} className="p-2 border text-right">TOTAL SUMMARY:</td>
                      <td className="p-2 border text-right font-mono text-emerald-800">
                        LKR {calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* PRINT-ONLY SIGN-OFF BLOCK — an audit ledger printed for filing or
                  handover needs somewhere for a human to actually sign it. */}
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
