# 🩺 MedStock — Enterprise Medical Inventory Management System

![MedStock Banner](https://img.shields.io/badge/MedStock-Enterprise_Medical_ERP-0284C7?style=for-the-badge&logo=react&logoColor=white)
![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**MedStock** is a production-grade enterprise medical inventory management application engineered for pharmaceutical distributors, hospital pharmacies, and medical suppliers. It combines real-time calculated stock tracking, dynamic QR barcode generation, print label sheet customizers, a browser webcam QR scanner, low-stock & expiry alert systems, audit trail history, and PDF report exporters.

---

## ✨ Key Features & Capability Matrix

### 📊 1. Executive Dashboard & Analytics
- **KPI Metrics Cards**: Total Products, Total Stock Units, Today's Stock In (+), Today's Stock Out (-), Low Stock Alerts, Expired Products, Expiring Within 30 Days, and Health Index Score %.
- **Recharts Analytics**: Interactive Stock Movement timeline chart and Category Stock Distribution donut chart.
- **Action Items Queue**: Real-time queue for low stock re-ordering and expiry rotation.
- **Live Activity Stream**: Real-time audit trail of system events.

### 📦 2. Calculated Real-Time Inventory Engine
- **Derived Inventory**: Stock quantity is computed dynamically as `Current Stock = Total Stock In - Total Stock Out` from immutable transaction records.
- **Strict Negative Stock Prevention**: Stock Out operations validate against current available inventory and block transactions exceeding available units.
- **Dynamic Status Badges**:
  - 🟢 **Healthy**: Stock &ge; Minimum Stock & Expiry > 30 Days
  - 🟡 **Low Stock**: Stock < Minimum Stock or Stock < 10
  - 🔴 **Out of Stock**: Stock = 0
  - 🟣 **Expiring Soon**: Expiry &le; 30 Days
  - 🔴 **Expired**: Expiry Date &le; Today

### 🏷️ 3. QR Code Generator & Label Print Studio
- **JSON QR Payload**: Standardized payload structure containing `{ id, sku, name, batch, exp }`.
- **Print Sheet Layout Presets**:
  - A4 Sheet - 24 Labels (Standard 3x8 Grid)
  - A4 Sheet - 48 Micro Labels (4x12 Grid)
  - A4 Sheet - 12 Large Labels (3x4 Grid)
  - Quad Shipping Labels (2x2 Grid)
  - Thermal Printer Labels (50x30mm & 100x50mm)
- **Label Customization**: Toggle logo, brand name, SKU, batch, expiry date, and selling price.
- **Export Formats**: PNG, SVG, PDF, and browser print integration (`window.print()`).

### 📷 4. Browser Webcam QR Scanner
- **Dual Operational Modes**:
  - **Stock In Mode**: Scan QR &rarr; Product Identification &rarr; Quantity & Reference Number Input &rarr; Database Update.
  - **Stock Out Mode**: Scan QR &rarr; Available Inventory Validation &rarr; Quantity Input &rarr; Negative Stock Guardrail &rarr; Dispatch Update.
- **Hardware Integration**: Camera switching (Front/Rear), Audio beep synthesizer (Web Audio API), and manual barcode typist fallback.

### 🗄️ 5. Supabase Backend & Automated SQL Engine
- **Automated PostgreSQL Migrations**: Generates complete SQL schema for 8 tables (`products`, `categories`, `manufacturers`, `suppliers`, `inventory_transactions`, `qr_codes`, `activity_logs`, `settings`), indexes, triggers, and derived inventory view (`v_product_inventory`).
- **Dual-Layer Storage Architecture**: Seamlessly connects to live Supabase backends while preserving an offline-first IndexedDB/LocalStorage reactive state.

### 📄 6. PDF Reports & Audit Log
- **Printable PDF Exporter**: Instant report generation for Master Inventory Summary, Low Stock Alerts, Expiry Risk Analysis, and Transaction Audit Logs.

---

## 🛠️ Technology Stack

- **Core**: React 18, TypeScript 5, Vite 5
- **Styling**: Tailwind CSS 3, Lucide Icons, Google Inter Font
- **Backend / Database**: Supabase JS Client, PostgreSQL 14+ Schema
- **Barcode & Scanner**: `html5-qrcode`, `qrcode`, Web Audio API
- **Export & PDF**: `jspdf`, `html2canvas`
- **Charts & Data**: `recharts`, `date-fns`

---

## 📁 Repository Directory Structure

```
MedStock/
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── netlify.toml
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── types/
    │   └── inventory.ts
    ├── db/
    │   ├── schema.sql
    │   └── seedData.ts
    ├── services/
    │   ├── store.ts
    │   └── supabase.ts
    └── components/
        ├── layout/
        │   ├── Sidebar.tsx
        │   ├── Header.tsx
        │   ├── CommandPalette.tsx
        │   └── ToastContainer.tsx
        ├── dashboard/
        │   └── ExecutiveDashboard.tsx
        ├── products/
        │   ├── ProductList.tsx
        │   ├── ProductFormModal.tsx
        │   └── ProductDetailModal.tsx
        ├── qr/
        │   └── QRStudio.tsx
        ├── scanner/
        │   └── QRScannerModal.tsx
        ├── inventory/
        │   └── InventoryList.tsx
        ├── transactions/
        │   └── TransactionHistory.tsx
        ├── reports/
        │   └── ReportCenter.tsx
        ├── supabase/
        │   └── SupabaseSetupModal.tsx
        └── settings/
            └── SystemSettingsView.tsx
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_GITHUB_USERNAME/medstock-enterprise.git

# 2. Navigate into the project folder
cd medstock-enterprise

# 3. Install dependencies
npm install

# 4. Start local development server (Port 3578)
npm run dev
```

Open your browser at `http://localhost:3578`.

---

## 🗄️ Supabase Database Setup

1. Log into your [Supabase Dashboard](https://supabase.com).
2. Create a new PostgreSQL project.
3. Open the **SQL Editor** tab.
4. Copy the entire contents of `src/db/schema.sql` (or copy directly from the **Supabase Engine** tab inside the MedStock application UI).
5. Click **Run** to generate all tables, triggers, indexes, and views.
6. Enter your `SUPABASE_URL` and `SUPABASE_ANON_KEY` inside the MedStock **Supabase Engine** settings panel.

---

## 🌐 Netlify Deployment Guide

MedStock is configured for 1-click Netlify deployment using `netlify.toml`.

### Automated Netlify CLI Deployment

```bash
# Build production bundle
npm run build

# Deploy to Netlify
npx netlify-cli deploy --prod
```

### Manual Netlify Web UI Deployment
1. Log into [Netlify](https://app.netlify.com).
2. Click **Add new site** &rarr; **Import an existing project** &rarr; **GitHub**.
3. Select `medstock-enterprise`.
4. Configure site build settings:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
5. Click **Deploy Site**.

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
