'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  // Dropdown open/close state management
  const [openDropdown, setOpenDropdown] = useState<'type' | 'account' | 'bank' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (frontPreview) URL.revokeObjectURL(frontPreview);
      if (backPreview) URL.revokeObjectURL(backPreview);
    };
  }, [frontPreview, backPreview]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setOpenDropdown(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
    <div className="relative w-full" ref={dropdownRef}>
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          className={`fixed bottom-5 right-5 z-50 flex items-center px-4 py-3 rounded-xl shadow-2xl text-white border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
            toast.type === 'success' ? 'bg-emerald-600/95 border-emerald-500' : 'bg-rose-600/95 border-rose-500'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <span aria-hidden="true" className="text-base">{toast.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-semibold text-xs sm:text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-2xl mx-auto space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">Add New Cheque Entry</h2>
            <p className="text-xs text-slate-500 mt-0.5">Record incoming or outgoing payment instruments securely.</p>
          </div>
          {loading && (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full animate-pulse flex items-center space-x-1 w-fit" aria-live="polite">
              <span>Syncing...</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {/* CUSTOM DROPDOWN: CHEQUE TYPE */}
          <div className="relative">
            <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Cheque Type</label>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}
              className="w-full p-2.5 pr-8 border border-slate-200 rounded-xl text-slate-700 text-xs sm:text-sm bg-white font-medium shadow-2xs text-left truncate flex items-center justify-between transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <span className="truncate">{formData.chequeType === 'INWARD' ? 'Received (Inward)' : 'Issued (Outward - Our Cheque)'}</span>
              <span className="text-slate-400 text-xs">▼</span>
            </button>
            {openDropdown === 'type' && (
              <div className="absolute z-30 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                <div
                  onClick={() => handleInputChange('chequeType', 'INWARD')}
                  className="p-2.5 text-xs sm:text-sm hover:bg-slate-50 cursor-pointer text-slate-700 font-medium border-b border-slate-100"
                >
                  Received (Inward)
                </div>
                <div
                  onClick={() => handleInputChange('chequeType', 'OUTWARD')}
                  className="p-2.5 text-xs sm:text-sm hover:bg-slate-50 cursor-pointer text-slate-700 font-medium"
                >
                  Issued (Outward - Our Cheque)
                </div>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="chequeNo" className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Cheque No</label>
            <input
              id="chequeNo"
              type="text"
              name="chequeNo"
              value={formData.chequeNo}
              onChange={handleTextChange}
              required
              placeholder="e.g. 102458"
              className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-mono text-xs sm:text-sm shadow-2xs transition block"
            />
          </div>

          {/* CUSTOM DROPDOWN: COMPANY ACCOUNT */}
          <div className="col-span-1 sm:col-span-2 relative">
            <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              {isInward ? 'Target Deposit Account (Our Bank Account)' : 'Source Issuing Account (Which of Our Accounts Issued This Cheque)'}
            </label>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'account' ? null : 'account')}
              className={`w-full p-2.5 pr-8 border rounded-xl text-xs sm:text-sm font-semibold text-left truncate flex items-center justify-between transition shadow-2xs outline-none ${
                isInward ? 'border-emerald-200 bg-emerald-50/20 text-emerald-900' : 'border-orange-200 bg-orange-50/20 text-orange-900'
              }`}
            >
              <span className="truncate">
                {formData.ourCompanyAccount || (isInward ? '-- Select Our Target Deposit Account --' : '-- Select Our Issuing Bank Account --')}
              </span>
              <span className="text-slate-400 text-xs">▼</span>
            </button>
            {openDropdown === 'account' && (
              <div className="absolute z-30 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                {OUR_COMPANY_ACCOUNTS.map((account) => (
                  <div
                    key={account.id}
                    onClick={() => handleInputChange('ourCompanyAccount', account.label)}
                    className="p-2.5 text-xs sm:text-sm hover:bg-slate-50 cursor-pointer text-slate-700 border-b border-slate-100 last:border-none truncate"
                  >
                    {account.label}
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-1.5">
              {isInward
                ? 'Select the internal account where this received cheque will be deposited.'
                : 'Select our company account from which money will be debited.'}
            </p>
          </div>

          {/* CUSTOM DROPDOWN: BANK NAME */}
          <div className="relative">
            <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              {isInward ? 'Drawn Bank Name' : 'Issuing Bank Name'}
            </label>
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'bank' ? null : 'bank')}
              className="w-full p-2.5 pr-8 border border-slate-200 rounded-xl text-slate-700 text-xs sm:text-sm bg-white font-medium shadow-2xs text-left truncate flex items-center justify-between transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              <span className="truncate">{formData.bankName || '-- Select Local Bank --'}</span>
              <span className="text-slate-400 text-xs">▼</span>
            </button>
            {openDropdown === 'bank' && (
              <div className="absolute z-30 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
                {SRI_LANKAN_BANKS.map((bank) => (
                  <div
                    key={bank.code}
                    onClick={() => handleInputChange('bankName', bank.name)}
                    className="p-2.5 text-xs sm:text-sm hover:bg-slate-50 cursor-pointer text-slate-700 border-b border-slate-100 last:border-none truncate"
                  >
                    {bank.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="branchName" className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Branch Name</label>
            <input
              id="branchName"
              type="text"
              name="branchName"
              value={formData.branchName}
              onChange={handleTextChange}
              placeholder="e.g. Veyangoda, Colombo 07"
              className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-xs sm:text-sm shadow-2xs transition block"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Amount (LKR)</label>
            <input
              id="amount"
              type="number"
              name="amount"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={handleTextChange}
              required
              placeholder="0.00"
              className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-xs sm:text-sm shadow-2xs transition block"
            />
          </div>

          <div>
            <label htmlFor="partyName" className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              {isInward ? 'Payer (Received From)' : 'Payee (Paid To)'}
            </label>
            <input
              id="partyName"
              type="text"
              name="partyName"
              value={formData.partyName}
              onChange={handleTextChange}
              required
              placeholder={isInward ? 'e.g. Customer / Vendor Name' : 'e.g. Supplier / Recipient Name'}
              className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-xs sm:text-sm shadow-2xs transition block"
            />
          </div>

          <div className="col-span-1 sm:col-span-2">
            <label htmlFor="chequeDate" className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Cheque Date</label>
            <input
              id="chequeDate"
              type="date"
              name="chequeDate"
              value={formData.chequeDate}
              onChange={handleTextChange}
              required
              className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-xs sm:text-sm shadow-2xl block"
            />
          </div>
        </div>

        {/* IMAGE ATTACHMENTS SECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <label htmlFor="imageFront" className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Front Image</label>
            <input
              id="imageFront"
              type="file"
              accept="image/*"
              key={`front-${fileInputKey}`}
              onChange={(e) => handleFileChange(e, 'front')}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer block"
            />
            {frontPreview && (
              <div className="mt-3 relative inline-block group">
                <Image
                  src={frontPreview}
                  alt="Cheque Front Preview"
                  width={192}
                  height={96}
                  unoptimized
                  className="w-44 h-22 object-cover rounded-lg border border-slate-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => clearImage('front')}
                  aria-label="Remove front image"
                  className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-rose-700 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <label htmlFor="imageBack" className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Back Image</label>
            <input
              id="imageBack"
              type="file"
              accept="image/*"
              key={`back-${fileInputKey}`}
              onChange={(e) => handleFileChange(e, 'back')}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer block"
            />
            {backPreview && (
              <div className="mt-3 relative inline-block group">
                <Image
                  src={backPreview}
                  alt="Cheque Back Preview"
                  width={192}
                  height={96}
                  unoptimized
                  className="w-44 h-22 object-cover rounded-lg border border-slate-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => clearImage('back')}
                  aria-label="Remove back image"
                  className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-rose-700 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Internal Remarks / Notes</label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleTextChange}
            rows={2}
            placeholder="Add relevant notes, invoice numbers, or ledger details..."
            className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-xs sm:text-sm shadow-2xs transition block"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-3 sm:p-3.5 rounded-xl transition duration-200 disabled:bg-slate-400 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg text-xs sm:text-sm cursor-pointer"
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