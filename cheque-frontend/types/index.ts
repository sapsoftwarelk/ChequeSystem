// src/types/index.ts

export type ChequeType = 'INWARD' | 'OUTWARD';

export type ChequeStatus = 
  | 'PENDING' 
  | 'DEPOSITED' 
  | 'REALISED' 
  | 'BOUNCED' 
  | 'CANCELLED' 
  | 'CLEARED' 
  | 'RETURNED';

export interface Cheque {
  id: number;
  chequeType: ChequeType;
  chequeNo: string;
  bankName: string;
  branchName?: string;
  partyName: string;
  amount: string | number;
  chequeDate: string;
  status: ChequeStatus;
  imageFrontPath: string | null;
  imageBackPath: string | null;
  ourAccount?: string;
  notes?: string;
}

export interface User {
  id: string | number;
  username: string;
  email?: string;
  role: 'ADMIN' | 'USER' | string;
}