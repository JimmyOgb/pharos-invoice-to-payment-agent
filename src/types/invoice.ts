/**
 * Comprehensive types for Invoice extraction, validation, and reference tracking
 */

export type InvoiceFormat = 'JSON' | 'PDF' | 'TEXT';

export type ExtractionMethod = 'STRUCTURED_JSON' | 'PDF_STREAM' | 'TEXT_REGEX';

export interface ExtractedField<T> {
  value: T | null;
  rawString: string;
  sourceLocation: string; // e.g. "JSON path: payee.address" or "PDF text line: Invoice #"
  extractionMethod: ExtractionMethod;
  confidence: number; // 0.0 to 1.0
  isUserEdited: boolean;
  originalExtractedValue: T | null;
}

export interface ExtractedInvoice {
  id: string;
  format: InvoiceFormat;
  fileName: string;
  fileSizeBytes: number;
  rawContentPreview: string;
  payeeName: ExtractedField<string>;
  payeeAddress: ExtractedField<`0x${string}`>;
  amount: ExtractedField<string>;
  currencyOrToken: ExtractedField<string>;
  invoiceReference: ExtractedField<string>;
  invoiceDate?: ExtractedField<string>;
  dueDate?: ExtractedField<string>;
  parsedAt: string;
}

export type ValidationSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface ValidationIssue {
  code: string;
  field: string;
  severity: ValidationSeverity;
  message: string;
  suggestedAction?: string;
}

export type ValidationStatus =
  | 'READY_FOR_TRANSACTION_PREPARATION'
  | 'READY_FOR_REVIEW'
  | 'NEEDS_USER_INPUT'
  | 'MISMATCH_DETECTED'
  | 'UNSUPPORTED_ASSET'
  | 'INVALID_INVOICE';

/**
 * Three distinct tiers of invoice reference binding (never conflated)
 */
export type InvoiceReferenceTier =
  | 'CALLEDATA_HEX_MEMO'        // Native transfer: 0x + utf8ToHex(reference) in transaction data
  | 'PAYMENT_RECORD_METADATA'    // ERC-20 transfer: bound to unsigned action card & persistent payment ledger
  | 'UI_DISPLAY_ONLY';           // Displayed in UI overview only

export interface ReferenceEncodingDetails {
  tier: InvoiceReferenceTier;
  humanReadableReference: string;
  encodedDataHex: `0x${string}`;
  calldataCarriesReference: boolean;
  explanation: string;
  contractMethodLimitationDisclosed?: string;
}

export interface InvoiceValidationResult {
  status: ValidationStatus;
  canPreparePayment: boolean;
  issues: ValidationIssue[];
  resolvedPayee: `0x${string}` | null;
  resolvedTokenSymbol: string | null;
  resolvedTokenAddress: `0x${string}` | null;
  isNative: boolean;
  resolvedBaseUnits: bigint | null;
  resolvedChainId: number | null;
  referenceEncoding: ReferenceEncodingDetails;
  validatedAt: string;
}
