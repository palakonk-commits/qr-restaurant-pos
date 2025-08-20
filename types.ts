
export enum UserRole {
  Cashier = 'Cashier',
  Kitchen = 'Kitchen',
  Manager = 'Manager',
  Auditor = 'Auditor',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
}

export enum ServiceType {
  DineIn = 'DineIn',
  TakeAway = 'TakeAway',
  PickUp = 'PickUp',
}

export enum OrderStatus {
  Unpaid = 'Unpaid',
  Paid = 'Paid',
  Preparing = 'Preparing',
  Ready = 'Ready',
  Served = 'Served',
  Cancelled = 'Cancelled',
}

export enum PaymentMethod {
    Cash = 'Cash',
    Card = 'Card',
    Transfer = 'Transfer'
}

export enum TableStatus {
  Available = 'Available',
  Occupied = 'Occupied',
}

export interface Table {
  id: string;
  name: string;
  status: TableStatus;
}

export interface MenuOptionItem {
  name: { th: string; en: string };
  price: number;
}

export interface MenuOption {
  title: { th: string; en: string };
  items: MenuOptionItem[];
  required: boolean;
}

export interface MenuItem {
  id: string;
  name: { th: string; en: string };
  category: string;
  price: number;
  isOutOfStock: boolean;
  options?: MenuOption[];
  allergens?: string[];
  isSpicy?: boolean;
  isVegan?: boolean;
  isHalal?: boolean;
}

export interface MenuCategory {
  id: string;
  name: { th: string; en: string };
}

export interface CartItem {
    menuItem: MenuItem;
    quantity: number;
    selectedOptions: { [optionTitle: string]: MenuOptionItem };
    notes: string;
    totalPrice: number;
}

export interface OrderItem extends CartItem {
  id: string;
}

export interface Order {
  id: string;
  qrSessionId?: string;
  queueNumber: number;
  items: OrderItem[];
  serviceType: ServiceType;
  status: OrderStatus;
  subtotal: number;
  vat: number;
  serviceCharge: number;
  discount: number;
  total: number;
  paymentMethod?: PaymentMethod;
  createdAt: Date;
  paidAt?: Date;
  createdBy: string; // User ID or 'Customer'
}

export interface QrSession {
  id: string;
  createdAt: Date;
  status: 'active' | 'used' | 'expired';
  orderId?: string;
  tableId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  details: string;
}

export interface Settings {
    vatRate: number; // e.g., 0.07 for 7%
    serviceChargeRate: number; // e.g., 0.10 for 10%
    qrCodeExpiryMinutes: number;
    currency: { th: string; en: string };
}

export interface AppState {
    currentUser: User | null;
    users: User[];
    menuItems: MenuItem[];
    menuCategories: MenuCategory[];
    orders: Order[];
    qrSessions: QrSession[];
    auditLogs: AuditLog[];
    tables: Table[];
    settings: Settings;
    lastQueueNumber: number;
}
