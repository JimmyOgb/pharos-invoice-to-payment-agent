# PHASE 2 — NEW PROJECT BASELINE & WORKSPACE VERIFICATION

**Product:** Pharos Invoice-to-Payment Agent  
**Challenge:** Pharos Agent Arena — Invoice-to-Payment Agent  
**Baseline Date:** November 8, 2026  
**Auditor / Engineering Role:** Antigravity AI Pair Programmer & Blockchain Engineer  

---

## 1. Project Identity & Isolation

To ensure that existing Pharos projects are strictly protected and never overwritten, this project is established as an independent, standalone repository and local directory.

| Attribute | Verified Specification |
|---|---|
| **Product Name** | Pharos Invoice-to-Payment Agent |
| **Local Workspace** | `C:\Users\NO GO NO\PharosBuild\skills\pharos-invoice-to-payment-agent` |
| **GitHub Repository** | `https://github.com/JimmyOgb/pharos-invoice-to-payment-agent` |
| **GitHub Owner** | `JimmyOgb` |
| **Intended Vercel Project** | `pharos-invoice-to-payment-agent` |
| **Intended Production URL** | `https://pharos-invoice-to-payment-agent.vercel.app/` |
| **Package Identity** | `pharos-invoice-to-payment-agent` (v1.0.0) |

---

## 2. Protection of Sibling Pharos Workspaces

The local workspace directory `C:\Users\NO GO NO\PharosBuild\skills\` was inspected before creating any new files. The existing sibling projects remain isolated and intact:

1. **`pharos-liquidation-watchdog`:**
   - Path: `C:\Users\NO GO NO\PharosBuild\skills\pharos-liquidation-watchdog`
   - Release Baseline: Commit `1b3d285`
   - Status: Untouched / Protected
2. **`pharos-natural-language-payment-agent`:**
   - Path: `C:\Users\NO GO NO\PharosBuild\skills\pharos-natural-language-payment-agent`
   - Release Baseline: Commit `9c638bf`
   - Status: Untouched / Protected
3. **`pharos-recurring-payment-agent`:**
   - Path: `C:\Users\NO GO NO\PharosBuild\skills\pharos-recurring-payment-agent`
   - Release Baseline: Commit `9d5b7b6`
   - Status: Untouched / Protected

---

## 3. Technology Stack & Dependencies

The new project will be built with a high-performance, $0-cost, modern Web3 stack:

- **Frontend Framework:** React 19 (`react`, `react-dom`)
- **Language & Tooling:** TypeScript 5.7+, Vite 6.1+
- **Styling & UI Components:** Tailwind CSS 3.4+, Lucide React (`lucide-react`)
- **Blockchain & Web3 Client:** Viem 2.23+ (`createPublicClient`, calldata encoders)
- **Document Ingestion:**
  - Standard JSON parser for structured e-invoices.
  - Native client-side PDF text extraction engine.
  - Plain-text payment request parser.
- **Testing Engine:** Node.js native test runner (`node --test`, `--experimental-strip-types`)
- **Hosting Target:** Vercel Edge Network
- **Live Demo Production:** `live-demo-video-generator` (Playwright Chromium + Edge-TTS + FFmpeg)

---

## 4. Verification Checkpoint

- [x] Workspace directory `pharos-invoice-to-payment-agent` created cleanly.
- [x] `docs/` and `samples/` subdirectories initialized.
- [x] Sibling workspaces verified as untouched.
- [x] Initial Phase 1 & Phase 2 audit deliverables authored.
