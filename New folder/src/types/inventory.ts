export type ProductStatus = 'ACTIVE' | 'ARCHIVED' | 'OUT_OF_STOCK';

export type TransactionType = 'STOCK_IN' | 'STOCK_OUT';

export type CalculatedStockStatus = 'HEALTHY' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON' | 'EXPIRED';

export interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Manufacturer {
  id: string;
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  gst_number: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  company_name: string;
  phone: string;
  email: string;
  address: string;
  gst_number: string;
  created_at: string;
}

export interface Product {
  id: string;
  product_code: string;
  sku: string;
  product_name: string;
  generic_name: string;
  category_id: string;
  manufacturer_id: string;
  supplier_id: string;
  batch_number: string;
  barcode: string;
  expiry_date: string; // ISO date YYYY-MM-DD
  manufacturing_date: string; // ISO date YYYY-MM-DD
  purchase_price: number;
  selling_price: number;
  gst_percentage: number;
  unit: string; // 'Box', 'Strip', 'Vial', 'Bottle', 'Pack', etc.
  minimum_stock: number;
  description: string;
  image_url?: string;
  qr_code?: string; // Data URL or JSON string
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Joined dynamic/calculated fields for UI ease
  category_name?: string;
  manufacturer_name?: string;
  supplier_name?: string;
  current_stock?: number;
  total_stock_in?: number;
  total_stock_out?: number;
  calculated_status?: CalculatedStockStatus;
}

export interface InventoryTransaction {
  id: string;
  product_id: string;
  transaction_type: TransactionType;
  quantity: number;
  remarks?: string;
  reference_number: string; // e.g. PO-88219 or INV-9901
  operator?: string; // Default "System Admin"
  old_quantity?: number;
  new_quantity?: number;
  created_at: string;
  product_name?: string;
  sku?: string;
  batch_number?: string;
}

export interface QRCodeRecord {
  id: string;
  product_id: string;
  qr_image: string;
  payload: string; // JSON string payload
  created_at: string;
}

export interface QRPayload {
  id: string;
  sku: string;
  name: string;
  batch: string;
  exp?: string;
}

export interface ActivityLog {
  id: string;
  event: string;
  description: string;
  entity: string;
  entity_id: string;
  timestamp: string;
}

export interface SystemSettings {
  company_name: string;
  gst_number: string;
  phone: string;
  email: string;
  address: string;
  currency_symbol: string;
  low_stock_threshold_default: number;
  expiring_days_threshold: number;
  auto_generate_sku: boolean;
  supabase_url?: string;
  supabase_anon_key?: string;
  is_connected_to_supabase: boolean;
}

export interface QRPrintConfig {
  labelSize: 'thermal-50-30' | 'thermal-100-50' | 'a4-1' | 'a4-4' | 'a4-12' | 'a4-24' | 'a4-48';
  includeLogo: boolean;
  includeProductName: boolean;
  includeSKU: boolean;
  includeBatch: boolean;
  includeExpiry: boolean;
  includePrice: boolean;
  copiesPerProduct: number;
}
