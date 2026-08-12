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

// ---------------------------------------------------------------------------
// MobileSelect: a compact, fully-styled replacement for native <select>.
//
// Native <select> hands option styling entirely to the browser/OS — on
// mobile that means large, uncontrollable row heights and font sizes (this
// is what made the Company Account / Bank Name lists look oversized).
// This component renders its own list instead, so every row's font size
// and padding is ours to control, while still being 100% viewport-safe:
// it's a `fixed` overlay with a hard `max-h` and its own internal scroll,
// so it can never push content off-screen the way an absolutely-positioned
// dropdown anchored under a button can.
// ---------------------------------------------------------------------------
interface SelectOption {
  value: string;
  label: string;
}

interface MobileSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder: string;
  searchable?: boolean;
  triggerClassName: string;
}

function MobileSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  searchable = false,
  triggerClassName,
}: MobileSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // Lock background scroll while the sheet is open, so dragging the list
  // on a touch device doesn't also scroll the page underneath it.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const filtered =
    searchable && query.trim()
      ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
      : options;

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        <span className="truncate">{selectedLabel || placeholder}</span>
        <span className="text-slate-400 text-xs flex-shrink-0 ml-2">▼</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white w-full sm:max-w-sm sm:mx-4 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[75vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
              <h4 className="text-sm font-bold text-slate-800">{label}</h4>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-600 w-7 h-7 flex items-center justify-center flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {searchable && (
              <div className="p-3 border-b border-slate-100 flex-shrink-0">
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-base focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>
            )}

            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <p className="p-4 text-xs text-slate-400 text-center">No matches found.</p>
              ) : (
                filtered.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm border-b border-slate-50 last:border-none transition ${
                      opt.value === value
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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

  const accountOptions: SelectOption[] = OUR_COMPANY_ACCOUNTS.map((a) => ({
    value: a.label,
    label: a.label,
  }));

  const bankOptions: SelectOption[] = SRI_LANKAN_BANKS.map((b) => ({
    value: b.name,
    label: b.name,
  }));

  return (
    <div className="relative w-full">
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
          {/* CHEQUE TYPE — a 2-way toggle instead of a dropdown. With only
              two possible values, a picker of any kind is unnecessary
              interaction overhead, and a segmented control is naturally
              compact on mobile with zero overflow risk. */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Cheque Type
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleInputChange('chequeType', 'INWARD')}
                className={`py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                  isInward ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                Inward
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('chequeType', 'OUTWARD')}
                className={`py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition ${
                  !isInward ? 'bg-white text-amber-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                Outward
              </button>
            </div>
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
              className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none font-mono text-base sm:text-sm shadow-2xs transition block"
            />
          </div>

          {/* COMPANY ACCOUNT — custom compact picker */}
          <div className="col-span-1 sm:col-span-2">
            <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              {isInward ? 'Target Deposit Account (Our Bank Account)' : 'Source Issuing Account (Which of Our Accounts Issued This Cheque)'}
            </label>
            <MobileSelect
              label={isInward ? 'Select Target Deposit Account' : 'Select Issuing Bank Account'}
              value={formData.ourCompanyAccount}
              onChange={(val) => handleInputChange('ourCompanyAccount', val)}
              options={accountOptions}
              placeholder={isInward ? '-- Select Our Target Deposit Account --' : '-- Select Our Issuing Bank Account --'}
              triggerClassName={`w-full p-2.5 border rounded-xl text-base sm:text-sm font-semibold text-left flex items-center justify-between shadow-2xs transition outline-none ${
                isInward ? 'border-emerald-200 bg-emerald-50/20 text-emerald-900' : 'border-orange-200 bg-orange-50/20 text-orange-900'
              }`}
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              {isInward
                ? 'Select the internal account where this received cheque will be deposited.'
                : 'Select our company account from which money will be debited.'}
            </p>
          </div>

          {/* BANK NAME — custom compact, searchable picker (24 banks) */}
          <div>
            <label className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              {isInward ? 'Drawn Bank Name' : 'Issuing Bank Name'}
            </label>
            <MobileSelect
              label="Select Bank"
              value={formData.bankName}
              onChange={(val) => handleInputChange('bankName', val)}
              options={bankOptions}
              placeholder="-- Select Local Bank --"
              searchable
              triggerClassName="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 text-base sm:text-sm bg-white font-medium text-left flex items-center justify-between shadow-2xs transition focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            />
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
              className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-base sm:text-sm shadow-2xs transition block"
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
              className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-base sm:text-sm shadow-2xs transition block"
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
              className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-base sm:text-sm shadow-2xs transition block"
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
              className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-base sm:text-sm shadow-2xl block"
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
            className="w-full p-2.5 border border-slate-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-base sm:text-sm shadow-2xs transition block"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold p-3 sm:p-3.5 rounded-xl transition duration-200 disabled:bg-slate-400 flex items-center justify-center space-x-2 shadow-md hover:shadow-lg text-sm cursor-pointer"
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