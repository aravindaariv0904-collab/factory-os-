import { 
  Product, Category, Manufacturer, Supplier, InventoryTransaction, 
  ActivityLog, SystemSettings, CalculatedStockStatus, QRPayload 
} from '../types/inventory';
import { 
  INITIAL_CATEGORIES, INITIAL_MANUFACTURERS, INITIAL_SUPPLIERS, 
  INITIAL_PRODUCTS, INITIAL_TRANSACTIONS, INITIAL_ACTIVITY_LOGS 
} from '../db/seedData';
import QRCode from 'qrcode';

const STORAGE_KEYS = {
  PRODUCTS: 'medstock_products_v1',
  CATEGORIES: 'medstock_categories_v1',
  MANUFACTURERS: 'medstock_manufacturers_v1',
  SUPPLIERS: 'medstock_suppliers_v1',
  TRANSACTIONS: 'medstock_transactions_v1',
  LOGS: 'medstock_logs_v1',
  SETTINGS: 'medstock_settings_v1',
};

class MedStockStore {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initDefaultDataIfNeeded();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private getItem<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch (e) {
      console.error(`Error reading ${key} from LocalStorage:`, e);
      return fallback;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to LocalStorage:`, e);
    }
  }

  public initDefaultDataIfNeeded(forceReset = false) {
    if (forceReset || !localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.setItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
      this.setItem(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
      this.setItem(STORAGE_KEYS.MANUFACTURERS, INITIAL_MANUFACTURERS);
      this.setItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
      this.setItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
      this.setItem(STORAGE_KEYS.LOGS, INITIAL_ACTIVITY_LOGS);
      
      const defaultSettings: SystemSettings = {
        company_name: 'MedStock Enterprise Logistics',
        gst_number: '27AAACM9988P1Z5',
        phone: '+1 (800) 555-MEDS',
        email: 'admin@medstock-enterprise.io',
        address: '100 Healthcare Way, Suite 400, Boston, MA 02110',
        currency_symbol: '$',
        low_stock_threshold_default: 10,
        expiring_days_threshold: 30,
        auto_generate_sku: true,
        is_connected_to_supabase: false
      };
      this.setItem(STORAGE_KEYS.SETTINGS, defaultSettings);
      this.notify();
    }
  }

  // =========================================================================
  // CALCULATED INVENTORY ENGINE
  // =========================================================================
  public getProducts(): Product[] {
    const rawProducts = this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const categories = this.getCategories();
    const manufacturers = this.getManufacturers();
    const suppliers = this.getSuppliers();
    const transactions = this.getTransactions();

    const todayStr = new Date().toISOString().split('T')[0];
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const in30DaysStr = in30Days.toISOString().split('T')[0];

    return rawProducts
      .filter(p => !p.deleted_at)
      .map(product => {
        // Calculate Totals strictly from transactions
        const productTx = transactions.filter(t => t.product_id === product.id);
        const total_stock_in = productTx
          .filter(t => t.transaction_type === 'STOCK_IN')
          .reduce((sum, t) => sum + t.quantity, 0);
        const total_stock_out = productTx
          .filter(t => t.transaction_type === 'STOCK_OUT')
          .reduce((sum, t) => sum + t.quantity, 0);
        
        const current_stock = total_stock_in - total_stock_out;

        // Calculate Status based on exact business logic rules
        let calculated_status: CalculatedStockStatus = 'HEALTHY';
        if (product.expiry_date && product.expiry_date < todayStr) {
          calculated_status = 'EXPIRED';
        } else if (product.expiry_date && product.expiry_date <= in30DaysStr) {
          calculated_status = 'EXPIRING_SOON';
        } else if (current_stock <= 0) {
          calculated_status = 'OUT_OF_STOCK';
        } else if (current_stock < product.minimum_stock || current_stock < 10) {
          calculated_status = 'LOW_STOCK';
        }

        const cat = categories.find(c => c.id === product.category_id);
        const mfg = manufacturers.find(m => m.id === product.manufacturer_id);
        const sup = suppliers.find(s => s.id === product.supplier_id);

        return {
          ...product,
          category_name: cat ? cat.name : 'Uncategorized',
          manufacturer_name: mfg ? mfg.company_name : 'Unknown Mfr',
          supplier_name: sup ? sup.company_name : 'Unknown Supplier',
          total_stock_in,
          total_stock_out,
          current_stock,
          calculated_status
        };
      });
  }

  public getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  }

  public getProductByCodeOrSKU(query: string): Product | undefined {
    const clean = query.trim().toUpperCase();
    return this.getProducts().find(p => 
      p.id.toUpperCase() === clean || 
      p.sku.toUpperCase() === clean || 
      p.product_code.toUpperCase() === clean ||
      p.batch_number.toUpperCase() === clean ||
      (p.barcode && p.barcode.toUpperCase() === clean)
    );
  }

  // =========================================================================
  // PRODUCT OPERATIONS
  // =========================================================================
  public async addProduct(data: Omit<Product, 'id' | 'created_at' | 'updated_at'>, initialQuantity: number = 0): Promise<Product> {
    const rawProducts = this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    
    // Uniqueness validations
    if (rawProducts.some(p => p.sku.toUpperCase() === data.sku.toUpperCase() && !p.deleted_at)) {
      throw new Error(`SKU "${data.sku}" already exists. SKUs must be unique.`);
    }
    if (rawProducts.some(p => p.product_code.toUpperCase() === data.product_code.toUpperCase() && !p.deleted_at)) {
      throw new Error(`Product Code "${data.product_code}" already exists.`);
    }

    const newId = `prod-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Create QR Code payload JSON string
    const qrPayloadObj: QRPayload = {
      id: newId,
      sku: data.sku,
      name: data.product_name,
      batch: data.batch_number,
      exp: data.expiry_date
    };
    const qrPayloadStr = JSON.stringify(qrPayloadObj);
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(qrPayloadStr, { margin: 1, width: 250 });
    } catch (e) {
      console.error('Failed to generate QR Data URL:', e);
    }

    const newProduct: Product = {
      ...data,
      id: newId,
      qr_code: qrDataUrl || qrPayloadStr,
      status: data.status || 'ACTIVE',
      created_at: timestamp,
      updated_at: timestamp,
    };

    rawProducts.unshift(newProduct);
    this.setItem(STORAGE_KEYS.PRODUCTS, rawProducts);

    // Record initial STOCK_IN if quantity > 0
    if (initialQuantity > 0) {
      this.stockIn(
        newId,
        initialQuantity,
        `INIT-${newProduct.product_code}`,
        'Initial Stock Intake upon product registration'
      );
    }

    this.addActivityLog('PRODUCT_CREATED', `Added new product "${newProduct.product_name}" (${newProduct.sku})`, 'PRODUCT', newId);
    this.notify();
    return newProduct;
  }

  public async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const rawProducts = this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const index = rawProducts.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found.');

    const current = rawProducts[index];
    
    // Check SKU/Product code collision if changed
    if (updates.sku && updates.sku.toUpperCase() !== current.sku.toUpperCase()) {
      if (rawProducts.some(p => p.id !== id && p.sku.toUpperCase() === updates.sku!.toUpperCase() && !p.deleted_at)) {
        throw new Error(`SKU "${updates.sku}" already exists on another product.`);
      }
    }

    // Re-generate QR if SKU, Name or Batch changes
    let qr_code = current.qr_code;
    const sku = updates.sku || current.sku;
    const name = updates.product_name || current.product_name;
    const batch = updates.batch_number || current.batch_number;
    const exp = updates.expiry_date || current.expiry_date;

    const qrPayloadObj: QRPayload = { id, sku, name, batch, exp };
    const qrPayloadStr = JSON.stringify(qrPayloadObj);
    try {
      qr_code = await QRCode.toDataURL(qrPayloadStr, { margin: 1, width: 250 });
    } catch (e) {
      qr_code = qrPayloadStr;
    }

    const updatedProduct: Product = {
      ...current,
      ...updates,
      qr_code,
      updated_at: new Date().toISOString()
    };

    rawProducts[index] = updatedProduct;
    this.setItem(STORAGE_KEYS.PRODUCTS, rawProducts);
    this.addActivityLog('PRODUCT_UPDATED', `Updated product details for "${updatedProduct.product_name}"`, 'PRODUCT', id);
    this.notify();
    return updatedProduct;
  }

  public deleteProduct(id: string): void {
    const rawProducts = this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const index = rawProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      const prod = rawProducts[index];
      rawProducts[index].deleted_at = new Date().toISOString();
      this.setItem(STORAGE_KEYS.PRODUCTS, rawProducts);
      this.addActivityLog('PRODUCT_DELETED', `Deleted product "${prod.product_name}"`, 'PRODUCT', id);
      this.notify();
    }
  }

  public bulkDeleteProducts(ids: string[]): void {
    const rawProducts = this.getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const timestamp = new Date().toISOString();
    let count = 0;
    rawProducts.forEach(p => {
      if (ids.includes(p.id)) {
        p.deleted_at = timestamp;
        count++;
      }
    });
    this.setItem(STORAGE_KEYS.PRODUCTS, rawProducts);
    this.addActivityLog('BULK_DELETE', `Bulk archived ${count} products`, 'PRODUCT', 'bulk');
    this.notify();
  }

  // =========================================================================
  // STOCK TRANSACTIONS (Stock In / Stock Out)
  // =========================================================================
  public stockIn(
    productId: string, 
    quantity: number, 
    referenceNumber: string, 
    remarks?: string, 
    operator: string = 'System Admin'
  ): InventoryTransaction {
    if (quantity <= 0) throw new Error('Stock In quantity must be greater than zero.');

    const product = this.getProductById(productId);
    if (!product) throw new Error('Product not found.');

    const currentStock = product.current_stock || 0;
    const newStock = currentStock + quantity;

    const tx: InventoryTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      product_id: productId,
      transaction_type: 'STOCK_IN',
      quantity,
      reference_number: referenceNumber || `REF-IN-${Date.now().toString().slice(-6)}`,
      remarks: remarks || 'Stock In entry',
      operator,
      old_quantity: currentStock,
      new_quantity: newStock,
      created_at: new Date().toISOString(),
      product_name: product.product_name,
      sku: product.sku,
      batch_number: product.batch_number
    };

    const transactions = this.getItem<InventoryTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    transactions.unshift(tx);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);

    this.addActivityLog(
      'STOCK_IN', 
      `Stock In: +${quantity} units for "${product.product_name}" (Ref: ${tx.reference_number})`, 
      'TRANSACTION', 
      tx.id
    );
    this.notify();
    return tx;
  }

  public stockOut(
    productId: string, 
    quantity: number, 
    referenceNumber: string, 
    remarks?: string, 
    operator: string = 'System Admin'
  ): InventoryTransaction {
    if (quantity <= 0) throw new Error('Stock Out quantity must be greater than zero.');

    const product = this.getProductById(productId);
    if (!product) throw new Error('Product not found.');

    const currentStock = product.current_stock || 0;

    // Strict Negative Stock Prevention
    if (quantity > currentStock) {
      throw new Error(
        `Insufficient Inventory! Requested Stock Out (${quantity}) exceeds current available quantity (${currentStock}) for "${product.product_name}".`
      );
    }

    const newStock = currentStock - quantity;

    const tx: InventoryTransaction = {
      id: `tx-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      product_id: productId,
      transaction_type: 'STOCK_OUT',
      quantity,
      reference_number: referenceNumber || `REF-OUT-${Date.now().toString().slice(-6)}`,
      remarks: remarks || 'Stock Out dispatch',
      operator,
      old_quantity: currentStock,
      new_quantity: newStock,
      created_at: new Date().toISOString(),
      product_name: product.product_name,
      sku: product.sku,
      batch_number: product.batch_number
    };

    const transactions = this.getItem<InventoryTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
    transactions.unshift(tx);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, transactions);

    this.addActivityLog(
      'STOCK_OUT', 
      `Stock Out: -${quantity} units for "${product.product_name}" (Ref: ${tx.reference_number})`, 
      'TRANSACTION', 
      tx.id
    );
    this.notify();
    return tx;
  }

  // =========================================================================
  // AUXILIARY METADATA & GETTERS
  // =========================================================================
  public getCategories(): Category[] {
    return this.getItem<Category[]>(STORAGE_KEYS.CATEGORIES, []);
  }
  public addCategory(name: string, description: string): Category {
    const cats = this.getCategories();
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      name,
      description,
      created_at: new Date().toISOString()
    };
    cats.push(newCat);
    this.setItem(STORAGE_KEYS.CATEGORIES, cats);
    this.notify();
    return newCat;
  }

  public getManufacturers(): Manufacturer[] {
    return this.getItem<Manufacturer[]>(STORAGE_KEYS.MANUFACTURERS, []);
  }
  public addManufacturer(mfg: Omit<Manufacturer, 'id' | 'created_at'>): Manufacturer {
    const mfgs = this.getManufacturers();
    const newMfg: Manufacturer = {
      ...mfg,
      id: `mfg-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    mfgs.push(newMfg);
    this.setItem(STORAGE_KEYS.MANUFACTURERS, mfgs);
    this.notify();
    return newMfg;
  }

  public getSuppliers(): Supplier[] {
    return this.getItem<Supplier[]>(STORAGE_KEYS.SUPPLIERS, []);
  }
  public addSupplier(sup: Omit<Supplier, 'id' | 'created_at'>): Supplier {
    const sups = this.getSuppliers();
    const newSup: Supplier = {
      ...sup,
      id: `sup-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    sups.push(newSup);
    this.setItem(STORAGE_KEYS.SUPPLIERS, sups);
    this.notify();
    return newSup;
  }

  public getTransactions(): InventoryTransaction[] {
    return this.getItem<InventoryTransaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  }

  public getActivityLogs(): ActivityLog[] {
    return this.getItem<ActivityLog[]>(STORAGE_KEYS.LOGS, []);
  }

  private addActivityLog(event: string, description: string, entity: string, entity_id: string) {
    const logs = this.getItem<ActivityLog[]>(STORAGE_KEYS.LOGS, []);
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      event,
      description,
      entity,
      entity_id,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    this.setItem(STORAGE_KEYS.LOGS, logs.slice(0, 100)); // keep last 100 logs
  }

  public getSettings(): SystemSettings {
    return this.getItem<SystemSettings>(STORAGE_KEYS.SETTINGS, {
      company_name: 'MedStock Enterprise Logistics',
      gst_number: '27AAACM9988P1Z5',
      phone: '+1 (800) 555-MEDS',
      email: 'admin@medstock-enterprise.io',
      address: '100 Healthcare Way, Suite 400, Boston, MA 02110',
      currency_symbol: '$',
      low_stock_threshold_default: 10,
      expiring_days_threshold: 30,
      auto_generate_sku: true,
      is_connected_to_supabase: false
    });
  }

  public updateSettings(settings: Partial<SystemSettings>): SystemSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.setItem(STORAGE_KEYS.SETTINGS, updated);
    this.notify();
    return updated;
  }
}

export const store = new MedStockStore();
