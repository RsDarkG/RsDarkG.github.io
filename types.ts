
export enum ViewState {
  DASHBOARD = 'dashboard',
  POS = 'pos',
  PRODUCTS = 'products',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  BILLING = 'billing'
}

export interface Product {
  id: string;
  name: string;
  category: 'Sabores' | 'Toppings' | 'Tamaños' | 'Bebidas';
  price: number;
  description: string;
  image: string;
  available: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  lastPurchase: string;
  favoriteFlavor: string;
  totalSpend: number;
  status: 'Active' | 'Inactive';
}

export interface Transaction {
  id: string;
  time: string;
  items: number;
  total: number;
  method: 'Tarjeta' | 'Efectivo';
  status: 'Completado' | 'Pendiente';
}

export interface Invoice {
  id: string;
  folio: string; // Internal Folio like #FAC-001
  uuid: string; // Fiscal UUID (Electronic Invoice)
  date: string;
  timestamp: number; // Numeric timestamp for accurate sorting/charting
  customerName: string;
  customerNif: string; // Tax ID / RFC
  customerEmail: string;
  customerPhoto?: string; // Base64 string of the customer photo
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'Pagada' | 'Pendiente' | 'Cancelada';
  paymentMethod: 'Tarjeta' | 'Efectivo' | 'Transferencia' | 'Nequi';
}

export interface KpiData {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: any; // Lucide icon component type
}

export interface LoginEvent {
  id: string;
  date: string;
  user: string;
  status: 'Exitoso' | 'Fallido';
  device?: string;
}
