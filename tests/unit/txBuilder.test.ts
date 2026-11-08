import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseJsonInvoice } from '../../src/parsers/jsonParser.ts';
import { validateInvoice, stringToHexData } from '../../src/engine/validator.ts';
import { buildInvoiceTransaction } from '../../src/engine/txBuilder.ts';

describe('Transaction Builder & Reference Encoding (Requirement 03)', () => {
  it('constructs native transfer with invoice reference encoded in calldata memo', () => {
    const rawJson = JSON.stringify({
      invoiceNumber: 'INV-PHAROS-NATIVE-77',
      payee: {
        name: 'Pharos Node Team',
        address: '0x71C840A6B296d66e854898166D132c25C992fD49',
      },
      amount: '2.5',
      currencyOrToken: 'PROS',
    });

    const invoice = parseJsonInvoice(rawJson);
    const validation = validateInvoice(invoice, 1672);
    const card = buildInvoiceTransaction(invoice, validation);

    assert.strictEqual(card.payeeAddress.toLowerCase(), '0x71C840A6B296d66e854898166D132c25C992fD49'.toLowerCase());
    assert.strictEqual(card.tokenSymbol, 'PROS');
    assert.strictEqual(card.isNative, true);
    assert.strictEqual(card.functionSelector, 'NATIVE_TRANSFER');

    // Unsigned transaction verification
    assert.strictEqual(card.unsignedTx.to.toLowerCase(), '0x71C840A6B296d66e854898166D132c25C992fD49'.toLowerCase());
    assert.strictEqual(card.unsignedTx.value, '0x22b1c8c1227a0000'); // 2.5 * 10^18 in hex
    assert.strictEqual(card.unsignedTx.chainId, 1672);

    // Invoice reference memo verification
    const expectedHexMemo = stringToHexData('INV-PHAROS-NATIVE-77');
    assert.strictEqual(card.unsignedTx.data, expectedHexMemo);
    assert.strictEqual(card.calldataBreakdown.calldataCarriesReference, true);
    assert.strictEqual(card.calldataBreakdown.memoFieldUtf8, 'INV-PHAROS-NATIVE-77');
  });

  it('constructs standard ERC-20 transfer with clean 68-byte calldata and metadata memo binding', () => {
    const rawJson = JSON.stringify({
      invoiceNumber: 'INV-BASE-USDC-99',
      vendor: {
        name: 'Base Infra Corp',
        address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
      },
      amount: '100.00',
      currencyOrToken: 'USDC',
    });

    const invoice = parseJsonInvoice(rawJson);
    const validation = validateInvoice(invoice, 8453); // Base Mainnet
    const card = buildInvoiceTransaction(invoice, validation);

    assert.strictEqual(card.tokenSymbol, 'USDC');
    assert.strictEqual(card.isNative, false);
    assert.strictEqual(card.functionSelector, '0xa9059cbb');

    // To is the USDC token contract on Base
    assert.strictEqual(card.unsignedTx.to.toLowerCase(), '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913'.toLowerCase());
    assert.strictEqual(card.unsignedTx.value, '0x0');
    assert.strictEqual(card.unsignedTx.chainId, 8453);

    // Calldata must be exactly 68 bytes (138 hex chars including '0x')
    assert.ok(card.unsignedTx.data.startsWith('0xa9059cbb'));
    assert.strictEqual(card.unsignedTx.data.length, 138);

    // Reference is NOT in calldata, but bound in metadata
    assert.strictEqual(card.calldataBreakdown.calldataCarriesReference, false);
    assert.strictEqual(card.referenceEncoding.tier, 'PAYMENT_RECORD_METADATA');
    assert.strictEqual(card.invoiceReference, 'INV-BASE-USDC-99');
    assert.ok(card.referenceEncoding.contractMethodLimitationDisclosed?.includes('Standard ERC-20'));
  });
});
