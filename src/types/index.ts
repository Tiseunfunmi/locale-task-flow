export type Language = 'en' | 'ha' | 'ig' | 'yo';

export type UserRole = 'customer' | 'completer' | 'admin';

export type ChoreCategory = 
  | 'wash_clothes_hand'
  | 'wash_clothes_machine'
  | 'wash_plates'
  | 'clean_house'
  | 'go_to_market'
  | 'cook_meal';

export interface User {
  id: string;
  phone: string;
  name: string;
  role: UserRole;
  language: Language;
  address?: string;
  photo?: string;
  bio?: string;
  services?: ChoreCategory[];
  verified?: boolean;
  verificationDocs?: {
    idUrl: string;
    selfieUrl: string;
  };
  walletBalance: number;
  pendingBalance: number;
  bonusPoints: number;
  rating: number;
  reviewCount: number;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export interface Task {
  id: string;
  customerId: string;
  completerId: string;
  chores: ChoreCategory[];
  status: 'pending' | 'in_progress' | 'awaiting_release' | 'completed' | 'disputed';
  price: number;
  createdAt: string;
  completedAt?: string;
  releaseTime?: string; // 30 mins after completion
  rating?: number;
  review?: string;
}

export interface Message {
  id: string;
  taskId?: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'payout' | 'bonus' | 'withdrawal' | 'refund';
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
}
