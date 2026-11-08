# Pharos Invoice-to-Payment Agent

> Agent-native invoice ingestion, zero-guessing validation, and unsigned on-chain transaction preparation with dual-tier reference binding for Pharos and Base networks.

[![Pharos Pacific](https://img.shields.io/badge/Network-Pharos%20Pacific%20(1672)-06b6d4?style=flat-square)](https://docs.pharos.xyz)
[![Base Mainnet](https://img.shields.io/badge/Network-Base%20Mainnet%20(8453)-3b82f6?style=flat-square)](https://basescan.org)
[![React 19](https://img.shields.io/badge/Frontend-React%2019-61dafb?style=flat-square)](https://react.dev)
[![Viem](https://img.shields.io/badge/EVM%20Client-Viem%202.x-black?style=flat-square)](https://viem.sh)
[![Zero Simulation](https://img.shields.io/badge/Policy-Zero%20Simulation-emerald?style=flat-square)](#zero-simulation-policy)
[![Tests](https://img.shields.io/badge/Acceptance%20Tests-19%2F19%20Passing-success?style=flat-square)](#acceptance-tests)

---

## 1. Overview & Official Task Alignment

Built for the official **Pharos Agent Arena — Invoice-to-Payment Agent** challenge:
- **Task Page:** [Pharos Agent Arena — Invoice-to-Payment Agent](https://pharos-agent-arena.vercel.app/tasks/invoice-to-payment-agent)
- **Production Application:** [https://pharos-invoice-to-payment-agent.vercel.app](https://pharos-invoice-to-payment-agent.vercel.app)
- **Official Pharos AI Hub:** [https://ai.pharos.xyz](https://ai.pharos.xyz)
- **Official Pharos Documentation:** [https://docs.pharos.xyz](https://docs.pharos.xyz)
- **Pharos Block Explorer:** [https://www.pharosscan.xyz](https://www.pharosscan.xyz)

The agent solves the real-world operational bottleneck of processing commercial invoices into verifiable on-chain disbursements without custodial key risk or simulated shortcuts.

---

## 2. The Four Acceptance Requirements

| Requirement ID | Official Specification | Implementation & Proof |
| :--- | :--- | :--- |
| **Req-01** | **Multi-Format Extraction:** Extracts payee, amount, token/currency, and reference from at least 2 invoice formats. | Ingests **JSON e-invoices**, **PDF documents** (via `pdfjs-dist`), and **plain-text / markdown / email payment requests**. Traces exact source location (e.g. `JSON path: payee.address` or `Line 8: "Payee: 0x..."`) and confidence scores. |
| **Req-02** | **Zero-Guessing Validation Engine:** Flags mismatches or missing fields instead of guessing. | Evaluates cryptographic address validity, zero-address burn protection, supported network tokens, decimal precision limits, and invoice reference presence. Hard blockers stop transaction generation; warnings guide user correction. |
| **Req-03** | **Dual-Tier Invoice Reference Binding:** Produces a payment summary and matching unsigned on-chain transaction that includes the invoice reference. | **Native Transfers (`PROS`, `ETH`):** Invoice reference is hex-encoded UTF-8 in transaction `data`.<br>**ERC-20 Transfers (`USDC`, `WPROS`):** Standard clean 68-byte calldata `0xa9059cbb`, reference bound to Action Card metadata. Discloses contract standard limitations. |
| **Req-04** | **Interactive Demo with Sample Invoices:** Includes a demo with preset sample invoices. | Ships with 6 pre-loaded interactive test invoices covering valid native payments, valid ERC-20 payments, text formats, currency mismatches (DOGE), incomplete requests, and burn address attacks. |

---

## 3. Architecture & Dual-Tier Reference Binding

A fundamental engineering principle of this agent is **never fabricating calldata memos where unsupported**:

```
                         INCOMING INVOICE DOCUMENT
                      (JSON / PDF / Plain-Text / Markdown)
                                     │
                        ┌────────────┴────────────┐
                        ▼                         ▼
                 Structured JSON             Text / PDF Stream
                 Path Extraction             Regex Extraction
                        │                         │
                        └────────────┬────────────┘
                                     ▼
                        EXTRACTION & AUDIT REGISTRY
                       (Source Tracing & Confidence)
                                     │
                                     ▼
                        INVARIANT VALIDATION ENGINE
               (Zero Guessing • Address Verification • Decimals)
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
         Native Gas Transfers               Standard ERC-20 Tokens
        (PROS on 1672 / ETH on 8453)           (USDC, WPROS, LINK)
                    │                                 │
         Tier 1: Calldata Hex Memo          Tier 2: Action Card Metadata
                    │                                 │
         To: Payee Address                  To: Token Contract Address
         Value: Amount in Wei               Value: 0x0
         Data: 0x + utf8ToHex(ref)          Data: 0xa9059cbb... (68 Bytes)
         Carries Memo in Data: TRUE         Carries Memo in Data: FALSE
                    │                                 │
                    └────────────────┬────────────────┘
                                     ▼
                       EIP-1193 UNSIGNED TRANSACTION
                    (Non-Custodial Browser Wallet Signing)
```

### Reference Encoding Details
- **Tier 1 (Calldata Hex Memo):** For native payments (`PROS`, `ETH`), the invoice reference string (e.g., `INV-PHAROS-2026-001`) is converted to UTF-8 hex (`0x494e56...`) and placed in `data`. Block explorers decode this directly.
- **Tier 2 (Payment Record Metadata):** Standard EIP-20 `transfer(address to, uint256 amount)` defines no memo field. Appending arbitrary memo bytes corrupts EVM calldata decoding. The agent binds the reference to the action card, unsigned transaction record, and browser ledger while disclosing the specification limitation.

---

## 4. Supported Blockchain Networks

| Network Name | Chain ID | Native Gas Token | Verified Tokens | RPC URL |
| :--- | :--- | :--- | :--- | :--- |
| **Pharos Pacific Mainnet** | `1672` | `PROS` (18 decimals) | `PROS`, `USDC` (`0xc879...1815`), `WPROS`, `LINK` | `https://rpc.pharos.xyz` |
| **Base Mainnet** | `8453` | `ETH` (18 decimals) | `ETH`, `USDC` (`0x8335...2913`), `WETH` | `https://mainnet.base.org` |
| **Pharos Atlantic Testnet** | `688689` | `PROS` (18 decimals) | `PROS`, `USDC` (`0xcfC8...Fc8B`) | `https://atlantic.dplabs-internal.com` |

---

## 5. Zero-Simulation Policy

This application implements **$0-First Zero-Simulation**:
- **No Mock Hashes:** Transaction hashes are only produced when a connected wallet actually signs and submits to a live RPC.
- **No Simulated Balances:** Wallet balances are read live on-chain via `eth_getBalance` and ERC-20 `balanceOf`.
- **No Private Key Custody:** The agent never asks for, handles, or stores private keys. Signing is delegated exclusively to EIP-1193 standard providers (MetaMask, Coinbase Wallet, Rabby).
- **No Speculative Transaction Preparation:** Incomplete or corrupted invoices are blocked with explicit remediation instructions.

---

## 6. Installation & Verification

### Prerequisites
- Node.js >= 20 (Node 24 recommended)
- npm >= 10

### Setup
```bash
git clone https://github.com/JimmyOgb/pharos-invoice-to-payment-agent.git
cd pharos-invoice-to-payment-agent
npm install
```

### Run Automated Acceptance Tests
```bash
npm test
```
*Executes all 19 unit and integration tests with 100% pass rate.*

### Local Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

---

## 7. License

MIT License. Designed and engineered for the Pharos Agent Arena ecosystem.
