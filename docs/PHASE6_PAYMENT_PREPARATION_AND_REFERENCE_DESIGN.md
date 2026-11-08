# Phase 6: Payment Preparation & Invoice Reference Architecture

## 1. The Core Architectural Distinction

A critical architectural mandate of the Pharos Invoice-to-Payment Agent is the rigorous separation between **Native Token Payments** and **ERC-20 Token Payments** regarding invoice reference encoding:

```
                            INVOICE REFERENCE DISPATCH
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
       Native Token Transfer                         ERC-20 Token Transfer
     (e.g., PROS, ETH, WPROS-native)                (e.g., USDC, WPROS, LINK)
                 │                                             │
      Tier 1: Calldata Hex Memo                    Tier 2: Action Card Metadata
                 │                                             │
      To: Payee Address                             To: Token Contract Address
      Value: Amount (Wei)                           Value: 0x0
      Data: 0x + utf8ToHex(ref)                     Data: 0xa9059cbb... (Clean 68 bytes)
      Carries Memo in Calldata: TRUE                Carries Memo in Calldata: FALSE
                                                    Invoice Ref Bound in Action Card/Ledger
```

---

## 2. Tier Breakdown

### Tier 1: Calldata Hex Memo (Native Tokens)
- **Networks:** Pharos Pacific (Chain ID: 1672), Base Mainnet (Chain ID: 8453), Pharos Atlantic (Chain ID: 688689).
- **Currencies:** `PROS`, `ETH`.
- **Mechanism:** Standard EVM transactions to an Externally Owned Account (EOA) accept arbitrary bytes in `data`. We encode the human-readable invoice reference into UTF-8 hex:
  ```ts
  const memoHex = '0x' + Buffer.from(reference, 'utf-8').toString('hex');
  ```
- **On-chain Evidence:** Block explorers (e.g. PharosScan, BaseScan) decode the input data directly as UTF-8 or hex, providing immutable proof linking the payment to the invoice reference.

### Tier 2: Payment Record Metadata (ERC-20 Standard Tokens)
- **Standard:** EIP-20 `transfer(address to, uint256 amount)`.
- **Selector:** `0xa9059cbb`.
- **Calldata Size:** Exactly 68 bytes (4-byte selector + 32-byte address + 32-byte integer).
- **Integrity Rule:** Appending arbitrary bytes to standard ERC-20 `transfer` calls violates the EIP-20 standard and can cause reverts, indexer incompatibilities, or security flags in wallet signers.
- **Reference Binding:** For ERC-20 payments, the agent explicitly binds the invoice reference to the **Prepared Action Card**, the **Unsigned Transaction Payload**, and the persistent **Invoice Payment Ledger** (`localStorage`). The UI explicitly notes that the calldata does not carry the memo.

### Tier 3: UI Display
- Human-readable rendering across the extraction view, validation warnings, action card header, and accounting history table.

---

## 3. Unsigned EIP-155 Transaction Structure

All prepared transactions conform to the canonical EIP-155 / EIP-1193 format:
```json
{
  "to": "0x...",
  "value": "0x...",
  "data": "0x...",
  "chainId": 1672
}
```
No autonomous signing is performed. The user connects their wallet (MetaMask, Coinbase Wallet, etc.) and explicitly reviews and signs the transaction.
