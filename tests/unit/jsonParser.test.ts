import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseJsonInvoice } from '../../src/parsers/jsonParser.ts';

describe('JSON Invoice Parser (Requirement 01)', () => {
  it('extracts all required fields from standard JSON e-invoice', () => {
    const rawJson = JSON.stringify({
      invoiceNumber: 'INV-2026-0042',
      payee: {
        name: 'Pharos Infrastructure DAO',
        address: '0x71C840A6B296d66e854898166D132c25C992fD49',
      },
      amount: '150.75',
      currencyOrToken: 'PROS',
      date: '2026-11-08',
    });

    const invoice = parseJsonInvoice(rawJson, 'test-invoice.json');

    assert.strictEqual(invoice.format, 'JSON');
    assert.strictEqual(invoice.invoiceReference.value, 'INV-2026-0042');
    assert.strictEqual(invoice.payeeName.value, 'Pharos Infrastructure DAO');
    assert.strictEqual(invoice.payeeAddress.value, '0x71C840A6B296d66e854898166D132c25C992fD49');
    assert.strictEqual(invoice.amount.value, '150.75');
    assert.strictEqual(invoice.currencyOrToken.value, 'PROS');
    assert.strictEqual(invoice.payeeAddress.confidence, 1.0);
    assert.strictEqual(invoice.payeeAddress.isUserEdited, false);
    assert.strictEqual(invoice.payeeAddress.originalExtractedValue, '0x71C840A6B296d66e854898166D132c25C992fD49');
  });

  it('handles alternative schema keys (vendor, walletAddress, totalAmount, memo)', () => {
    const altJson = JSON.stringify({
      vendor: {
        name: 'CyberShield Systems',
        walletAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      },
      totalAmount: '2,500.00',
      tokenSymbol: 'USDC',
      memo: 'REF-SECURITY-991',
    });

    const invoice = parseJsonInvoice(altJson);

    assert.strictEqual(invoice.payeeName.value, 'CyberShield Systems');
    assert.strictEqual(invoice.payeeAddress.value, '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
    assert.strictEqual(invoice.amount.value, '2500.00');
    assert.strictEqual(invoice.currencyOrToken.value, 'USDC');
    assert.strictEqual(invoice.invoiceReference.value, 'REF-SECURITY-991');
  });

  it('sets confidence to 0 and value to null for absent fields without throwing', () => {
    const emptyJson = JSON.stringify({
      description: 'Consulting fees',
    });

    const invoice = parseJsonInvoice(emptyJson);

    assert.strictEqual(invoice.payeeAddress.value, null);
    assert.strictEqual(invoice.payeeAddress.confidence, 0);
    assert.strictEqual(invoice.amount.value, null);
    assert.strictEqual(invoice.invoiceReference.value, null);
  });
});
