import { encodeFunctionData, parseAbi, toHex } from 'viem';
import type { ExtractedInvoice, InvoiceValidationResult } from '../types/invoice.ts';
import type { PreparedInvoiceActionCard, UnsignedEip155Transaction } from '../types/transaction.ts';
import { getNetworkConfig } from '../config/networks.ts';

const ERC20_ABI = parseAbi([
  'function transfer(address to, uint256 amount) returns (bool)',
]);

export function buildInvoiceTransaction(
  invoice: ExtractedInvoice,
  validation: InvoiceValidationResult
): PreparedInvoiceActionCard {
  if (!validation.canPreparePayment || !validation.resolvedPayee || !validation.resolvedBaseUnits || !validation.resolvedChainId || !validation.resolvedTokenSymbol) {
    throw new Error('Cannot prepare transaction: Invoice validation has critical errors.');
  }

  const network = getNetworkConfig(validation.resolvedChainId);
  const payeeAddress = validation.resolvedPayee;
  const baseUnits = validation.resolvedBaseUnits;
  const isNative = validation.isNative;
  const tokenSymbol = validation.resolvedTokenSymbol;
  const tokenAddress = validation.resolvedTokenAddress || '0x0000000000000000000000000000000000000000';
  const humanRef = invoice.invoiceReference.value || 'UNSPECIFIED_REFERENCE';

  let unsignedTx: UnsignedEip155Transaction;
  let functionSelector: string;
  let calldataBreakdown: PreparedInvoiceActionCard['calldataBreakdown'];

  if (isNative) {
    // Native gas transfer: To = payee, Value = base units, Data = utf-8 hex memo of invoice reference
    const memoHex = validation.referenceEncoding.encodedDataHex;

    unsignedTx = {
      to: payeeAddress,
      value: toHex(baseUnits),
      data: memoHex,
      chainId: validation.resolvedChainId,
    };

    functionSelector = 'NATIVE_TRANSFER';
    calldataBreakdown = {
      rawHex: memoHex,
      methodDescription: 'Native Gas Transfer with Invoice Reference in Calldata Memo',
      memoFieldHex: memoHex,
      memoFieldUtf8: humanRef,
      calldataCarriesReference: true,
    };
  } else {
    // ERC-20 transfer: To = Token contract, Value = 0, Data = transfer(payee, amount)
    const calldata = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [payeeAddress, baseUnits],
    });

    unsignedTx = {
      to: tokenAddress,
      value: '0x0',
      data: calldata,
      chainId: validation.resolvedChainId,
    };

    functionSelector = '0xa9059cbb'; // transfer(address,uint256)
    calldataBreakdown = {
      rawHex: calldata,
      methodDescription: 'ERC-20 transfer(address to, uint256 amount)',
      memoFieldHex: undefined,
      memoFieldUtf8: undefined,
      calldataCarriesReference: false,
    };
  }

  const actionCardId = `card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: actionCardId,
    invoiceId: invoice.id,
    invoiceReference: humanRef,
    payeeName: invoice.payeeName.value || 'Unspecified Payee',
    payeeAddress,
    tokenSymbol,
    tokenAddress,
    isNative,
    amountFormatted: invoice.amount.value || '0',
    amountBaseUnits: baseUnits.toString(),
    decimals: isNative ? network.nativeCurrency.decimals : 6,
    chainId: validation.resolvedChainId,
    networkName: network.networkName,
    referenceEncoding: validation.referenceEncoding,
    unsignedTx,
    functionSelector,
    calldataBreakdown,
    preparedAt: new Date().toISOString(),
  };
}
