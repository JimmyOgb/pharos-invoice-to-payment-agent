export interface SampleInvoiceFixture {
  id: string;
  title: string;
  format: 'JSON' | 'TEXT';
  description: string;
  expectedBehavior: 'VALID_NATIVE' | 'VALID_ERC20' | 'MISMATCH_TOKEN' | 'MISSING_FIELDS' | 'ZERO_ADDRESS';
  content: string;
  fileName: string;
}

export const SAMPLE_INVOICES: SampleInvoiceFixture[] = [
  {
    id: 'sample-01-pharos-valid',
    title: 'Pharos Infrastructure Invoice (JSON - PROS)',
    format: 'JSON',
    description: 'Valid JSON e-invoice requesting 125.50 PROS with calldata memo on Pharos Pacific.',
    expectedBehavior: 'VALID_NATIVE',
    fileName: 'sample-01-pharos-valid.json',
    content: `{
  "invoiceNumber": "INV-PHAROS-2026-001",
  "invoiceDate": "2026-11-08",
  "dueDate": "2026-11-22",
  "payee": {
    "name": "Pharos Core Infrastructure Labs",
    "address": "0x71C840A6B296d66e854898166D132c25C992fD49"
  },
  "recipient": {
    "name": "Pharos Community DAO"
  },
  "amount": "125.50",
  "currencyOrToken": "PROS",
  "memo": "Q4 RPC Node High-Availability Hosting",
  "status": "ISSUED"
}`,
  },
  {
    id: 'sample-02-base-usdc-valid',
    title: 'Base Cloud Solutions Invoice (JSON - USDC)',
    format: 'JSON',
    description: 'Valid JSON invoice requesting 500.00 USDC. Uses clean 68-byte calldata with memo bound to action metadata.',
    expectedBehavior: 'VALID_ERC20',
    fileName: 'sample-02-base-usdc-valid.json',
    content: `{
  "invoiceId": "INV-BASE-88310",
  "issueDate": "2026-11-05",
  "paymentDueDate": "2026-11-19",
  "vendor": {
    "name": "Base Cloud Solutions Inc",
    "walletAddress": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
  },
  "totalAmount": "500.00",
  "tokenSymbol": "USDC",
  "reference": "INV-BASE-88310",
  "description": "Enterprise API Gateway and RPC Relayer"
}`,
  },
  {
    id: 'sample-03-plain-text-valid',
    title: 'Apex Security Invoice (Plain Text - PROS)',
    format: 'TEXT',
    description: 'Valid plain-text invoice format with regex line parsing for payee, 50.00 PROS, and memo.',
    expectedBehavior: 'VALID_NATIVE',
    fileName: 'sample-03-plain-text-valid.txt',
    content: `========================================================
                 INVOICE FOR SERVICES
========================================================

Vendor: Apex Security Audits LLC
Date: 2026-11-08
Due Date: 2026-11-15
Invoice #: REF-SEC-4921

Client: Pharos Ecosystem Fund
Service Description: Smart Contract Threat Model & GenVM Formal Verification

Payment Details:
Payee Wallet Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Total Due: 50.00 PROS
Settlement Token: PROS
Memo: REF-SEC-4921

Please transfer exact amount before due date.
========================================================`,
  },
  {
    id: 'sample-04-mismatch-unsupported-token',
    title: 'Unsupported Currency Invoice (JSON - DOGE)',
    format: 'JSON',
    description: 'Invoice specifying DOGE currency. Validation engine flags token as unsupported rather than guessing.',
    expectedBehavior: 'MISMATCH_TOKEN',
    fileName: 'sample-04-mismatch-unsupported-token.json',
    content: `{
  "invoiceNumber": "INV-MISMATCH-9901",
  "payee": {
    "name": "Global Cross-Border Logistics",
    "address": "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
  },
  "amount": "250.00",
  "currency": "DOGE",
  "reference": "INV-MISMATCH-9901"
}`,
  },
  {
    id: 'sample-05-missing-fields-error',
    title: 'Incomplete Request (Plain Text - Missing Fields)',
    format: 'TEXT',
    description: 'Payment request missing both destination wallet address and invoice reference. Strict blocker.',
    expectedBehavior: 'MISSING_FIELDS',
    fileName: 'sample-05-missing-fields-error.txt',
    content: `PAYMENT REQUEST MEMO
--------------------
Vendor: Unknown Freelancer
Description: UI Mockup Design
Amount: 15.00 PROS

Notice: Please send the payment directly to our team.
(Notice: Wallet address and invoice reference number were not included!)
--------------------`,
  },
  {
    id: 'sample-06-zero-address',
    title: 'Burn Address Attack (JSON - Zero Address)',
    format: 'JSON',
    description: 'Invoice with 0x0000...0000 address. Strictly flagged with ZERO_ADDRESS_FORBIDDEN.',
    expectedBehavior: 'ZERO_ADDRESS',
    fileName: 'sample-06-zero-address.json',
    content: `{
  "invoiceNumber": "INV-BURN-000",
  "payee": {
    "name": "Corrupted Payee Record",
    "address": "0x0000000000000000000000000000000000000000"
  },
  "amount": "10.00",
  "currencyOrToken": "PROS",
  "reference": "INV-BURN-000"
}`,
  },
];
