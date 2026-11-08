import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseJsonInvoice } from '../../src/parsers/jsonParser.ts';
import { validateInvoice } from '../../src/engine/validator.ts';

describe('Validation Engine Invariants (Requirement 02)', () => {
  it('passes validation for completely valid Pharos PROS invoice', () => {
    const rawJson = JSON.stringify({
      invoiceNumber: 'INV-PHAROS-001',
      payee: {
        name: 'Pharos Node Corp',
        address: '0x71C840A6B296d66e854898166D132c25C992fD49',
      },
      amount: '125.50',
      currencyOrToken: 'PROS',
    });

    const invoice = parseJsonInvoice(rawJson);
    const result = validateInvoice(invoice, 1672);

    assert.strictEqual(result.canPreparePayment, true);
    assert.strictEqual(result.status, 'READY_FOR_TRANSACTION_PREPARATION');
    assert.strictEqual(result.isNative, true);
    assert.strictEqual(result.resolvedBaseUnits, 125500000000000000000n);
    assert.strictEqual(result.referenceEncoding.tier, 'CALLEDATA_HEX_MEMO');
    assert.strictEqual(result.referenceEncoding.calldataCarriesReference, true);
    assert.ok(result.referenceEncoding.encodedDataHex.startsWith('0x'));
  });

  it('rejects burn zero address strictly', () => {
    const rawJson = JSON.stringify({
      invoiceNumber: 'INV-BURN',
      payee: {
        address: '0x0000000000000000000000000000000000000000',
      },
      amount: '10.0',
      currencyOrToken: 'PROS',
    });

    const invoice = parseJsonInvoice(rawJson);
    const result = validateInvoice(invoice, 1672);

    assert.strictEqual(result.canPreparePayment, false);
    const issue = result.issues.find((i) => i.code === 'ZERO_ADDRESS_FORBIDDEN');
    assert.ok(issue);
    assert.strictEqual(issue.severity, 'CRITICAL');
  });

  it('flags unsupported token instead of silently guessing or defaulting', () => {
    const rawJson = JSON.stringify({
      invoiceNumber: 'INV-DOGE',
      payee: {
        address: '0x71C840A6B296d66e854898166D132c25C992fD49',
      },
      amount: '1000',
      currencyOrToken: 'DOGE',
    });

    const invoice = parseJsonInvoice(rawJson);
    const result = validateInvoice(invoice, 1672);

    assert.strictEqual(result.canPreparePayment, false);
    const issue = result.issues.find((i) => i.code === 'UNSUPPORTED_TOKEN_ON_NETWORK');
    assert.ok(issue);
    assert.strictEqual(issue.severity, 'CRITICAL');
  });

  it('flags missing payee address and missing invoice reference', () => {
    const rawJson = JSON.stringify({
      amount: '50.0',
      currencyOrToken: 'PROS',
    });

    const invoice = parseJsonInvoice(rawJson);
    const result = validateInvoice(invoice, 1672);

    assert.strictEqual(result.canPreparePayment, false);
    assert.ok(result.issues.some((i) => i.code === 'MISSING_PAYEE_ADDRESS'));
    assert.ok(result.issues.some((i) => i.code === 'MISSING_INVOICE_REFERENCE'));
  });

  it('enforces token decimal limits (e.g. 6 decimals for USDC)', () => {
    const rawJson = JSON.stringify({
      invoiceNumber: 'INV-USDC-PRECISION',
      payee: {
        address: '0x71C840A6B296d66e854898166D132c25C992fD49',
      },
      amount: '10.12345678', // 8 decimals (USDC only allows 6)
      currencyOrToken: 'USDC',
    });

    const invoice = parseJsonInvoice(rawJson);
    const result = validateInvoice(invoice, 1672);

    assert.strictEqual(result.canPreparePayment, false);
    const issue = result.issues.find((i) => i.code === 'EXCESSIVE_DECIMALS');
    assert.ok(issue);
  });
});
