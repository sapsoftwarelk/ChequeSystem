'use client';

import React, { useState } from 'react';

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

    try {
      const url = `http://localhost:3000/cheques/report/filter?startDate=${startDate}&endDate=${endDate}&status=${statusFilter}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setReportRecords(data);
        setHasGenerated(true);
      }
    } catch (error) {
      console.error('Error generating report summaries:', error);
    }
  };

  const triggerPrint = () => {
    const reportHtml = document.getElementById('printable-audit-area')?.innerHTML;
    if (!reportHtml) return;

    const printWindow = window.open('', '_blank', 'width=950,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cheque Valuation Audit Statement</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #333; }
            .print-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px; }
            .print-header h1 { margin: 0; font-size: 22px; text-transform: uppercase; color: #0f172a; font-weight: 800; }
            .print-header p { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
            .print-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .print-card { border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; background-color: #f8fafc; }
            .print-card-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #94a3b8; tracking: 0.5px; }
            .print-card-amount { font-size: 20px; font-weight: 800; margin-top: 4px; }
            .inward-txt { color: #047857; }
            .outward-txt { color: #be123c; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 11px; }
            th { border-bottom: 2px solid #cbd5e1; padding: 8px; text-align: left; font-weight: bold; color: #1e293b; text-transform: uppercase; font-size: 9px; background-color: #f1f5f9; }
            td { border-bottom: 1px solid #e2e8f0; padding: 8px; color: #334155; vertical-align: top; }
            .text-right { text-align: right; }
            .font-mono { font-family: monospace; font-weight: bold; }
            .account-badge { background-color: #f1f5f9; border: 1px solid #e2e8f0; padding: 2px 4px; border-radius: 4px; font-size: 10px; color: #475569; display: block; max-width: 220px; word-break: break-all; }
            .signatures { display: flex; justify-content: space-between; margin-top: 70px; font-size: 12px; }
            .sig-line { text-align: center; border-top: 1px dashed #94a3b8; width: 180px; padding-top: 6px; }
          </style>
        </head>
        <body>
          ${reportHtml}
          <div class="signatures">
            <div class="sig-line">Prepared By / Accountant</div>
            <div class="sig-line">Audited / Certified By</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          <\/script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6">
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Financial Registry Report Engine</h2>
        <form onSubmit={fetchReport} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required className="w-full p-2 border rounded text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required className="w-full p-2 border rounded text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Status Classification</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2 border rounded text-sm text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="ALL">ALL STATUSES</option>
              <option value="PENDING">PENDING</option>
              <option value="DEPOSITED">DEPOSITED</option>
              <option value="REALISED">REALISED</option>
              <option value="BOUNCED">BOUNCED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2 text-sm rounded transition cursor-pointer shadow-sm">
            Generate Report
          </button>
        </form>
      </div>

      {hasGenerated && (
        <div className="mt-8 border-t pt-6">
          <div className="flex justify-end mb-4">
            <button type="button" onClick={triggerPrint} className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-4 py-2 text-xs rounded transition shadow-md flex items-center space-x-1 cursor-pointer">
              <span>🖨️ Print Statement</span>
            </button>
          </div>

          <div id="printable-audit-area" className="space-y-6">
            <div className="print-header flex justify-between items-start border-b-2 border-slate-800 pb-4">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight uppercase">Cheque Valuation Audit Statement</h1>
                <p className="text-xs text-gray-500 mt-1">
                  Statement Period: <span className="font-bold text-slate-800">{new Date(startDate).toLocaleDateString()}</span> to <span className="font-bold text-slate-800">{new Date(endDate).toLocaleDateString()}</span>
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Filter Parameter Scope: <span className="font-bold uppercase text-blue-600">{statusFilter}</span></p>
              </div>
            </div>

            <div className="print-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="print-card bg-emerald-50/40 p-4 border border-emerald-100 rounded-lg shadow-sm">
                <div className="print-card-title text-xs font-bold text-emerald-600 uppercase tracking-wider">Aggregate Inward (Received Value)</div>
                <div className="print-card-amount inward-txt text-2xl font-black text-emerald-700 mt-1">Rs. {summary.totalInward.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div className="print-card bg-rose-50/40 p-4 border border-rose-100 rounded-lg shadow-sm">
                <div className="print-card-title text-xs font-bold text-rose-600 uppercase tracking-wider">Aggregate Outward (Issued Drawn Value)</div>
                <div className="print-card-amount outward-txt text-2xl font-black text-rose-700 mt-1">Rs. {summary.totalOutward.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>

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
                      <td colSpan={8} className="p-8 text-center text-gray-400 italic font-medium">No records match the requested auditing bounds.</td>
                    </tr>
                  ) : (
                    reportRecords.map((chq) => (
                      <tr key={chq.id} className="hover:bg-gray-50/80 transition">
                        <td className="p-3 whitespace-nowrap text-gray-600 font-medium">{new Date(chq.chequeDate).toLocaleDateString()}</td>
                        <td className="p-3 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${chq.chequeType === 'INWARD' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-600'}`}>{chq.chequeType}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">{chq.chequeNo}</td>
                        <td className="p-3 max-w-[200px]">
                          {chq.ourAccount ? (
                            <span className="account-badge bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] block truncate text-slate-600" title={chq.ourAccount}>
                              {chq.ourAccount}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-[11px]">Unlinked</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-600">{chq.bankName}</td>
                        <td className="p-3 text-gray-800 font-medium truncate max-w-[140px]">{chq.partyName}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            chq.status === 'REALISED' ? 'bg-emerald-100 text-emerald-800' :
                            chq.status === 'BOUNCED' ? 'bg-rose-100 text-rose-800' :
                            chq.status === 'DEPOSITED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}>{chq.status}</span>
                        </td>
                        <td className="p-3 text-right font-mono font-black text-slate-900">Rs. {parseFloat(chq.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}