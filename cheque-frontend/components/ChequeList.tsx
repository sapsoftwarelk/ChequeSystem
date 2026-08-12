'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getApiBaseUrl } from '@/app/config';
import { OUR_COMPANY_ACCOUNTS } from '@/constants/bankAccounts';

export interface ChequeRecord {
  id: string | number;
  chequeType: 'INWARD' | 'OUTWARD';
  chequeNo: string;
  bankName: string;
  branchName?: string;
  amount: number | string;
  partyName: string;
  chequeDate: string;
  ourCompanyAccount?: string;
  ourAccount?: string;
  accountNumber?: string;
  notes?: string;
  status?: string;
  imageFrontUrl?: string;
  imageBackUrl?: string;
  imageFrontPath?: string | null;
  imageBackPath?: string | null;
}

export interface ChequeListProps {
  token?: string | null;
  refreshKey?: number;
  isAdmin?: boolean;
  cheques?: ChequeRecord[];
  onStatusUpdated?: () => void | Promise<void>;
}

// Builds a browser-accessible URL from a stored relative path like
// "/static-assets/imageFront-....jpg". Works whether baseUrl ends in
// "/api" or not.
const buildImageUrl = (baseUrl: string, path?: string | null): string | undefined => {
  if (!path) return undefined;
  const baseUrlWithoutApi = baseUrl.replace(/\/api\/?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrlWithoutApi}${cleanPath}`;
};

export default function ChequeList({
  token,
  refreshKey,
  isAdmin = true,
  cheques: propCheques,
  onStatusUpdated,
}: ChequeListProps) {
  const [internalCheques, setInternalCheques] = useState<ChequeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(!propCheques);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  const [editingCheque, setEditingCheque] = useState<ChequeRecord | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // New image files selected in the Edit modal (replaces the old URL text
  // field approach, which the backend never actually persisted).
  const [editImageFront, setEditImageFront] = useState<File | null>(null);
  const [editImageBack, setEditImageBack] = useState<File | null>(null);
  const [editFrontPreview, setEditFrontPreview] = useState<string | null>(null);
  const [editBackPreview, setEditBackPreview] = useState<string | null>(null);

  const [viewingImages, setViewingImages] = useState<{
    chequeNo: string;
    partyName: string;
    frontUrl?: string;
    backUrl?: string;
  } | null>(null);

  const activeCheques = propCheques ?? internalCheques;

  // Derive display-ready image URLs from whichever source is active
  // (props from the parent's own fetch, OR this component's internal fetch).
  const displayCheques = useMemo(() => {
    const baseUrl = getApiBaseUrl();
    return activeCheques.map((c) => ({
      ...c,
      imageFrontUrl: c.imageFrontUrl ?? buildImageUrl(baseUrl, c.imageFrontPath),
      imageBackUrl: c.imageBackUrl ?? buildImageUrl(baseUrl, c.imageBackPath),
    }));
  }, [activeCheques]);

  const getHeaders = useCallback((): HeadersInit => {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return headers;
  }, [token]);

  const fetchCheques = useCallback(async () => {
    if (onStatusUpdated) {
      await onStatusUpdated();
      return;
    }

    setLoading(true);
    setActionError(null);
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/cheques`, { headers: getHeaders() });

      if (response.ok) {
        const data = await response.json();
        const rawData = Array.isArray(data) ? data : data.cheques || [];

        const formattedData = rawData.map((c: any) => ({
          ...c,
          imageFrontUrl: buildImageUrl(baseUrl, c.imageFrontPath),
          imageBackUrl: buildImageUrl(baseUrl, c.imageBackPath),
        }));

        setInternalCheques(formattedData);
      } else {
        console.error('Failed to fetch cheques ledger data');
      }
    } catch (error) {
      console.error('Error fetching cheques:', error);
    } finally {
      setLoading(false);
    }
  }, [getHeaders, onStatusUpdated]);

  useEffect(() => {
    if (!propCheques) {
      fetchCheques();
    }
  }, [token, refreshKey, propCheques, fetchCheques]);

  // Reset the "new image" selections whenever a different (or no) record is
  // opened for editing, so a leftover file from a previous edit never
  // accidentally attaches to the next one.
  useEffect(() => {
    setEditImageFront(null);
    setEditImageBack(null);
    setEditFrontPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setEditBackPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [editingCheque?.id]);

  const handleEditImageChange = (file: File | null, side: 'front' | 'back') => {
    if (side === 'front') {
      setEditFrontPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return file ? URL.createObjectURL(file) : null;
      });
      setEditImageFront(file);
    } else {
      setEditBackPreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return file ? URL.createObjectURL(file) : null;
      });
      setEditImageBack(file);
    }
  };

  // FIXED: Removed Bank Name fallback to ensure accurate representation of assigned accounts
  const getAccountName = (cheque: ChequeRecord): string => {
    return (
      cheque.ourCompanyAccount || 
      cheque.ourAccount || 
      cheque.accountNumber || 
      'Not Assigned'
    );
  };

  const handleStatusChange = async (chequeId: string | number, newStatus: string) => {
    setUpdatingId(chequeId);
    setActionError(null);

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/cheques/${chequeId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        await fetchCheques();
      } else {
        const err = await response.json().catch(() => ({}));
        setActionError(err.message || 'Failed to update cheque status.');
      }
    } catch (err) {
      console.error('Status update error:', err);
      setActionError('Unable to reach server to update status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (chequeId: string | number) => {
    if (!window.confirm('Are you sure you want to delete this cheque record? This action cannot be undone.')) {
      return;
    }

    setDeletingId(chequeId);
    setActionError(null);

    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/cheques/${chequeId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (response.ok) {
        await fetchCheques();
      } else {
        const err = await response.json().catch(() => ({}));
        setActionError(err.message || 'Failed to delete cheque record.');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setActionError('Unable to reach server to delete record.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCheque) return;

    setUpdatingId(editingCheque.id);
    setActionError(null);

    const uploadData = new FormData();
    uploadData.append('chequeType', editingCheque.chequeType || '');
    uploadData.append('chequeNo', editingCheque.chequeNo || '');
    uploadData.append('bankName', editingCheque.bankName || '');
    uploadData.append('branchName', editingCheque.branchName || '');
    uploadData.append('amount', String(editingCheque.amount ?? ''));
    uploadData.append('partyName', editingCheque.partyName || '');
    uploadData.append(
      'chequeDate',
      editingCheque.chequeDate ? editingCheque.chequeDate.split('T')[0] : ''
    );
    uploadData.append('status', editingCheque.status || 'PENDING');
    uploadData.append('notes', editingCheque.notes || '');
    uploadData.append(
      'ourCompanyAccount',
      editingCheque.ourCompanyAccount || editingCheque.ourAccount || ''
    );

    if (editImageFront) uploadData.append('imageFront', editImageFront);
    if (editImageBack) uploadData.append('imageBack', editImageBack);

    try {
      const baseUrl = getApiBaseUrl();
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      }

      const response = await fetch(`${baseUrl}/cheques/${editingCheque.id}`, {
        method: 'PUT',
        headers,
        body: uploadData,
      });

      if (response.ok) {
        setEditingCheque(null);
        await fetchCheques();
      } else {
        const err = await response.json().catch(() => ({}));
        setActionError(err.message || 'Failed to update cheque details.');
      }
    } catch (err) {
      console.error('Edit error:', err);
      setActionError('Unable to reach server to update cheque.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredCheques = displayCheques.filter((cheque) => {
    const acc = getAccountName(cheque);
    const matchesAccount = selectedAccount ? acc === selectedAccount : true;
    const matchesSearch =
      cheque.chequeNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cheque.partyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cheque.bankName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesAccount && matchesSearch;
  });

  const getStatusBadge = (status?: string) => {
    const s = (status || 'PENDING').toUpperCase();
    switch (s) {
      case 'REALISED':
      case 'DEPOSITED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">{s}</span>;
      case 'BOUNCED':
      case 'CANCELLED':
      case 'RETURNED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">{s}</span>;
      case 'PENDING':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">PENDING</span>;
    }
  };

  return (
    <div className="bg-white p-3 sm:p-6 rounded-lg shadow-md border border-gray-200 max-w-7xl mx-auto space-y-4 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">Cheque Records Checklist</h2>
          <p className="text-xs text-gray-500">View, search, edit, inspect cheque images, and manage logged cheques.</p>
        </div>
        <button
          onClick={fetchCheques}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 sm:py-1.5 rounded transition flex items-center justify-center w-full sm:w-fit cursor-pointer"
        >
          🔄 Refresh List
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 bg-gray-50 p-3 rounded-md border border-gray-100">
        <div>
          <label htmlFor="accountFilter" className="block text-xs font-semibold text-gray-600 mb-1">
            Filter By Company Account
          </label>
          <select
            id="accountFilter"
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full p-2.5 sm:p-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- All Company Accounts --</option>
            {OUR_COMPANY_ACCOUNTS.map((account) => (
              <option key={account.id} value={account.label}>
                {account.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="searchInput" className="block text-xs font-semibold text-gray-600 mb-1">
            Search Cheque / Party / Bank / Account
          </label>
          <input
            id="searchInput"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type cheque #, party name, or account..."
            className="w-full p-2.5 sm:p-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading && !propCheques ? (
        <div className="text-center py-8 text-gray-500 text-sm font-medium animate-pulse">
          Loading cheque records...
        </div>
      ) : filteredCheques.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          No cheque records found for the selected criteria.
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-semibold">
                  <th className="p-2.5">Type</th>
                  <th className="p-2.5">Cheque No</th>
                  <th className="p-2.5">Company Account</th>
                  <th className="p-2.5">Bank / Branch</th>
                  <th className="p-2.5">Payer / Payee</th>
                  <th className="p-2.5">Amount (LKR)</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5 text-center">Images</th>
                  <th className="p-2.5 text-center">Status</th>
                  {isAdmin && <th className="p-2.5 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCheques.map((cheque) => {
                  const accountName = getAccountName(cheque);
                  const hasImages = Boolean(cheque.imageFrontUrl || cheque.imageBackUrl);

                  return (
                    <tr key={cheque.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-medium">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            cheque.chequeType === 'INWARD'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {cheque.chequeType}
                        </span>
                      </td>
                      <td className="p-2.5 font-mono font-semibold text-gray-800">{cheque.chequeNo}</td>
                      <td className="p-2.5 text-gray-700 font-medium max-w-xs truncate" title={accountName}>
                        {accountName}
                      </td>
                      <td className="p-2.5 text-gray-700">
                        <div>{cheque.bankName}</div>
                        {cheque.branchName && <div className="text-[10px] text-gray-400">{cheque.branchName}</div>}
                      </td>
                      <td className="p-2.5 font-medium text-gray-800">{cheque.partyName}</td>
                      <td className="p-2.5 font-mono font-bold text-gray-900">
                        {Number(cheque.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2.5 text-gray-500 whitespace-nowrap">
                        {cheque.chequeDate ? cheque.chequeDate.split('T')[0] : ''}
                      </td>

                      <td className="p-2.5 text-center whitespace-nowrap">
                        {hasImages ? (
                          <button
                            type="button"
                            onClick={() =>
                              setViewingImages({
                                chequeNo: cheque.chequeNo,
                                partyName: cheque.partyName,
                                frontUrl: cheque.imageFrontUrl,
                                backUrl: cheque.imageBackUrl,
                              })
                            }
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[10px] font-semibold transition cursor-pointer flex items-center justify-center space-x-1 mx-auto"
                          >
                            <span>📷 View</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 text-[10px]">No images</span>
                        )}
                      </td>

                      <td className="p-2.5 text-center">{getStatusBadge(cheque.status)}</td>
                      {isAdmin && (
                        <td className="p-2.5 text-center whitespace-nowrap">
                          <div className="inline-flex space-x-1">
                            <button
                              type="button"
                              disabled={updatingId === cheque.id}
                              onClick={() =>
                                handleStatusChange(
                                  cheque.id,
                                  cheque.chequeType === 'INWARD' ? 'DEPOSITED' : 'REALISED'
                                )
                              }
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold transition disabled:opacity-50 cursor-pointer"
                            >
                              Clear
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === cheque.id}
                              onClick={() => handleStatusChange(cheque.id, 'BOUNCED')}
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-semibold transition disabled:opacity-50 cursor-pointer"
                            >
                              Bounce
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingCheque({ ...cheque })}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-semibold transition cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === cheque.id}
                              onClick={() => handleDelete(cheque.id)}
                              className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-semibold transition disabled:opacity-50 cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD VIEW */}
          <div className="block md:hidden space-y-3">
            {filteredCheques.map((cheque) => {
              const accountName = getAccountName(cheque);
              const hasImages = Boolean(cheque.imageFrontUrl || cheque.imageBackUrl);

              return (
                <div key={cheque.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cheque.chequeType === 'INWARD'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {cheque.chequeType}
                    </span>
                    <div>{getStatusBadge(cheque.status)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400 block text-[10px]">Cheque No</span>
                      <span className="font-mono font-semibold text-gray-800">{cheque.chequeNo}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Date</span>
                      <span className="text-gray-600">{cheque.chequeDate ? cheque.chequeDate.split('T')[0] : ''}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 block text-[10px]">Company Account</span>
                      <span className="text-gray-700 font-medium truncate block">{accountName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Bank / Branch</span>
                      <span className="text-gray-700 font-medium">{cheque.bankName} {cheque.branchName ? `(${cheque.branchName})` : ''}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-[10px]">Payer / Payee</span>
                      <span className="text-gray-800 font-medium">{cheque.partyName}</span>
                    </div>
                    <div className="col-span-2 bg-gray-50 p-2 rounded flex justify-between items-center">
                      <span className="text-gray-500 font-semibold text-xs">Amount (LKR):</span>
                      <span className="font-mono font-bold text-gray-900 text-sm">
                        {Number(cheque.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div>
                      {hasImages ? (
                        <button
                          type="button"
                          onClick={() =>
                            setViewingImages({
                              chequeNo: cheque.chequeNo,
                              partyName: cheque.partyName,
                              frontUrl: cheque.imageFrontUrl,
                              backUrl: cheque.imageBackUrl,
                            })
                          }
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-xs font-semibold transition flex items-center space-x-1"
                        >
                          <span>📷 View Images</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">No images</span>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t">
                      <button
                        type="button"
                        disabled={updatingId === cheque.id}
                        onClick={() =>
                          handleStatusChange(
                            cheque.id,
                            cheque.chequeType === 'INWARD' ? 'DEPOSITED' : 'REALISED'
                          )
                        }
                        className="py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === cheque.id}
                        onClick={() => handleStatusChange(cheque.id, 'BOUNCED')}
                        className="py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                      >
                        Bounce
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCheque({ ...cheque })}
                        className="py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === cheque.id}
                        onClick={() => handleDelete(cheque.id)}
                        className="py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* FULL CHEQUE IMAGE PREVIEW MODAL */}
      {viewingImages && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-3xl w-full space-y-4 shadow-2xl my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-800">
                  Cheque Images - #{viewingImages.chequeNo}
                </h3>
                <p className="text-xs text-gray-500">Party: {viewingImages.partyName}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewingImages(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded p-2 bg-gray-50 text-center space-y-2">
                <span className="text-xs font-semibold text-gray-600 block">Front Side</span>
                {viewingImages.frontUrl ? (
                  <img
                    src={viewingImages.frontUrl}
                    alt="Cheque Front"
                    className="max-h-56 sm:max-h-64 mx-auto object-contain rounded border"
                  />
                ) : (
                  <div className="h-32 sm:h-40 flex items-center justify-center text-xs text-gray-400 border border-dashed rounded">
                    Front image not available
                  </div>
                )}
              </div>

              <div className="border rounded p-2 bg-gray-50 text-center space-y-2">
                <span className="text-xs font-semibold text-gray-600 block">Back Side</span>
                {viewingImages.backUrl ? (
                  <img
                    src={viewingImages.backUrl}
                    alt="Cheque Back"
                    className="max-h-56 sm:max-h-64 mx-auto object-contain rounded border"
                  />
                ) : (
                  <div className="h-32 sm:h-40 flex items-center justify-center text-xs text-gray-400 border border-dashed rounded">
                    Back image not available
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingImages(null)}
                className="w-full sm:w-auto px-4 py-2 bg-gray-800 text-white rounded text-xs font-semibold hover:bg-gray-700 cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingCheque && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-xl w-full space-y-4 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-base sm:text-lg font-bold text-gray-800">Edit Cheque Record Details</h3>
              <button
                type="button"
                onClick={() => setEditingCheque(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Cheque Type *</label>
                  <select
                    value={editingCheque.chequeType}
                    onChange={(e) =>
                      setEditingCheque((prev) =>
                        prev ? { ...prev, chequeType: e.target.value as 'INWARD' | 'OUTWARD' } : null
                      )
                    }
                    className="w-full p-2.5 sm:p-2 border rounded focus:ring-1 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="INWARD">INWARD (Received)</option>
                    <option value="OUTWARD">OUTWARD (Issued)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={editingCheque.status || 'PENDING'}
                    onChange={(e) =>
                      setEditingCheque((prev) => (prev ? { ...prev, status: e.target.value } : null))
                    }
                    className="w-full p-2.5 sm:p-2 border rounded focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="DEPOSITED">DEPOSITED (Inward - Cleared)</option>
                    <option value="REALISED">REALISED (Outward - Cleared)</option>
                    <option value="BOUNCED">BOUNCED / RETURNED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Company Account *</label>
                <select
                  value={editingCheque.ourCompanyAccount || editingCheque.ourAccount || editingCheque.accountNumber || ''}
                  onChange={(e) =>
                    setEditingCheque((prev) =>
                      prev
                        ? {
                            ...prev,
                            ourCompanyAccount: e.target.value,
                            ourAccount: e.target.value,
                            accountNumber: e.target.value,
                          }
                        : null
                    )
                  }
                  className="w-full p-2.5 sm:p-2 border rounded focus:ring-1 focus:ring-blue-500 bg-white"
                  required
                >
                  <option value="">-- Select Company Account --</option>
                  {OUR_COMPANY_ACCOUNTS.map((acc) => (
                    <option key={acc.id} value={acc.label}>
                      {acc.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Bank Name *</label>
                  <input
                    type="text"
                    value={editingCheque.bankName || ''}
                    onChange={(e) =>
                      setEditingCheque((prev) => (prev ? { ...prev, bankName: e.target.value } : null))
                    }
                    className="w-full p-2.5 sm:p-2 border rounded focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    value={editingCheque.branchName || ''}
                    onChange={(e) =>
                      setEditingCheque((prev) => (prev ? { ...prev, branchName: e.target.value } : null))
                    }
                    className="w-full p-2.5 sm:p-2 border rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Cheque Number *</label>
                  <input
                    type="text"
                    value={editingCheque.chequeNo || ''}
                    onChange={(e) =>
                      setEditingCheque((prev) => (prev ? { ...prev, chequeNo: e.target.value } : null))
                    }
                    className="w-full p-2.5 sm:p-2 border rounded focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Amount (LKR) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCheque.amount || ''}
                    onChange={(e) =>
                      setEditingCheque((prev) => (prev ? { ...prev, amount: e.target.value } : null))
                    }
                    className="w-full p-2.5 sm:p-2 border rounded focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Payer / Payee Name *</label>
                  <input
                    type="text"
                    value={editingCheque.partyName || ''}
                    onChange={(e) =>
                      setEditingCheque((prev) => (prev ? { ...prev, partyName: e.target.value } : null))
                    }
                    className="w-full p-2.5 sm:p-2 border rounded focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Cheque Date *</label>
                  <input
                    type="date"
                    value={editingCheque.chequeDate ? editingCheque.chequeDate.split('T')[0] : ''}
                    onChange={(e) =>
                      setEditingCheque((prev) => (prev ? { ...prev, chequeDate: e.target.value } : null))
                    }
                    className="w-full p-2.5 sm:p-2 border rounded focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Front Image</label>
                  {(editFrontPreview || editingCheque.imageFrontUrl) ? (
                    <img
                      src={editFrontPreview || editingCheque.imageFrontUrl}
                      alt="Front"
                      className="w-32 h-16 object-cover rounded border mb-1"
                    />
                  ) : (
                    <p className="text-[10px] text-gray-400 mb-1">No current image</p>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleEditImageChange(e.target.files?.[0] || null, 'front')}
                    className="w-full text-[11px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Leave empty to keep the current image.</p>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Back Image</label>
                  {(editBackPreview || editingCheque.imageBackUrl) ? (
                    <img
                      src={editBackPreview || editingCheque.imageBackUrl}
                      alt="Back"
                      className="w-32 h-16 object-cover rounded border mb-1"
                    />
                  ) : (
                    <p className="text-[10px] text-gray-400 mb-1">No current image</p>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleEditImageChange(e.target.files?.[0] || null, 'back')}
                    className="w-full text-[11px] text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Leave empty to keep the current image.</p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={editingCheque.notes || ''}
                  onChange={(e) =>
                    setEditingCheque((prev) => (prev ? { ...prev, notes: e.target.value } : null))
                  }
                  className="w-full p-2.5 sm:p-2 border rounded focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingCheque(null)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gray-200 hover:bg-gray-300 rounded font-semibold text-gray-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingId === editingCheque.id}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {updatingId === editingCheque.id ? 'Saving Changes...' : 'Save All Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}