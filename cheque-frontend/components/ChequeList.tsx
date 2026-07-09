'use client';

import React, { useState } from 'react';

interface Cheque {
  id: number;
  chequeType: 'INWARD' | 'OUTWARD';
  chequeNo: string;
  bankName: string;
  branchName?: string;
  amount: string;
  partyName: string;
  chequeDate: string;
  status: 'PENDING' | 'DEPOSITED' | 'REALISED' | 'BOUNCED' | 'CANCELLED';
  imageFrontPath: string | null;
  imageBackPath: string | null;
  notes?: string;
  ourAccount?: string;
}

const OUR_COMPANY_ACCOUNTS = [
  { id: 'smart_com_gampaha', label: 'Commercial Bank - Gampaha (1000576908) - SMART TECHNOLOGY' },
  { id: 'niro_boc_gampaha', label: 'Bank of Ceylon - Gampaha (0090311554) - J.W.M.D NIROSHANI' },
  { id: 'sap_boc_gampaha', label: 'Bank of Ceylon - Gampaha (0090900272) - SAP COMPUTERS (PVT) LTD' },
  { id: 'niro_sampath_super', label: 'Sampath Bank - Gampaha Super (121252154844) - J.W.M.D NIROSHANI' },
  { id: 'sap_sampath_yakkala', label: 'Sampath Bank - Yakkala (106814013791) - SAP COMPUTERS' },
  { id: 'niro_sampath_yakkala', label: 'Sampath Bank - Yakkala (106857000032) - J.W.M.D NIROSHANI' },
  { id: 'smart_boc_gampaha', label: 'Bank of Ceylon - Gampaha (95989405) - SMART TECHNOLOGY' },
];

export default function ChequeList({ cheques, onStatusUpdated, isAdmin }: { cheques: Cheque[], onStatusUpdated: () => void, isAdmin: boolean }) {
  const [editingCheque, setEditingCheque] = useState<Cheque | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; chequeNo: string } | null>(null);
  const [bounceModal, setBounceModal] = useState<{ id: number; status: string } | null>(null);
  const [bounceNotes, setBounceNotes] = useState('');

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const submitStatusChange = async (id: number, newStatus: string, notes?: string) => {
    if (!isAdmin) return;
    const realisingDate = newStatus === 'REALISED' ? new Date().toISOString().split('T')[0] : null;

    try {
      const res = await fetch(`http://localhost:3000/cheques/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, realisingDate, notes }),
      });
      if (res.ok) {
        showNotification(`Cheque status marked as ${newStatus} successfully.`);
        onStatusUpdated();
      } else {
        showNotification('Failed to update cheque status.', 'error');
      }
    } catch (err) { 
      showNotification('Server communication failure.', 'error');
    }
  };

  const handleStatusSelectChange = (id: number, currentStatus: string, selectedStatus: string) => {
    if (selectedStatus === currentStatus) return;
    if (selectedStatus === 'BOUNCED') {
      setBounceNotes('');
      setBounceModal({ id, status: selectedStatus });
    } else {
      submitStatusChange(id, selectedStatus);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete || !isAdmin) return;
    try {
      const response = await fetch(`http://localhost:3000/cheques/${confirmDelete.id}`, { method: 'DELETE' });
      if (response.ok) {
        showNotification('Cheque record completely removed from ledger.', 'info');
        setConfirmDelete(null);
        onStatusUpdated();
      }
    } catch (err) { 
      showNotification('Could not execute delete command.', 'error');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCheque || !isAdmin) return;

    try {
      const response = await fetch(`http://localhost:3000/cheques/${editingCheque.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCheque),
      });

      if (response.ok) {
        showNotification('Cheque metadata updated successfully.');
        setEditingCheque(null);
        onStatusUpdated();
      }
    } catch (err) {
      showNotification('Failed to preserve changes.', 'error');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mt-6 relative">
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white border transition-all duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 
          toast.type === 'error' ? 'bg-rose-600 border-rose-500' : 'bg-slate-700 border-slate-600'
        }`}>
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

      <h2 className="text-xl font-bold text-gray-800 mb-4">Cheque Registry Logs</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm text-gray-700">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200">
              <th className="p-3 font-semibold">Type</th>
              <th className="p-3 font-semibold">Cheque No</th>
              <th className="p-3 font-semibold">Our Linked Account</th>
              <th className="p-3 font-semibold">Bank</th>
              <th className="p-3 font-semibold">Party</th>
              <th className="p-3 font-semibold">Amount</th>
              <th className="p-3 font-semibold">Cheque Date</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-center">Images</th>
              {isAdmin ? <th className="p-3 font-semibold text-center">Actions</th> : null}
            </tr>
          </thead>
          <tbody>
            {cheques.map((chq) => (
              <tr key={chq.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${chq.chequeType === 'INWARD' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>{chq.chequeType}</span>
                </td>
                <td className="p-3 font-mono font-bold">{chq.chequeNo}</td>
                <td className="p-3 max-w-[200px] truncate text-xs font-medium text-slate-600">
                  {chq.ourAccount ? (
                    <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200 block truncate" title={chq.ourAccount}>
                      {chq.ourAccount}
                    </span>
                  ) : (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="p-3">{chq.bankName}</td>
                <td className="p-3 truncate max-w-[120px]">{chq.partyName}</td>
                <td className="p-3 font-bold">Rs. {parseFloat(chq.amount).toLocaleString('en-US')}</td>
                <td className="p-3">{new Date(chq.chequeDate).toLocaleDateString()}</td>
                <td className="p-3">
                  {isAdmin ? (
                    <select 
                      value={chq.status} 
                      onChange={(e) => handleStatusSelectChange(chq.id, chq.status, e.target.value)}
                      className={`p-1.5 border rounded text-xs font-semibold focus:outline-none bg-white ${
                        chq.status === 'REALISED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                        chq.status === 'BOUNCED' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                        chq.status === 'DEPOSITED' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                        chq.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600 border-gray-300' :
                        'bg-amber-50 text-amber-700 border-amber-300'
                      }`}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="DEPOSITED">DEPOSITED</option>
                      <option value="REALISED">REALISED</option>
                      <option value="BOUNCED">BOUNCED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  ) : (
                    <span className={`px-2.5 py-1 rounded text-xs font-bold tracking-wide border uppercase ${
                      chq.status === 'REALISED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      chq.status === 'BOUNCED' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                      chq.status === 'DEPOSITED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      chq.status === 'CANCELLED' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                      'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {chq.status}
                    </span>
                  )}
                </td>
                <td className="p-3 text-center space-x-2">
                  {chq.imageFrontPath && <a href={`http://localhost:3000${chq.imageFrontPath}`} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs font-bold hover:text-blue-800">Front</a>}
                  {chq.imageBackPath && <a href={`http://localhost:3000${chq.imageBackPath}`} target="_blank" rel="noreferrer" className="text-blue-600 underline text-xs font-bold hover:text-blue-800">Back</a>}
                </td>
                {isAdmin ? (
                  <td className="p-3">
                    <div className="flex items-center justify-center space-x-3">
                      <button onClick={() => {
                        const cleanDate = chq.chequeDate.split('T')[0];
                        setEditingCheque({ ...chq, chequeDate: cleanDate, ourAccount: chq.ourAccount || '' });
                      }} className="text-slate-600 hover:text-blue-600 text-xs font-bold">Edit</button>
                      <button onClick={() => setConfirmDelete({ id: chq.id, chequeNo: chq.chequeNo })} className="text-red-500 hover:text-red-700 text-xs font-bold">Delete</button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && editingCheque && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full shadow-2xl space-y-4 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Modify Cheque Record</h3>
            <form onSubmit={handleEditSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Cheque No</label>
                <input type="text" value={editingCheque.chequeNo} onChange={e => setEditingCheque({...editingCheque, chequeNo: e.target.value})} className="w-full p-2 border rounded text-sm text-gray-800" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  {editingCheque.chequeType === 'INWARD' ? 'Linked Deposit Account' : 'Linked Source Account'}
                </label>
                <select 
                  value={editingCheque.ourAccount || ''} 
                  onChange={e => setEditingCheque({...editingCheque, ourAccount: e.target.value})} 
                  className="w-full p-2 border rounded text-sm text-gray-800 bg-amber-50/50 border-amber-300 focus:outline-none"
                  required
                >
                  <option value="" disabled>-- Select Corporate Settlement Account --</option>
                  {OUR_COMPANY_ACCOUNTS.map((account) => (
                    <option key={account.id} value={account.label}>
                      {account.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Bank Name</label>
                <input type="text" value={editingCheque.bankName} onChange={e => setEditingCheque({...editingCheque, bankName: e.target.value})} className="w-full p-2 border rounded text-sm text-gray-800" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Party Name</label>
                <input type="text" value={editingCheque.partyName} onChange={e => setEditingCheque({...editingCheque, partyName: e.target.value})} className="w-full p-2 border rounded text-sm text-gray-800" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Amount</label>
                <input type="number" step="0.01" value={editingCheque.amount} onChange={e => setEditingCheque({...editingCheque, amount: e.target.value})} className="w-full p-2 border rounded text-sm text-gray-800" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Cheque Date</label>
                <input type="date" value={editingCheque.chequeDate} onChange={e => setEditingCheque({...editingCheque, chequeDate: e.target.value})} className="w-full p-2 border rounded text-sm text-gray-800" required />
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button type="button" onClick={() => setEditingCheque(null)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded">Discard</button>
                <button type="submit" className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded hover:bg-blue-700">Commit Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdmin && bounceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full shadow-2xl space-y-4 border border-red-100">
            <h3 className="text-base font-bold text-red-700 flex items-center">⚠️ Record Cheque Bounce Details</h3>
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Please provide reason specifications, return charges, or documentation notes regarding this transaction failure:</p>
              <textarea 
                rows={3} 
                value={bounceNotes} 
                onChange={(e) => setBounceNotes(e.target.value)}
                placeholder="e.g., Insufficient funds. Insured Rs. 2500 bounce fee."
                className="w-full p-2 border border-gray-300 rounded text-sm text-gray-800 focus:outline-none focus:border-red-500"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setBounceModal(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
                <button type="button" onClick={() => {
                  submitStatusChange(bounceModal.id, bounceModal.status, bounceNotes);
                  setBounceModal(null);
                }} className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded hover:bg-red-700">Flag as Bounced</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAdmin && confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full shadow-2xl space-y-4 border border-gray-100">
            <h3 className="text-base font-bold text-slate-800">Confirm Deletion</h3>
            <p className="text-xs text-gray-600">Are you sure you want to permanently erase cheque record <span className="font-mono font-bold text-slate-950">#{confirmDelete.chequeNo}</span>? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2 pt-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded">Cancel</button>
              <button type="button" onClick={executeDelete} className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded hover:bg-red-700">Confirm Erase</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}