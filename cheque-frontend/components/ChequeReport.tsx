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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-6xl mx-auto space-y-6 print:shadow-none print:border-none print:p-0">
      <div className="flex justify-between items-center border-b pb-4 print:border-b-2 print:border-black">
        <div>
          <h2 className="text-xl font-bold text-gray-800 print:text-2xl">Audit Search & Report Engine</h2>
          <p className="text-xs text-gray-500 print:text-black">
            Filter ledger records by date range, company account, issuing bank, or transaction classification.
          </p>
        </div>
        {searched && reportData.length > 0 && (
          <button
            onClick={handlePrint}
            type="button"
            className="hidden print:hidden sm:inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded shadow transition cursor-pointer"
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
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded">
          {errorMsg}
        </div>
      )}

      {/* REPORT DATA RESULTS TABLE */}
      {searched && (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm font-medium text-gray-700 border-b pb-2">
            <span>Records Found: <strong>{reportData.length}</strong></span>
            <span>Total Value: <strong className="text-emerald-700">LKR {calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></span>
          </div>

          {reportData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No matching cheque records found for the selected parameters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b text-slate-700">
                    <th className="p-2 border font-bold">Cheque No</th>
                    <th className="p-2 border font-bold">Type</th>
                    <th className="p-2 border font-bold">Company Account</th>
                    <th className="p-2 border font-bold">Bank & Branch</th>
                    <th className="p-2 border font-bold">Party Name</th>
                    <th className="p-2 border font-bold">Cheque Date</th>
                    <th className="p-2 border font-bold text-right">Amount (LKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-slate-50">
                      <td className="p-2 border font-mono font-semibold text-slate-800">{item.chequeNo}</td>
                      <td className="p-2 border">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          item.chequeType === 'INWARD' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {item.chequeType}
                        </span>
                      </td>
                      <td className="p-2 border text-gray-600 max-w-xs truncate" title={item.ourAccount}>
                        {item.ourAccount || 'N/A'}
                      </td>
                      <td className="p-2 border">{item.bankName} {item.branchName ? `(${item.branchName})` : ''}</td>
                      <td className="p-2 border">{item.partyName}</td>
                      <td className="p-2 border whitespace-nowrap">{item.chequeDate}</td>
                      <td className="p-2 border text-right font-mono font-semibold">
                        {Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-200 font-bold">
                    <td colSpan={6} className="p-2 border text-right">TOTAL SUMMARY:</td>
                    <td className="p-2 border text-right font-mono text-emerald-800">
                      LKR {calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
