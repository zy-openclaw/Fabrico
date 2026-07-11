export interface UserBan {
  id: string;
  user_id: string;
  active: boolean;
  reason: string;
  created_at: Date;
  updated_at: Date;
}

export interface Seller {
  id: string;
  name: string;
  verified: boolean;
  approved: boolean;
}

export interface Dispute {
  orderId: string;
  customer: string;
  reason: string;
  status: string;
  amount: number;
  refunded: boolean;
}

export interface AdminStats {
  totalUsers: number;
  totalSellers: number;
  totalOrders: number;
  activeDisputes: number;
  totalRevenue: number;
  pendingVerifications: number;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
}
