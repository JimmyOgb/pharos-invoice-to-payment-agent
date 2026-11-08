import type { ReferenceEncodingDetails } from './invoice.ts';

export interface UnsignedEip155Transaction {
  from?: `0x${string}`;
  to: `0x${string}`;
  value: `0x${string}`; // Hex wei
  data: `0x${string}`;  // Calldata (0xa9059cbb or 0x + utf8ToHex(ref))
  chainId: number;
}

export interface PreparedInvoiceActionCard {
  id: string;
  invoiceId: string;
  invoiceReference: string;
  payeeName: string;
  payeeAddress: `0x${string}`;
  tokenSymbol: string;
  tokenAddress: `0x${string}`;
  isNative: boolean;
  amountFormatted: string;
  amountBaseUnits: string;
  decimals: number;
  chainId: number;
  networkName: string;
  referenceEncoding: ReferenceEncodingDetails;
  unsignedTx: UnsignedEip155Transaction;
  functionSelector: string; // e.g. "0xa9059cbb" for ERC-20 transfer, or "NATIVE_TRANSFER"
  calldataBreakdown: {
    rawHex: `0x${string}`;
    methodDescription: string;
    memoFieldHex?: string;
    memoFieldUtf8?: string;
    calldataCarriesReference: boolean;
  };
  preparedAt: string;
}

export type PaymentExecutionStatus = 'PREPARED' | 'SUBMITTED' | 'PAID' | 'FAILED' | 'REJECTED';

export interface InvoicePaymentRecord {
  id: string;
  invoiceId: string;
  invoiceReference: string;
  payeeName: string;
  payeeAddress: `0x${string}`;
  amount: string;
  tokenSymbol: string;
  chainId: number;
  status: PaymentExecutionStatus;
  txHash?: `0x${string}`;
  explorerUrl?: string;
  failureReason?: string;
  createdAt: string;
}
