# phloxCert_frontend

**Frontend web UI for the PhloxCert project (IOTA-based identity + notarization dashboard).**

This project is built with **Vite + React + TailwindCSS** and is the user-facing app that interacts with:
- the **backend API** (for auth + data fetching)
- the **IOTA wallet/dapp-kit** (for key signing and blockchain operations)

---

## 📦 Setup

### 1) Install packages
```bash
npm install
```

### 2) Configure environment
Create a `.env` file from the sample and update values:
```bash
cp .env.example .env
```

Then edit `.env` and set:
- `VITE_API_BASE_URL` → backend API URL (e.g. `http://localhost:8080`)
- `VITE_IOTA_NODE_URL` → local IOTA node (e.g. `http://127.0.0.1:9000`)
- `VITE_PACKAGE_ID` / `VITE_REGISTRY_ID` → the deployed registry contract


### 3) Run
```bash
npm run dev
```

Then open the URL that Vite prints in the terminal (usually `http://localhost:5173`).

---

## 🔍 What this project does

- Provides authentication via wallet signature (nonce challenge)
- **Public Verification Portal**: Dedicated `/landing/:address` route for consumers to verify establishment safety pulse.
- **On-Chain Audit**: Fetch and display the latest 3 certifications for any registered DID.
- **Zero-Login Integrity Check**: Integrated tools for document verification without requiring user wallets.
- Calls backend endpoints (`/auth/nonce`, `/auth/verify`, `/api/objects/:address`)
- Calls IOTA wallet / dapp-kit to submit transaction signatures when registering an identity

---

## 🧩 How to add a new environment variable
1. Add it to `.env.example`
2. Use it in the app via `import.meta.env.VITE_<NAME>`
3. Restart the dev server if it is running
