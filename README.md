# ⚡ Tessux Digital - Automated Agency Invoice System

A tailored invoice generator and management system engineered specifically for **Tessux Digital**.

Built to handle professional service billing across:
- 📈 **Digital Marketing & SEO** (Retainers, Ad Spend Management, PPC, SMM)
- 🌐 **Websites & E-Commerce** (Custom Web Dev, Shopify, Landing Pages, Web Care)
- 💻 **Software & SaaS Development** (SaaS Architecture, API Sprints, Full-Stack Portals)
- 📱 **Mobile Apps** (iOS & Android MVP Milestones, Store Publishing)
- 🎪 **Event Planning & Management** (Corporate Event Staging, AV & Technical Production, Stage Backdrops)

---

## 🌟 Agency-Specific Features

### 1. 🎯 No Awkward Retail "QTY" – Service & Milestone Billing
- **Flexible Billing Units**:
  - `Fixed Scope` (Clean lump-sum / package pricing)
  - `Milestone` (e.g. Milestone 1: MVP Architecture, Milestone 2: Deployment)
  - `Month(s)` (for SEO, SMM, and retainer agreements)
  - `Hours` (for hourly development / time & materials)
  - `Days` (for on-site event management / technical staging)
  - `Campaign` (for multi-channel digital ad launches)
  - `Event` (for full-scale event coordination)
- **Table Layout Modes**:
  - **Deliverables & Period / Units** (Displays `#`, `DELIVERABLES & SCOPE`, `SAC`, `PERIOD / UNIT`, `FEE RATE`, `DISC`, `AMOUNT`)
  - **Fixed Milestone Scope** (Displays `#`, `DELIVERABLES & SCOPE`, `SAC`, `PHASE / MILESTONE`, `AMOUNT`) — *Hides rate and quantity completely for an executive proposal invoice!*

### 2. 📋 Project & Campaign Banner
Prominently features project context above the invoice deliverables:
- **Project Title**: e.g., `Fintech Mobile App & Q4 Digital Marketing Campaign`
- **Service Timeline**: e.g., `01 Nov 2026 – 30 Nov 2026` or `Phase 1 - 3 Sprints`

### 3. ⚡ 5 Curated Agency Service Presets
Includes 1-click preset buttons across all 5 Tessux Digital core domains:
- 📈 **Digital Marketing**: Social Media Marketing (SMM) Monthly Retainer, Meta & Google Ads Campaign Management, Technical SEO & Content Strategy, Influencer Marketing.
- 🌐 **Websites**: Custom Corporate Website Development, E-Commerce Web Portal, High-Converting Sales Landing Page, Annual Web Care & Cloud Hosting.
- 💻 **Software & SaaS**: Custom SaaS Architecture & Schema, Frontend Admin Dashboard & Client Portal, Microservices REST/GraphQL APIs, DevOps CI/CD Cloud Pipeline.
- 📱 **Mobile Apps**: Cross-Platform Mobile App (iOS & Android MVP), Mobile App UI/UX Figma Prototype, Push Notifications & Billing, App Store & Google Play Launch.
- 🎪 **Event Planning**: End-to-End Corporate Event Production & On-site Staging, AV Technical Sound & Lighting, Stage Backdrop & Motion Visuals, Digital Event Portal & QR Pass System.

### 4. 💰 Agency Cost Structure (Replaces Retail "Shipping")
- Dedicated input for **"Cloud Infrastructure / Meta & Google Ad Spend / Venue & Event Logistics Fees"** with customizable labeling.

### 5. 📱 Dynamic UPI QR Code & Bank Transfer
- Real-time scannable **UPI QR Code** embedded directly on the invoice (`upi://pay?pa=tessuxdigital@upi&...`).
- Full bank wire details (Bank Name, Account Number, IFSC, Branch, SWIFT/BIC).

### 6. 🎨 4 High-End Designer Templates & Color Accents
- **Tessux Studio**: Dark minimalist aesthetic matching your black-and-white logo.
- **Executive Modern**: Corporate colored banner with card badges.
- **GST Formal**: Comprehensive tax invoice structure with SAC codes and formal declarations.
- **Minimal Agency**: Ultra-clean Swiss typographic design.

### 7. 🖨️ PDF Download & Direct Print
- Formatted specifically for standard **A4 paper (210mm × 297mm)** with sharp vector typography and clean margins.

---

## 🚀 How to Run Locally

### Option A: Double-Click (Zero Setup Required)
Open `D:\invoice-template` and double-click `index.html`. It runs completely offline in any web browser.

### Option B: Local Node Server
```bash
npm start
# or
node server.js
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Step-by-Step Free Hosting Guide

### Method 1: Netlify (Drag & Drop – 30 Seconds)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag and drop the `D:\invoice-template` folder into the browser window.
3. You will receive an instant live HTTPS link (e.g. `https://tessux-invoices.netlify.app`).

### Method 2: Vercel (1-Click Deployment)
1. Push this folder to a GitHub repository:
   ```bash
   git add .
   git commit -m "feat: Agency-focused invoice system"
   git push -u origin main
   ```
2. Import the repository in [Vercel](https://vercel.com) and click **Deploy**.

### Method 3: GitHub Pages
1. Go to your repository settings on GitHub > **Pages**.
2. Select **Deploy from branch** (`main` / root `/`) and click **Save**.

---

© **Tessux Digital**. All rights reserved.
