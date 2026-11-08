import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseTextInvoice } from '../../src/parsers/textParser.ts';

describe('Text & Line Invoice Parser (Requirement 01)', () => {
  it('extracts all fields from structured plain text / markdown invoices', () => {
    const rawText = `
INVOICE FOR PROFESSIONAL SERVICES
---------------------------------
Vendor: Apex Security Audits LLC
Invoice #: REF-SEC-4921
Date: 2026-11-08

Payment Details:
Payee Wallet Address: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
Total Amount: 50.00 PROS
Settlement Token: PROS
---------------------------------
    `;

    const invoice = parseTextInvoice(rawText, 'invoice.txt');

    assert.strictEqual(invoice.format, 'TEXT');
    assert.strictEqual(invoice.payeeName.value, 'Apex Security Audits LLC');
    assert.strictEqual(invoice.invoiceReference.value, 'REF-SEC-4921');
    assert.strictEqual(invoice.payeeAddress.value, '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC');
    assert.strictEqual(invoice.amount.value, '50.00');
    assert.strictEqual(invoice.currencyOrToken.value, 'PROS');
    assert.ok(invoice.payeeAddress.sourceLocation.includes('Line'));
    assert.ok(invoice.payeeAddress.confidence >= 0.8);
  });

  it('handles multiline unstructured text with inline addresses and amounts', () => {
    const rawText = `
Hi Team, please settle this payment for the Q3 audit:
Send 12.50 ETH to our address 0x90F79bf6EB2c4f870365E785982E1f101E93b906.
Payment Ref: AUDIT-2026-99
Thanks, Starlight Foundation
    `;

    const invoice = parseTextInvoice(rawText);

    assert.strictEqual(invoice.payeeAddress.value, '0x90F79bf6EB2c4f870365E785982E1f101E93b906');
    assert.strictEqual(invoice.invoiceReference.value, 'AUDIT-2026-99');
    assert.strictEqual(invoice.currencyOrToken.value, 'ETH');
  });
});
