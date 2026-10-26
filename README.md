# AccreditOS Frontend Dashboard

This is the React-based client dashboard application for **AccreditOS**, an enterprise resource planning (ERP) system tailored for training management, student certificates, finance logs, and system operations.

Built with React 18, TypeScript, Tailwind CSS, Radix UI primitives, and Vite, it delivers a high-fidelity, fully responsive single-page application (SPA).

---

## ✨ Features

- **Interactive Analytics Dashboard**: High-level visual KPIs showcasing total revenues, outstanding invoices, certificate counts, client registrations, and dynamic monthly graphs.
- **Client & Lead Management**: Add, update, view, and organize client accounts and tracking parameters with server-side data synchronization.
- **Training Course Management**: Schedule and manage trainings, link them to specific clients and awarding bodies, track trainers, and log candidate headcounts.
- **High-Fidelity Certificate Hub**: 
  - **Bulk Certificate Operations**: Multi-select certificates across grid/list views with 1-click bulk status updates (`Printed`, `Distributed`, `Sent`, `Created`) using `CertificatesBulkBar`.
  - **Awarding Body Filtering**: Filter certificates and training records dynamically by external awarding bodies across both list and interactive calendar views.
  - **Vector PDF Generation**: Uses `pdf-lib` and `@pdf-lib/fontkit` to embed custom TrueType fonts (`Monotype Corsiva`, `Calibri Bold`), draw dynamic text with coordinate precision, patch background placeholders with whiteout rectangles, and bypass font ligature spacing issues.
  - **Word (.docx) Generation**: Uses `PizZip` to open Microsoft Word OpenXML packages (`word/document.xml`), perform safe XML string escaping and node replacement, and trigger client-side file downloads with `file-saver`.
- **Finance Module**:
  - **Invoices**: Issue invoices, track balances, record incoming payments, log invoice types, and export reports.
  - **Expenses**: Record operational expenses, group them by system-defined categories, and track payment modes.
  - **Receipts**: Multi-state receipts pipeline with confirmations, audit logs, and voiding functionality.
- **Access Control & System Settings**:
  - **User Management**: Admin profile management and system role assignments (Super Admin, Admin, Operation Admin, Trainer).
  - **Dynamic Permissions Grid**: Fine-tune screen and feature access (Read, Create, Edit, Delete) per role.
- **Enterprise Progressive Web App (PWA)**:
  - **Installable Desktop & Mobile App**: 1-click **Install App** button in top navbar and standalone mode support.
  - **Data Integrity Workbox Caching**: `NetworkOnly` for financial APIs & certificate generation to prevent duplicate data or corruption; `CacheFirst` for static app shell & fonts.
  - **IndexedDB Storage**: Local offline draft retention (`pwaStorage.ts`).
  - **Offline Alert Bar & Version Updates**: Amber top status bar during internet loss & user-controlled version update toasts.
- **Client-Side UI Security Protection**:
  - Intercepts and blocks right-click context menus (`contextmenu`) and DevTools inspection shortcuts (`F12`, `Ctrl+Shift+I`, `Ctrl+U`).

---

## 🚀 Available Scripts

In the `accreditOS-frontend` directory, you can run the following npm scripts:

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite development server on `http://localhost:8080` with Hot Module Replacement (HMR). |
| `npm run build` | Builds the application for production, outputting static files to the `dist/` directory. |
| `npm run lint` | Runs ESLint to check for code issues and styling standard violations. |
| `npm run preview` | Previews the locally built production build using Vite. |
| `npm run test` | Executes unit tests with Vitest. |

---

## 📂 Frontend Architecture

```text
accreditOS-frontend/
├── public/                # Static assets, template files (.pdf, .docx), and fonts (/assets/fonts/)
├── .env.example           # Example environment file
├── src/
│   ├── main.tsx           # App bootstrapping and mounting
│   ├── App.tsx            # Router layout setup and global providers
│   ├── index.css          # Global CSS, Tailwind configurations
│   │
│   ├── components/        # Reusable UI component modules
│   │   ├── layout/        # Sidebar, TopBar, DashboardLayout, Mobile Navigation
│   │   ├── pwa/           # PWAInstallDialog, PWAUpdateBanner, OfflineStatusBar
│   │   ├── ui/            # Atomic components (buttons, inputs, dialogs, etc.)
│   │   └── clients/       # Client views and forms
│   │
│   ├── hooks/
│   │   └── usePWA.ts      # PWA install prompt & network state hook
│   │
│   ├── lib/
│   │   ├── pwaStorage.ts  # Native IndexedDB draft retention helper
│   │   └── security.ts    # Right-click context menu & DevTools shortcut protection
│   │
│   ├── features/
│   │   ├── certificates/  # Certificate feature module
│   │   │   ├── components/# Grid & list views
│   │   │   ├── dialogs/   # Certificate detail & edit dialogs
│   │   │   ├── hooks/     # Action hooks (downloading, status changes)
│   │   │   ├── types/     # TypeScript interfaces
│   │   │   └── utils/     # Word (generateWordCertificate.ts) & PDF (generatePdfCertificate.ts) engines
│   │   ├── dashboard/     # Analytics and KPIs
│   │   └── finance/       # Invoices, expenses, receipts
```

For more detailed technical documentation on PDF and Word generation, see [`../docs/CERTIFICATE_GENERATION_GUIDE.md`](../docs/CERTIFICATE_GENERATION_GUIDE.md).
