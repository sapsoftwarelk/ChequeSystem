'use client';

import React, { useState } from 'react';
import { getApiBaseUrl } from '@/app/config';

// Central Bank of Sri Lanka (CBSL) Cleared Major Operating Banks List
const SRI_LANKAN_BANKS = [
  { code: 'BOC', name: 'Bank of Ceylon' },
  { code: 'COM', name: 'Commercial Bank of Ceylon' },
  { code: 'HNB', name: 'Hatton National Bank' },
  { code: 'SAMP', name: 'Sampath Bank' },
  { code: 'PEOPLE', name: "People's Bank" },
  { code: 'NDB', name: 'National Development Bank (NDB)' },
  { code: 'DFCC', name: 'DFCC Bank' },
  { code: 'NTB', name: 'Nations Trust Bank (NTB)' },
  { code: 'SEY', name: 'Seylan Bank' },
  { code: 'PABC', name: 'Pan Asia Banking Corporation' },
  { code: 'UNION', name: 'Union Bank of Colombo' },
  { code: 'SMIB', name: 'State Mortgage & Investment Bank' },
  { code: 'NSB', name: 'National Savings Bank (NSB)' },
  { code: 'SANASA', name: 'SANASA Development Bank (SDB)' },
  { code: 'RDB', name: 'Regional Development Bank (RDB)' },
  { code: 'Amana', name: 'Amana Bank' },
  { code: 'HSBC', name: 'HSBC (Hongkong and Shanghai Banking Corporation)' },
  { code: 'SCB', name: 'Standard Chartered Bank' },
  { code: 'CB', name: 'Citi Bank N.A.' },
  { code: 'INDIAN', name: 'Indian Bank / Indian Overseas Bank' },
  { code: 'STATE_INDIA', name: 'State Bank of India' },
  { code: 'MCB', name: 'MCB Bank Limited' },
  { code: 'CARG', name: 'Cargills Bank' },
  { code: 'HABIB', name: 'Habib Bank Limited' },
].sort((a, b) => a.name.localeCompare(b.name));

// Official Company Bank Accounts
const OUR_COMPANY_ACCOUNTS = [
  { id: 'smart_com_gampaha', label: 'Commercial Bank - Gampaha (1000576908) - SMART TECHNOLOGY' },
  { id: 'niro_boc_gampaha', label: 'Bank of Ceylon - Gampaha (0090311554) - J.W.M.D NIROSHANI' },
  { id: 'sap_boc_gampaha', label: 'Bank of Ceylon - Gampaha (0090900272) - SAP COMPUTERS (PVT) LTD' },
  { id: 'niro_sampath_super', label: 'Sampath Bank - Gampaha Super (121252154844) - J.W.M.D NIROSHANI' },
  { id: 'sap_sampath_yakkala', label: 'Sampath Bank - Yakkala (106814013791) - SAP COMPUTERS' },
  { id: 'niro_sampath_yakkala', label: 'Sampath Bank - Yakkala (106857000032) - J.W.M.D NIROSHANI' },
  { id: 'smart_boc_gampaha', label: 'Bank of Ceylon - Gampaha (95989405) - SMART TECHNOLOGY' },
];

export default function ChequeForm({ onChequeAdded }: { onChequeAdded: () => void }) {
  const [formData, setFormData] = useState({
    chequeType: 'INWARD',
    chequeNo: '',
    bankName: '',
    branchName: '',
    amount: '',
    partyName: '',
    chequeDate: '',
    notes: '',
    ourAccount: '',
  });

  const [imageFront, setImageFront] = useState<File | null>(null);
  const [imageBack, setImageBack] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState<number>(Date.now());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const uploadData = new FormData();
    Object.entries(formData).forEach(([key, value]) => uploadData.append(key, value));
    if (imageFront) uploadData.append('imageFront', imageFront);
    if (imageBack) uploadData.append('imageBack', imageBack);

    try {
      // Dynamic API URL lookup at execution time
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/cheques/upload`, {
        method: 'POST',
        body: uploadData,
      });

      if (response.ok) {
        showNotification(`Cheque Entry #${formData.chequeNo} has been committed to the ledger.`);
        setFormData({
          chequeType: 'INWARD',
          chequeNo: '',
          bankName: '',
          branchName: '',
          amount: '',
          partyName: '',
          chequeDate: '',
          notes: '',
          ourAccount: '',
        });
        setImageFront(null);
        setImageBack(null);
        setFileInputKey(Date.now());
        onChequeAdded();
      } else {
        showNotification('Transmission rejected. Please verify form data accuracy.', 'error');
      }
    } catch (error) {
      console.error('Error uploading data:', error);
      showNotification('Unable to establish connection with core backend database engine.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isInward = formData.chequeType === 'INWARD';

  return (
    <div className="relative">
      {/* FLOATING SYSTEM TOAST ALERT */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-xl text-white border transition-all duration-300 transform translate-y-0 ${
            toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-rose-600 border-rose-500'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{toast.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-semibold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-2xl mx-auto space-y-4">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center justify-between">
          <span>Add New Cheque Entry</span>
          {loading && <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded animate-pulse">Syncing...</span>}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Cheque Type</label>
            <select
              name="chequeType"
              value={formData.chequeType}
              onChange={handleInputChange}
              className="w-full mt-1 p-2 border rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm bg-white"
            >
              <option value="INWARD">Received (Inward)</option>
              <option value="OUTWARD">Issued (Outward - Our Cheque)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Cheque No</label>
            <input
              type="text"
              name="chequeNo"
              value={formData.chequeNo}
              onChange={handleInputChange}
              required
              className="w-full mt-1 p-2 border rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-sm"
            />
          </div>

          {/* DYNAMIC OUR COMPANY BANK ACCOUNT DROPDOWN */}
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700">
              {isInward ? 'Target Deposit Account (Our Bank Account)' : 'Source Issuing Account (Which of Our Accounts Issued This Cheque)'}
            </label>
            <select
              name="ourAccount"
              value={formData.ourAccount}
              onChange={handleInputChange}
              required
              className={`w-full mt-1 p-2 border rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm font-medium ${
                isInward ? 'border-amber-300 bg-amber-50/30' : 'border-orange-300 bg-orange-50/30'
              }`}
            >
              <option value="" disabled>
                {isInward ? '-- Select Our Target Deposit Account --' : '-- Select Our Issuing Bank Account --'}
              </option>
              {OUR_COMPANY_ACCOUNTS.map((account) => (
                <option key={account.id} value={account.label}>
                  {account.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {isInward
                ? 'Select the internal account where this received cheque will be deposited.'
                : 'Select our company account from which money will be debited.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              {isInward ? 'Drawn Bank Name' : 'Issuing Bank Name'}
            </label>
            <select
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
              required
              className="w-full mt-1 p-2 border rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm bg-white"
            >
              <option value="" disabled>
                -- Select Local Bank --
              </option>
              {SRI_LANKAN_BANKS.map((bank) => (
                <option key={bank.code} value={bank.name}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Branch Name</label>
            <input
              type="text"
              name="branchName"
              value={formData.branchName}
              onChange={handleInputChange}
              placeholder="e.g. Veyangoda, Colombo 07"
              className="w-full mt-1 p-2 border rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">Amount (LKR)</label>
            <input
              type="number"
              name="amount"
              step="0.01"
              value={formData.amount}
              onChange={handleInputChange}
              required
              className="w-full mt-1 p-2 border rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700">
              {isInward ? 'Payer (Received From)' : 'Payee (Paid To)'}
            </label>
            <input
              type="text"
              name="partyName"
              value={formData.partyName}
              onChange={handleInputChange}
              required
              placeholder={isInward ? 'e.g. Customer / Vendor Name' : 'e.g. Supplier / Recipient Name'}
              className="w-full mt-1 p-2 border rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700">Cheque Date</label>
            <input
              type="date"
              name="chequeDate"
              value={formData.chequeDate}
              onChange={handleInputChange}
              required
              className="w-full mt-1 p-2 border rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700">Front Image</label>
            <input
              type="file"
              accept="image/*"
              key={`front-${fileInputKey}`}
              onChange={(e) => setImageFront(e.target.files?.[0] || null)}
              className="w-full text-xs mt-1 text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700">Back Image</label>
            <input
              type="file"
              accept="image/*"
              key={`back-${fileInputKey}`}
              onChange={(e) => setImageBack(e.target.files?.[0] || null)}
              className="w-full text-xs mt-1 text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700">Internal Remarks / Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={2}
            className="w-full mt-1 p-2 border rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold p-2.5 rounded-md transition duration-200 disabled:bg-slate-400 flex items-center justify-center space-x-2 shadow cursor-pointer"
        >
          <span>{loading ? 'Processing Ledger Records...' : 'Save Cheque Entry'}</span>
        </button>
      </form>
    </div>
  );
}