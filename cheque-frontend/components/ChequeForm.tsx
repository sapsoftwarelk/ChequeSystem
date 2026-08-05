'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getApiBaseUrl } from '@/app/config';
import { OUR_COMPANY_ACCOUNTS } from '@/constants/bankAccounts';

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

export interface ChequeFormProps {
  onChequeAdded: () => void;
  token?: string | null;
}

export default function ChequeForm({ onChequeAdded, token }: ChequeFormProps) {
  const [formData, setFormData] = useState({
    chequeType: 'INWARD',
    chequeNo: '',
    bankName: '',
    branchName: '',
    amount: '',
    partyName: '',
    chequeDate: '',
    notes: '',
    ourCompanyAccount: '',
  });

  const [imageFront, setImageFront] = useState<File | null>(null);
  const [imageBack, setImageBack] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);
  const [fileInputKey, setFileInputKey] = useState<number>(Date.now());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    return () => {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      if (backPreview) URL.revokeObjectURL(backPreview);
    };
  }, [frontPreview, backPreview]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0] || null;
    if (side === 'front') {
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      setImageFront(file);
      setFrontPreview(file ? URL.createObjectURL(file) : null);
    } else {
      if (backPreview) URL.revokeObjectURL(backPreview);
      setImageBack(file);
      setBackPreview(file ? URL.createObjectURL(file) : null);
    }
  };

  const clearImage = (side: 'front' | 'back') => {
    if (side === 'front') {
      setImageFront(null);
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      setFrontPreview(null);
    } else {
      setImageBack(null);
      if (backPreview) URL.revokeObjectURL(backPreview);
      setBackPreview(null);
    }
    setFileInputKey(Date.now());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const uploadData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      uploadData.append(key, value.trim());
    });

    if (imageFront) uploadData.append('imageFront', imageFront);
    if (imageBack) uploadData.append('imageBack', imageBack);

    try {
      const baseUrl = getApiBaseUrl();
      const headers: HeadersInit = {};

      if (token) {
        headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      }

      const response = await fetch(`${baseUrl}/cheques/upload`, {
        method: 'POST',
        headers,
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
          ourCompanyAccount: '',
        });
        setImageFront(null);
        setImageBack(null);
        if (frontPreview) URL.revokeObjectURL(frontPreview);
        if (backPreview) URL.revokeObjectURL(backPreview);
        setFrontPreview(null);
        setBackPreview(null);
        setFileInputKey(Date.now());
        onChequeAdded();
      } else {
        const errorData = await response.json().catch(() => ({}));
        showNotification(errorData.message || 'Transmission rejected. Please verify form data accuracy.', 'error');
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
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className={`fixed bottom-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-xl text-white border transition-all duration-300 transform translate-y-0 ${
            toast.type === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-rose-600 border-rose-500'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span aria-hidden="true">{toast.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-semibold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md border border-gray-200 max-w-2xl mx-auto space-y-4">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2 flex items-center justify-between">
          <span>Add New Cheque Entry</span>
          {loading && (
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded animate-pulse" aria-live="polite">
              Syncing...
            </span>
          )}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="chequeType" className="block text-sm font-semibold text-gray-700">Cheque Type</label>
            <select
              id="chequeType"
              name="chequeType"
              value={formData.chequeType}
              onChange={handleInputChange}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm bg-white"
            >
              <option value="INWARD">Received (Inward)</option>
              <option value="OUTWARD">Issued (Outward - Our Cheque)</option>
            </select>
          </div>

          <div>
            <label htmlFor="chequeNo" className="block text-sm font-semibold text-gray-700">Cheque No</label>
            <input
              id="chequeNo"
              type="text"
              name="chequeNo"
              value={formData.chequeNo}
              onChange={handleInputChange}
              required
              placeholder="e.g. 102458"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono text-sm"
            />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label htmlFor="ourCompanyAccount" className="block text-sm font-semibold text-gray-700">
              {isInward ? 'Target Deposit Account (Our Bank Account)' : 'Source Issuing Account (Which of Our Accounts Issued This Cheque)'}
            </label>
            <select
              id="ourCompanyAccount"
              name="ourCompanyAccount"
              value={formData.ourCompanyAccount}
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
            <label htmlFor="bankName" className="block text-sm font-semibold text-gray-700">
              {isInward ? 'Drawn Bank Name' : 'Issuing Bank Name'}
            </label>
            <select
              id="bankName"
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm bg-white"
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
            <label htmlFor="branchName" className="block text-sm font-semibold text-gray-700">Branch Name</label>
            <input
              id="branchName"
              type="text"
              name="branchName"
              value={formData.branchName}
              onChange={handleInputChange}
              placeholder="e.g. Veyangoda, Colombo 07"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-gray-700">Amount (LKR)</label>
            <input
              id="amount"
              type="number"
              name="amount"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={handleInputChange}
              required
              placeholder="0.00"
              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div>
            <label htmlFor="partyName" className="block text-sm font-semibold text-gray-700">
              {isInward ? 'Payer (Received From)' : 'Payee (Paid To)'}
            </label>
            <input
              id="partyName"
              type="text"
              name="partyName"
              value={formData.partyName}
              onChange={handleInputChange}
              required
              placeholder={isInward ? 'e.g. Customer / Vendor Name' : 'e.g. Supplier / Recipient Name'}
              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label htmlFor="chequeDate" className="block text-sm font-semibold text-gray-700">Cheque Date</label>
            <input
              id="chequeDate"
              type="date"
              name="chequeDate"
              value={formData.chequeDate}
              onChange={handleInputChange}
              required
              className="w-full mt-1 p-2 border border-gray-300 rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
          <div>
            <label htmlFor="imageFront" className="block text-sm font-semibold text-gray-700">Front Image</label>
            <input
              id="imageFront"
              type="file"
              accept="image/*"
              key={`front-${fileInputKey}`}
              onChange={(e) => handleFileChange(e, 'front')}
              className="w-full text-xs mt-1 text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {frontPreview && (
              <div className="mt-2 relative inline-block group">
                <Image
                  src={frontPreview}
                  alt="Cheque Front Preview"
                  width={192}
                  height={96}
                  unoptimized
                  className="w-48 h-24 object-cover rounded border border-gray-300 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => clearImage('front')}
                  aria-label="Remove front image"
                  className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 text-xs shadow hover:bg-rose-700 transition"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="imageBack" className="block text-sm font-semibold text-gray-700">Back Image</label>
            <input
              id="imageBack"
              type="file"
              accept="image/*"
              key={`back-${fileInputKey}`}
              onChange={(e) => handleFileChange(e, 'back')}
              className="w-full text-xs mt-1 text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {backPreview && (
              <div className="mt-2 relative inline-block group">
                <Image
                  src={backPreview}
                  alt="Cheque Back Preview"
                  width={192}
                  height={96}
                  unoptimized
                  className="w-48 h-24 object-cover rounded border border-gray-300 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => clearImage('back')}
                  aria-label="Remove back image"
                  className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 text-xs shadow hover:bg-rose-700 transition"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-gray-700">Internal Remarks / Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={2}
            placeholder="Add relevant notes, invoice numbers, or ledger details..."
            className="w-full mt-1 p-2 border border-gray-300 rounded-md text-gray-700 focus:ring-1 focus:ring-blue-500 focus:outline-none text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold p-2.5 rounded-md transition duration-200 disabled:bg-slate-400 flex items-center justify-center space-x-2 shadow cursor-pointer"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Processing Ledger Records...</span>
            </>
          ) : (
            <span>Save Cheque Entry</span>
          )}
        </button>
      </form>
    </div>
  );
}
