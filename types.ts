

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export type UserRole = 'ADMIN' | 'USER';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
}

export interface ServiceItem {
  id: string;
  category: string; // Ex: 'Berline', 'Moto', '4x4 7 places'
  name: string;     // Ex: 'Lavage simple'
  price: number;
}

export interface Washer {
  id: string;
  name: string;
  active: boolean;
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  type: TransactionType;
  amount: number; // Total amount
  description: string;
  category: string; // Service Name or Expense Category
  
  // Extended fields for Wash Registration
  serviceId?: string;
  vehicleType?: string;
  vehicleBrand?: string;
  vehiclePlate?: string;
  washerId?: string;
  washerName?: string;
  quantity?: number;
  unitPrice?: number;
  
  // Financial Split
  washerShare?: number;   // 30%
  promoterShare?: number; // 70%
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalWashes: number;
  totalWasherShare: number;
  totalPromoterShare: number;
}

export interface DailyStat {
  date: string; // YYYY-MM-DD
  revenue: number;
  count: number;
}
