# Sprout — Unified Home & Family Care

[![Live App](https://img.shields.io/badge/Live_App-sprout--live.web.app-4CAF50?style=for-the-badge)](https://sprout-live.web.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)

**Sprout** is a unified home, family, finance, and health management web application designed to bring harmony and clarity to household routines. It centralizes everyday operations—from budgets and tasks to medication schedules and family coordination—into an intuitive, secure, and responsive dashboard.

🌐 **Live Application:** [https://sprout-live.web.app](https://sprout-live.web.app)

---

## ✨ Key Features

- **🏠 Household & Family Coordination**
  - Seamless household creation and management with multi-member collaboration.
  - Secure invitation system via custom link and targeted email invitations.
  - Role-based permissions and member profile management.

- **💰 Finance & Budget Tracking**
  - Track household income, expenses, and categorize daily spending.
  - Visual analytics and breakdown charts powered by Recharts.
  - Budget limits, recurring expenses, and historical tracking.

- **💊 Health & Medication Care**
  - Detailed medication scheduling with dosage tracking and refill reminders.
  - Doctor appointments, medical notes, and family health records.
  - Quick-action shortcuts for medicine intake and health events.

- **📋 Tasks & Chores Management**
  - Shared family task boards, chore assignments, and due dates.
  - Priority flags, status filters, and real-time completion tracking.

- **🔒 Real-Time Cloud Synchronization & Security**
  - Built on Google Cloud / Firebase Firestore for real-time multi-device sync.
  - Firebase Authentication supporting Google Sign-In and email authentication.
  - Strict security rules with comprehensive automated unit testing.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Vite
- **Styling & UI:** Tailwind CSS, Lucide React, React Icons, Framer Motion
- **Data Visualization:** Recharts
- **Database & Auth:** Firebase Firestore, Firebase Authentication, Firebase Admin SDK
- **Testing:** Vitest, `@firebase/rules-unit-testing`

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18+ recommended)
- `npm` or `yarn`

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd sprout---unified-home---family-care
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the example environment file and provide your configuration:
   ```bash
   cp .env.example .env.local
   ```
   *(Optional)* For receipt and photo uploads:
   ```env
   VITE_IMGBB_API_KEY=your_imgbb_api_key
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000` (or the port indicated in the terminal).

---

## 📦 Scripts

- `npm run dev` — Starts the local Vite development server.
- `npm run build` — Compiles TypeScript and builds production assets into `dist/`.
- `npm run preview` — Locally previews the production build.
- `npm run lint` — Runs TypeScript type-checking (`tsc --noEmit`).
- `npm run test:rules` — Executes Firestore security rule unit tests via Vitest.

---

## 🌐 Deployment

The live application is hosted at:
👉 **[https://sprout-live.web.app](https://sprout-live.web.app)**
