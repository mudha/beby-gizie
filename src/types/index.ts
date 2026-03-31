export interface User {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "EMPLOYEE";
  branchId: string | null;
  branch?: { id: string; name: string } | null;
  isActive?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface SalesMethod {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}


export interface Product {
  id: string;
  name: string;
  isActive: boolean;
  prices?: { id: string; salesMethodId: string; price: number }[];
}

export interface TransactionItem {
  id: string;
  productId: string;
  productNameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  createdAt: string;
  branchId: string;
  branch?: { name: string };
  salesMethod: string;
  totalAmount: number;
  createdByUserId: string;
  createdBy?: { name: string; username?: string };
  items?: TransactionItem[];
}

export interface DashboardSummary {
  totalAmount: number;
  transactionCount: number;
  avgPerTransaction: number;
}

export interface BranchStat {
  branchId: string;
  branchName: string;
  totalAmount: number;
  count: number;
}

export interface MethodStat {
  method: string;
  totalAmount: number;
  count: number;
}

export interface TopProduct {
  name: string;
  totalQty: number;
  totalAmount: number;
}