import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, ExternalLink, Zap, Server, Table } from 'lucide-react';
import { initSupabaseConnection } from '../../services/supabase';
import { store } from '../../services/store';

interface SupabaseSetupModalProps {
  isConnected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isConnected,
  onConnectionChange,
}) => {
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseKey, setSupabaseKey] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fullSqlSchema = `-- MedStock - Enterprise Medical Inventory System PostgreSQL Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    gst_number VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

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
    c.name AS category_name,
    m.company_name AS manufacturer_name,
    s.company_name AS supplier_name,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'STOCK_IN' THEN t.quantity ELSE 0 END), 0) AS total_stock_in,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'STOCK_OUT' THEN t.quantity ELSE 0 END), 0) AS total_stock_out,
    COALESCE(SUM(CASE WHEN t.transaction_type = 'STOCK_IN' THEN t.quantity ELSE -t.quantity END), 0) AS current_stock
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
LEFT JOIN suppliers s ON p.supplier_id = s.id
LEFT JOIN inventory_transactions t ON p.id = t.product_id
WHERE p.deleted_at IS NULL
GROUP BY p.id, c.name, m.company_name, s.company_name;`;

  const copySQL = () => {
    navigator.clipboard.writeText(fullSqlSchema);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestConnection = () => {
    if (!supabaseUrl || !supabaseKey) {
      setStatusMessage({ type: 'error', text: 'Please enter both Supabase Project URL and Anon Public Key.' });
      return;
    }

    const res = initSupabaseConnection(supabaseUrl, supabaseKey);
    if (res.success) {
      store.updateSettings({
        supabase_url: supabaseUrl,
        supabase_anon_key: supabaseKey,
        is_connected_to_supabase: true,
      });
      onConnectionChange(true);
      setStatusMessage({ type: 'success', text: 'Successfully authorized and connected to live Supabase Backend!' });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Connection attempt failed.' });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      
      {/* Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-brand-600" />
            <span>Supabase Backend Engine & SQL Migrations</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Automatic SQL schema generator with real-time dynamic inventory views and client connector.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isConnected ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
          }`}>
            {isConnected ? 'Live Supabase Connected' : 'Local Offline Mode Active'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Interactive SQL Exporter */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-slate-900 text-sm">Automated PostgreSQL SQL Migration Script</h3>
            </div>

            <button
              onClick={copySQL}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-semibold rounded-lg border border-brand-200 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-500">
            Paste this SQL script into your Supabase Dashboard &rarr; SQL Editor to automatically initialize all 8 tables, foreign keys, constraints, triggers, and derived inventory views:
          </p>

          <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-y-auto max-h-[380px] leading-relaxed flex-1 border border-slate-800">
            {fullSqlSchema}
          </pre>
        </div>

        {/* Right: Live Connector Controls */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-card space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <Zap className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Supabase Authorization & API Config</h3>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-lg text-xs font-semibold ${
              statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {statusMessage.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supabase Project URL</label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supabase Anon Public API Key</label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleTestConnection}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Server className="w-4 h-4" />
              <span>Connect & Validate Supabase Instance</span>
            </button>
          </div>

          {/* Database Table Architecture Overview */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Schema Relational Tables Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <div className="p-2 bg-slate-50 rounded border">✓ <code>products</code></div>
              <div className="p-2 bg-slate-50 rounded border">✓ <code>categories</code></div>
              <div className="p-2 bg-slate-50 rounded border">✓ <code>manufacturers</code></div>
              <div className="p-2 bg-slate-50 rounded border">✓ <code>suppliers</code></div>
              <div className="p-2 bg-slate-50 rounded border">✓ <code>inventory_transactions</code></div>
              <div className="p-2 bg-slate-50 rounded border">✓ <code>qr_codes</code></div>
              <div className="p-2 bg-slate-50 rounded border">✓ <code>activity_logs</code></div>
              <div className="p-2 bg-slate-50 rounded border">✓ <code>v_product_inventory</code> (SQL View)</div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
