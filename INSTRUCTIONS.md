# Blockchain Security DApp - Setup & Run Instructions

## Prerequisites
- **Node.js** (v14+ recommended)
- **Metamask** Browser Extension

## 1. Setup Dependencies
Open two terminal instances.

**Terminal 1 (Hardhat):**
```bash
cd hardhat
npm install
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm install
```

## 2. Start the Local Blockchain
In **Terminal 1**, start the Hardhat node:
```bash
npx hardhat node
```
*Keep this terminal running. It will display a list of 20 accounts with private keys.*

## 3. Deploy Contracts
Open a **new** terminal (or split Terminal 2) and run:
```bash
cd hardhat
npx hardhat run scripts/deploy.js --network localhost
```
*This will deploy `DataVault` and `SmartWallet` and log their addresses.*

## 4. Config Frontend & Listener
If you restarted the Hardhat node, the contract addresses may change.
- **Frontend**: Copy `DataVault` address -> `CONTRACT_ADDRESS` in `App.jsx`.
- **Listener**: Open `hardhat/scripts/listener.js` and update `const contractAddress = "..."` (or set `CONTRACT_ADDRESS` env var).

## 5. Start the Security Listener
In the **Hardhat Terminal** (or a new one):
```bash
cd hardhat
npx hardhat run scripts/listener.js --network localhost
```
*This script monitors the blockchain for `SecurityAlert` events.*

## 6. Start the Frontend
In **Terminal 2**, start the React app:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

## 7. Metamask Setup
1.  Open Metamask causing the "Connect" prompt (or click "Connect Link" in the DApp).
2.  Switch Network to **Localhost 8545** (Chain ID: 31337).
3.  **Import Account**:
    - Copy the **Private Key** of Account #0 from the Hardhat Terminal.
    - Metamask -> Account Menu -> Import Account -> Paste Private Key.
    - *Do this for Account #1 as well to test unauthorized access.*

## Features to Test
- **Simulated Login**: Use the sidebar to simulate *any* address and test access.
- **Smart Wallet**: Use the "Smart Wallet Proxy" panel to execute transactions via the contract wallet.
- **Ghost Mode**: Use the "Ghost Mode" panel to impersonate an address and simulate an attack.
