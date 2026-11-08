# Phase 9: Automated Acceptance Test Report

## 1. Executive Summary

- **Product:** Pharos Invoice-to-Payment Agent
- **Execution Date:** 2026-11-08
- **Test Runner:** Node.js native test runner (`node --experimental-strip-types --test`)
- **Total Test Suites:** 6
- **Total Tests Executed:** 19
- **Passing Tests:** 19 (100%)
- **Failing Tests:** 0 (0%)
- **Execution Duration:** 3.37 seconds

---

## 2. Requirement Verification Matrix

| Req ID | Description | Test Suite | Pass/Fail | Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **Req-01** | Extracts payee, amount, token/currency, and reference from ≥2 invoice formats (JSON, Text, PDF) | `tests/unit/jsonParser.test.ts`, `tests/unit/textParser.test.ts` | **PASS** | Tests verify full extraction across JSON schemas and text/regex streams with confidence scoring and source tracing. |
| **Req-02** | Flags mismatches or missing fields instead of guessing | `tests/unit/validator.test.ts` | **PASS** | Invariants enforce strict rejection for missing addresses, zero address, unsupported tokens (e.g. DOGE), missing references, and decimal overflow. |
| **Req-03** | Produces a payment summary and unsigned transaction including invoice reference | `tests/unit/txBuilder.test.ts` | **PASS** | Verifies Native calldata UTF-8 hex memo vs clean 68-byte standard ERC-20 transfer with metadata binding. |
| **Req-04** | Includes a demo with sample invoices | `tests/integration/sampleWorkflows.test.ts` | **PASS** | Tests end-to-end processing across all 6 sample fixtures (valid native, valid ERC-20, text format, mismatch token, missing fields blocker, zero address blocker). |

---

## 3. Test Suites Detailed Breakdown

### Suite 1: `tests/integration/sampleWorkflows.test.ts`
- ✔ Sample 01: Valid JSON Pharos Native PROS Invoice (Status: `READY_FOR_TRANSACTION_PREPARATION`, Native calldata carries memo)
- ✔ Sample 02: Valid JSON Base USDC Invoice (Status: `READY_FOR_TRANSACTION_PREPARATION`, Standard ERC-20 68-byte calldata, metadata memo binding)
- ✔ Sample 03: Valid Plain Text Apex Security Invoice (Status: `READY_FOR_TRANSACTION_PREPARATION`, Text regex parsed)
- ✔ Sample 04: Unsupported Currency DOGE flags mismatch without guessing (Status: `UNSUPPORTED_ASSET`, `UNSUPPORTED_TOKEN_ON_NETWORK`)
- ✔ Sample 05: Missing fields text invoice is blocked by invariants (Status: `NEEDS_USER_INPUT`, `MISSING_PAYEE_ADDRESS`, `MISSING_INVOICE_REFERENCE`)
- ✔ Sample 06: Burn address JSON invoice is strictly blocked (Status: `INVALID_INVOICE`, `ZERO_ADDRESS_FORBIDDEN`)

### Suite 2: `tests/unit/jsonParser.test.ts`
- ✔ Extracts all required fields from standard JSON e-invoice
- ✔ Handles alternative schema keys (`vendor`, `walletAddress`, `totalAmount`, `memo`)
- ✔ Sets confidence to 0 and value to null for absent fields without throwing

### Suite 3: `tests/unit/textParser.test.ts`
- ✔ Extracts all fields from structured plain text / markdown invoices
- ✔ Handles multiline unstructured text with inline addresses and amounts

### Suite 4: `tests/unit/txBuilder.test.ts`
- ✔ Constructs native transfer with invoice reference encoded in calldata memo (`0x` + UTF-8 hex)
- ✔ Constructs standard ERC-20 transfer with clean 68-byte calldata and metadata memo binding

### Suite 5: `tests/unit/validator.test.ts`
- ✔ Passes validation for completely valid Pharos PROS invoice
- ✔ Rejects burn zero address strictly
- ✔ Flags unsupported token instead of silently guessing or defaulting
- ✔ Flags missing payee address and missing invoice reference
- ✔ Enforces token decimal limits (e.g. 6 decimals for USDC)

### Suite 6: `tests/unit/smoke.test.ts`
- ✔ Runs successfully with strip-types
