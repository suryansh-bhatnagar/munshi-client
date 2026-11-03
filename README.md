# Munshi Client 📊✨

The frontend web application for Munshi — an intelligent AI accounting and inventory management platform for modern businesses.

Built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, and **Apollo Client**.

Frontend Repository : https://github.com/suryansh-bhatnagar/munshi-client

Backend Repository : https://github.com/suryansh-bhatnagar/munshi-server

View Live : https://munshi-ai.duckdns.org/

---

## ✨ Features

- **Conversational AI Widget (`ChatWidget.tsx`)**:
  - Interactive floating chat interface communicating with the backend Munshi AI.
  - Multi-line textarea support with keyboard shortcuts (`Enter` to send, `Shift + Enter` for new lines).
  - Rich responses displaying stock status, balances, and created invoices.
- **Business Management Modules**:
  - **Dashboard**: Financial overview, revenue analytics, and transaction summaries.
  - **Invoices**: Create and view detailed sales and purchase invoices.
  - **Inventory (Items)**: Real-time stock tracking and pricing.
  - **Customers & Suppliers**: Party contact and ledger management.
  - **Authentication**: JWT-based session security.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Running `munshi-server` backend on `http://localhost:5000/graphql`

### 1. Installation
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open your browser at the local URL provided by Vite (typically `http://localhost:5173`).

### 3. Build for Production
```bash
npm run build
```

---

## 📂 Project Structure

```
munshi-client/
├── public/               # Public assets and icons
├── src/
│   ├── assets/           # Logos and branding illustrations
│   ├── components/
│   │   ├── ui/           # Radix/Tailwind reusable UI primitives
│   │   ├── ChatWidget.tsx# AI Conversational Assistant widget
│   │   └── Layout.tsx    # App layout with navigation & sidebar
│   ├── pages/            # View pages (Dashboard, Invoices, Items, Auth, etc.)
│   ├── lib/              # Utility functions
│   ├── App.tsx           # Router and Apollo Provider configuration
│   └── main.tsx          # Application entry point
├── package.json
├── tailwind.config.js
└── vite.config.ts
```
