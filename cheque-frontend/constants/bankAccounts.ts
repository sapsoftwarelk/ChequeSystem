export interface BankAccount {
  id: string;
  label: string;
}

export const OUR_COMPANY_ACCOUNTS: BankAccount[] = [
  { id: 'smart_com_gampaha', label: 'Commercial Bank - Gampaha (1000576908) - SMART TECHNOLOGY' },
  { id: 'niro_boc_gampaha', label: 'Bank of Ceylon - Gampaha (0090311554) - J.W.M.D NIROSHANI' },
  { id: 'sap_boc_gampaha', label: 'Bank of Ceylon - Gampaha (0090900272) - SAP COMPUTERS (PVT) LTD' },
  { id: 'niro_sampath_super', label: 'Sampath Bank - Gampaha Super (121252154844) - J.W.M.D NIROSHANI' },
  { id: 'sap_sampath_yakkala', label: 'Sampath Bank - Yakkala (106814013791) - SAP COMPUTERS' },
  { id: 'niro_sampath_yakkala', label: 'Sampath Bank - Yakkala (106857000032) - J.W.M.D NIROSHANI' },
  { id: 'smart_boc_gampaha', label: 'Bank of Ceylon - Gampaha (95989405) - SMART TECHNOLOGY' },
];
