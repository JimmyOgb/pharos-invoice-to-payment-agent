import { describe, it } from 'node:test';
import assert from 'node:assert';
import { SAMPLE_INVOICES } from '../../src/samples/fixtures.ts';
import { parseInvoiceContent } from '../../src/parsers/index.ts';
import { validateInvoice } from '../../src/engine/validator.ts';
import { buildInvoiceTransaction } from '../../src/engine/txBuilder.ts';

describe('Sample Invoices End-to-End Workflows (Requirement 04)', () => {
  it('Sample 01: Valid JSON Pharos Native PROS Invoice', async () => {
    const fixture = SAMPLE_INVOICES.find((s) => s.id === 'sample-01-pharos-valid')!;
    const invoice = await parseInvoiceContent(fixture.content, fixture.fileName);
    const validation = validateInvoice(invoice, 1672);

    assert.strictEqual(validation.canPreparePayment, true);
    assert.strictEqual(validation.status, 'READY_FOR_TRANSACTION_PREPARATION');

    const card = buildInvoiceTransaction(invoice, validation);
    assert.strictEqual(card.tokenSymbol, 'PROS');
    assert.strictEqual(card.isNative, true);
    assert.strictEqual(card.calldataBreakdown.calldataCarriesReference, true);
  });

  it('Sample 02: Valid JSON Base USDC Invoice', async () => {
    const fixture = SAMPLE_INVOICES.find((s) => s.id === 'sample-02-base-usdc-valid')!;
    const invoice = await parseInvoiceContent(fixture.content, fixture.fileName);
    const validation = validateInvoice(invoice, 8453); // Base Mainnet

    assert.strictEqual(validation.canPreparePayment, true);
    const card = buildInvoiceTransaction(invoice, validation);
    assert.strictEqual(card.tokenSymbol, 'USDC');
    assert.strictEqual(card.isNative, false);
    assert.strictEqual(card.calldataBreakdown.calldataCarriesReference, false);
    assert.strictEqual(card.referenceEncoding.tier, 'PAYMENT_RECORD_METADATA');
  });

  it('Sample 03: Valid Plain Text Apex Security Invoice', async () => {
    const fixture = SAMPLE_INVOICES.find((s) => s.id === 'sample-03-plain-text-valid')!;
    const invoice = await parseInvoiceContent(fixture.content, fixture.fileName);
    assert.strictEqual(invoice.format, 'TEXT');

    const validation = validateInvoice(invoice, 1672);
    assert.strictEqual(validation.canPreparePayment, true);

    const card = buildInvoiceTransaction(invoice, validation);
    assert.strictEqual(card.amountFormatted, '50.00');
    assert.strictEqual(card.invoiceReference, 'REF-SEC-4921');
  });

  it('Sample 04: Unsupported Currency DOGE flags mismatch without guessing', async () => {
    const fixture = SAMPLE_INVOICES.find((s) => s.id === 'sample-04-mismatch-unsupported-token')!;
    const invoice = await parseInvoiceContent(fixture.content, fixture.fileName);
    const validation = validateInvoice(invoice, 1672);

    assert.strictEqual(validation.canPreparePayment, false);
    assert.strictEqual(validation.status, 'UNSUPPORTED_ASSET');
    assert.ok(validation.issues.some((i) => i.code === 'UNSUPPORTED_TOKEN_ON_NETWORK'));
  });

  it('Sample 05: Missing fields text invoice is blocked by invariants', async () => {
    const fixture = SAMPLE_INVOICES.find((s) => s.id === 'sample-05-missing-fields-error')!;
    const invoice = await parseInvoiceContent(fixture.content, fixture.fileName);
    const validation = validateInvoice(invoice, 1672);

    assert.strictEqual(validation.canPreparePayment, false);
    assert.strictEqual(validation.status, 'NEEDS_USER_INPUT');
    assert.ok(validation.issues.some((i) => i.code === 'MISSING_PAYEE_ADDRESS'));
    assert.ok(validation.issues.some((i) => i.code === 'MISSING_INVOICE_REFERENCE'));
  });

  it('Sample 06: Burn address JSON invoice is strictly blocked', async () => {
    const fixture = SAMPLE_INVOICES.find((s) => s.id === 'sample-06-zero-address')!;
    const invoice = await parseInvoiceContent(fixture.content, fixture.fileName);
    const validation = validateInvoice(invoice, 1672);

    assert.strictEqual(validation.canPreparePayment, false);
    assert.strictEqual(validation.status, 'INVALID_INVOICE');
    assert.ok(validation.issues.some((i) => i.code === 'ZERO_ADDRESS_FORBIDDEN'));
  });
});
