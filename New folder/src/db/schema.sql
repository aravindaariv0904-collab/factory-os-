-- ============================================================================
-- MedStock - Enterprise Medical Inventory System Database Schema
-- Compatible with Supabase / PostgreSQL 14+
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. MANUFACTURERS TABLE
CREATE TABLE IF NOT EXISTS manufacturers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL UNIQUE,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. SUPPLIERS TABLE
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_code VARCHAR(100) NOT NULL UNIQUE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    manufacturer_id UUID REFERENCES manufacturers(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    batch_number VARCHAR(100) NOT NULL,
    barcode VARCHAR(100),
    expiry_date DATE NOT NULL,
    manufacturing_date DATE,
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (purchase_price >= 0),
    selling_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (selling_price >= purchase_price),
    gst_percentage NUMERIC(5, 2) DEFAULT 12.00 CHECK (gst_percentage >= 0),
    unit VARCHAR(50) DEFAULT 'Box',
    minimum_stock INT NOT NULL DEFAULT 10 CHECK (minimum_stock >= 0),
    description TEXT,
    image_url TEXT,
    qr_code TEXT,
    status VARCHAR(50) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED', 'OUT_OF_STOCK')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 6. INVENTORY TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('STOCK_IN', 'STOCK_OUT')),
    quantity INT NOT NULL CHECK (quantity > 0),
    remarks TEXT,
    reference_number VARCHAR(100) NOT NULL,
    operator VARCHAR(255) DEFAULT 'System Admin',
    old_quantity INT DEFAULT 0,
    new_quantity INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. QR CODES TABLE
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    qr_image TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id UUID,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_expiry ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_transactions_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON inventory_transactions(created_at);

-- ============================================================================
-- SQL VIEW FOR DERIVED INVENTORY CALCULATIONS
-- Current Quantity = Total Stock In - Total Stock Out
-- ============================================================================
CREATE OR REPLACE VIEW v_product_inventory AS
SELECT 
    p.id AS product_id,
    p.product_code,
    p.sku,
    p.product_name,
    p.generic_name,
    p.batch_number,
    p.expiry_date,
    p.minimum_stock,
    p.selling_price,
    p.purchase_price,
    c.name AS category_name,
    m.company_name AS manufacturer_name,
    s.company_name AS supplier_name,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'STOCK_IN' THEN t.quantity ELSE 0 END), 0) AS total_stock_in,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'STOCK_OUT' THEN t.quantity ELSE 0 END), 0) AS total_stock_out,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'STOCK_IN' THEN t.quantity ELSE -t.quantity END), 0) AS current_stock,
    CASE 
        WHEN p.expiry_date < CURRENT_DATE THEN 'EXPIRED'
        WHEN p.expiry_date <= (CURRENT_DATE + INTERVAL '30 days') THEN 'EXPIRING_SOON'
        WHEN COALESCE(SUM(CASE WHEN t.transaction_type = 'STOCK_IN' THEN t.quantity ELSE -t.quantity END), 0) <= 0 THEN 'OUT_OF_STOCK'
        WHEN COALESCE(SUM(CASE WHEN t.transaction_type = 'STOCK_IN' THEN t.quantity ELSE -t.quantity END), 0) < p.minimum_stock THEN 'LOW_STOCK'
        ELSE 'HEALTHY'
    END AS calculated_status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
LEFT JOIN inventory_transactions t ON p.id = t.product_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, c.name, m.company_name, s.company_name;

-- ============================================================================
-- TRIGGER TO AUTO-UPDATE updated_at COLUMN
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
