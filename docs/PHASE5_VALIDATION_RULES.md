# Phase 5: Invoice Validation Rules Specification

## 1. Overview and Core Philosophy

In financial and on-chain payment processing, **guessing is strictly prohibited**. The Pharos Invoice-to-Payment Agent enforces an explicit, zero-simulation validation pipeline that:
1. Validates every extracted field against cryptographic, numeric, and network invariants.
2. Distinguishes hard blockers (`CRITICAL`), soft discrepancies (`WARNING`), and advisory information (`INFO`).
3. Flags all missing, malformed, or ambiguous fields with actionable remediation guidance.
4. Distinguishes between values directly parsed from documents and values edited by the user.

---

## 2. Exhaustive Validation Matrix

| Field | Rule Code | Severity | Trigger Condition | System Behavior | Suggested Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Chain ID** | `UNSUPPORTED_CHAIN` | `CRITICAL` | Selected network not in registry (1672, 8453, 688689) | Rejects transaction preparation | Switch to supported network |
| **Payee Address** | `MISSING_PAYEE_ADDRESS` | `CRITICAL` | Extracted address is null, empty, or whitespace | Rejects transaction preparation | Provide recipient 0x address |
| **Payee Address** | `INVALID_PAYEE_ADDRESS_FORMAT` | `CRITICAL` | String does not match 40-hex-character EVM address regex | Rejects transaction preparation | Correct address to valid 0x format |
| **Payee Address** | `ZERO_ADDRESS_FORBIDDEN` | `CRITICAL` | Address equals `0x0000000000000000000000000000000000000000` | Rejects transaction preparation | Provide non-burn destination |
| **Payee Name** | `MISSING_PAYEE_NAME` | `WARNING` | Vendor/organization name missing | Allows preparation with notice | Add vendor name for accounting |
| **Currency/Token** | `MISSING_CURRENCY` | `CRITICAL` | Currency field empty or undefined | Rejects transaction preparation | Select settlement token |
| **Currency/Token** | `FIAT_CURRENCY_REQUIRES_TOKEN_MAPPING`| `WARNING` | Currency is USD, EUR, GBP | Flags fiat denomination | Map to USDC or PROS |
| **Currency/Token** | `UNSUPPORTED_TOKEN_ON_NETWORK` | `CRITICAL` | Token not registered on chosen chain | Rejects transaction preparation | Switch chain or pick supported asset |
| **Amount** | `MISSING_AMOUNT` | `CRITICAL` | Amount field null or empty | Rejects transaction preparation | Enter payment amount |
| **Amount** | `INVALID_AMOUNT` | `CRITICAL` | Amount <= 0 or not a parseable float | Rejects transaction preparation | Enter positive number |
| **Amount** | `EXCESSIVE_DECIMALS` | `CRITICAL` | Decimal places exceed token decimals (e.g. >6 for USDC) | Rejects transaction preparation | Round to allowed precision |
| **Amount** | `AMOUNT_CONVERSION_FAILED` | `CRITICAL` | BigInt conversion throws in viem | Rejects transaction preparation | Check amount string |
| **Reference** | `MISSING_INVOICE_REFERENCE` | `CRITICAL` | Invoice ID or memo is empty | Rejects transaction preparation | Supply reference number |
| **Reference** | `DUPLICATE_INVOICE_REFERENCE` | `WARNING` | Reference already recorded in local ledger | Allows prep with collision warning | Verify not accidental duplicate |

---

## 3. Validation Status States

- `READY_FOR_TRANSACTION_PREPARATION`: All invariants met. 0 critical issues. Payment can be constructed immediately.
- `READY_FOR_REVIEW`: Invariants met, but minor warnings present (e.g., missing vendor label or duplicate reference).
- `NEEDS_USER_INPUT`: Missing required fields (e.g., missing amount, missing address, missing reference).
- `MISMATCH_DETECTED`: Conflicts between invoice data and network parameters.
- `UNSUPPORTED_ASSET`: Token requested is unavailable on the selected blockchain.
- `INVALID_INVOICE`: Critical address or syntax corruption.
