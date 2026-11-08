# PHASE 1 — OFFICIAL TASK AND RESOURCE AUDIT

**Target Challenge:** Pharos Agent Arena — Invoice-to-Payment Agent  
**Official Arena URL:** [https://pharos-agent-arena.vercel.app/tasks/invoice-to-payment-agent](https://pharos-agent-arena.vercel.app/tasks/invoice-to-payment-agent)  
**Audit Date:** November 8, 2026  
**Auditor / Engineering Role:** Antigravity AI Pair Programmer & Blockchain Engineer  
**Status:** **AUDIT COMPLETED — NO BLOCKERS IDENTIFIED**

---

## 1. Official Arena Task Inspection & Requirements

The official Pharos Agent Arena challenge was inspected directly on the live production Arena platform.

### Task Metadata
- **Task Title:** `INVOICE-TO-PAYMENT AGENT`
- **Domain / Category:** `PAYMENTS`
- **Difficulty Tier:** `MEDIUM`
- **Point Allocation:** `100 Points` (Task Completion) + `50 Points` (Video Walkthrough) = `150 Points Total`
- **Platform Reference:** `ai.pharos.xyz`

### Official Task Description
> *"Reads an invoice/request and prepares the matching payment."*  
> *"What you'll build: An agent that reads an invoice or payment request (text, PDF or structured data) and prepares the matching on-chain payment."*

### The Four Non-Negotiable Acceptance Requirements
Reviewers and automated judges score submissions against these exact four criteria:

| # | Requirement | Official Text |
|:---:|---|---|
| **01** | **Multi-Format Extraction** | *Extracts payee, amount, token or currency, and reference from at least 2 invoice formats.* |
| **02** | **Deterministic Validation & Mismatch Flagging** | *Flags mismatches or missing fields instead of guessing.* |
| **03** | **Summary & Unsigned Tx with Reference** | *Produces a payment summary and an unsigned transaction that includes the invoice reference.* |
| **04** | **Demonstration with Sample Invoices** | *Includes a demo with sample invoices.* |

### Official Submission Requirements
1. **Proof Link:** A live URL reviewers can open (e.g., deployed demo on Vercel or share link from `ai.pharos.xyz`).
2. **Repository Link:** A public GitHub repository containing documented source code.
3. **Optional Walkthrough Video:** A professional demonstration video (+50 points).

---

## 2. Official Pharos Resources Audit

### 2.1 Pharos AI Hub (`https://ai.pharos.xyz/`)
- Pharos AI Hub provides developer tooling and workflow orchestration for building agent-native applications on Pharos Network.
- Key principles emphasized:
  - Transparent agent reasoning and validation.
  - Separation of interpretation from financial execution.
  - Integration with Pharos canonical contracts and registries.

### 2.2 Pharos Documentation (`https://docs.pharos.xyz/`)
- **Pharos Pacific Mainnet:**
  - Chain ID: `1672` (`0x688`)
  - Native Gas Token: `PROS` (18 decimals)
  - Public RPC Endpoint: `https://rpc.pharos.xyz`
  - Block Explorer: `https://www.pharosscan.xyz`
- **Pharos Atlantic Testnet:**
  - Chain ID: `688689` (`0xa8231`)
  - Native Gas Token: `PROS` (18 decimals)
  - Public RPC Endpoint: `https://atlantic.dplabs-internal.com`
  - Block Explorer: `https://atlantic.pharosscan.xyz/`
- **Base Mainnet (Multi-Chain Support):**
  - Chain ID: `8453` (`0x2105`)
  - Native Currency: `ETH` (18 decimals)
  - Public RPC Endpoint: `https://mainnet.base.org`
  - Canonical USDC: `0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` (6 decimals)

### 2.3 Pharos x402 Protocol (`https://docs.pharos.xyz/developer-guide/x402`)
- **Analysis:** x402 is an HTTP 402 "Payment Required" micropayment specification designed for paywalling web endpoints and AI agent API queries per-request.
- **Invoice Context:** Standard enterprise invoices are distinct from HTTP 402 request headers. While x402 handles API micropayment streams, an Invoice-to-Payment Agent processes commercial invoices (PDFs, JSON, CSV, plain text) and compiles standard on-chain settlements containing immutable invoice references.

---

## 3. Technical Strategy: Parsing, Validation & Payment Preparation

### 3.1 Multi-Format Extraction Architecture (Requirement 01)
To satisfy and exceed Requirement 01 ($0-first, zero paid OCR APIs), the application will implement client-side, zero-dependency document parsers for **three** distinct formats:
1. **Format A: Structured JSON Invoices:**
   - Universal digital invoice format (RFC-standard / e-invoice JSON).
   - Extracts: `payee.name`, `payee.address`, `payment.amount`, `payment.currency`, `invoice.number` / `reference`, `dates.due`.
2. **Format B: PDF Invoices:**
   - Real client-side text-stream parsing (via `pdfjs-dist` or browser PDF rendering pipelines).
   - Regex and structural layout heuristics extract payee name, EVM address (`0x[a-fA-F0-9]{40}`), numeric amounts, currency symbols, and invoice references.
3. **Format C: Plain-Text / Markdown Payment Requests:**
   - Natural-language and formatted copy-pasted invoice requests.
   - Deterministic entity extraction identifies payment components with evidence tracking.

### 3.2 Deterministic Validation Engine (Requirement 02)
Instead of LLM hallucinations or guessing missing values:
- Missing payee address -> Flags `MISSING_PAYEE_ADDRESS` and requires explicit user input.
- Missing amount -> Flags `MISSING_AMOUNT`.
- Unrecognized currency (e.g. "EUR", "GBP" without token mapping) -> Flags `UNRESOLVED_TOKEN_MAPPING`.
- EVM Address format invalid or zero address -> Flags `INVALID_RECIPIENT_ADDRESS`.
- Ambiguous invoice references -> Flags `AMBIGUOUS_INVOICE_REFERENCE`.
- Duplicate invoice detection -> Inspects local ledger and flags `POTENTIAL_DUPLICATE_INVOICE`.

### 3.3 Transaction Preparation & Invoice Reference Encoding (Requirement 03)
EVM transactions must carry the invoice reference transparently:
- **Native Transfer (PROS / ETH):**
  - Transaction `to`: Verified payee address.
  - Transaction `value`: Exact amount converted to base units (wei) via integer BigInt math.
  - Transaction `data`: UTF-8 hex-encoded invoice reference (e.g., `0x` + utf8ToHex(`INV-2026-001`)).
- **ERC-20 Token Transfer (USDC / USDT):**
  - Transaction `to`: Token contract address (e.g. Circle USDC on Base `0x8335...`).
  - Standard calldata: `0xa9059cbb` (`transfer(address,uint256)`).
  - Invoice Reference binding: The invoice reference is prominently bound to the prepared EIP-155 transaction card metadata, and can be encoded in an explicit memo or invoice gateway router parameter.
  - Unsigned payload is displayed in human-readable and raw JSON formats for inspection prior to personal wallet confirmation.

### 3.4 Sample Invoices Demonstration (Requirement 04)
The application will include pre-loaded demonstration sample fixtures:
1. `samples/sample-invoice-valid.json`: Valid, fully formed JSON invoice ready for immediate transaction preparation.
2. `samples/sample-invoice-mismatch.json`: Demonstration fixture containing an address format error and currency mismatch.
3. `samples/sample-invoice-valid.pdf`: Authentic valid PDF invoice for testing file upload and PDF text extraction.
4. `samples/sample-invoice-missing-ref.pdf`: Demonstration fixture illustrating missing-field flagging.

---

## 4. Zero-Simulation & Non-Custodial Boundaries

- **Zero Simulation:** No mock transactions, fake balances, synthetic hashes, or fabricated OCR responses.
- **Zero Custody:** No private keys or seed phrases collected or stored anywhere.
- **Zero Cost ($0-first):** Completely free and local document parsing; no paid OpenAI or OCR subscription required.
