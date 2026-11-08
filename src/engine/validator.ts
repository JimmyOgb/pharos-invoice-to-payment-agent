import { parseUnits, isAddress, getAddress } from 'viem';
import type {
  ExtractedInvoice,
  InvoiceValidationResult,
  ValidationIssue,
  ValidationStatus,
  ReferenceEncodingDetails,
} from '../types/invoice.ts';
import { SUPPORTED_NETWORKS, findVerifiedToken, DEFAULT_CHAIN_ID } from '../config/networks.ts';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export function stringToHexData(str: string): `0x${string}` {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let hex = '0x';
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, '0');
  }
  return hex as `0x${string}`;
}

export function validateInvoice(
  invoice: ExtractedInvoice,
  selectedChainId: number = DEFAULT_CHAIN_ID,
  knownExistingReferences: string[] = []
): InvoiceValidationResult {
  const issues: ValidationIssue[] = [];

  const network = SUPPORTED_NETWORKS[selectedChainId];
  if (!network) {
    issues.push({
      code: 'UNSUPPORTED_CHAIN',
      field: 'chainId',
      severity: 'CRITICAL',
      message: `Selected chain ID ${selectedChainId} is not supported. Please select Pharos Pacific (1672), Base (8453), or Pharos Atlantic (688689).`,
      suggestedAction: 'Switch to a supported network in the network selector.',
    });
  }

  // 1. Payee Address Validation
  let resolvedPayee: `0x${string}` | null = null;
  const rawAddr = invoice.payeeAddress.value;

  if (!rawAddr || rawAddr.trim().length === 0) {
    issues.push({
      code: 'MISSING_PAYEE_ADDRESS',
      field: 'payeeAddress',
      severity: 'CRITICAL',
      message: 'Invoice does not contain a recipient wallet address.',
      suggestedAction: 'Enter the destination 0x address manually in the payee field.',
    });
  } else if (!isAddress(rawAddr, { strict: false })) {
    issues.push({
      code: 'INVALID_PAYEE_ADDRESS_FORMAT',
      field: 'payeeAddress',
      severity: 'CRITICAL',
      message: `Extracted payee address "${rawAddr}" is not a valid 40-character hexadecimal EVM address.`,
      suggestedAction: 'Correct the address to a valid 0x EVM recipient.',
    });
  } else if (rawAddr.toLowerCase() === ZERO_ADDRESS.toLowerCase()) {
    issues.push({
      code: 'ZERO_ADDRESS_FORBIDDEN',
      field: 'payeeAddress',
      severity: 'CRITICAL',
      message: 'The zero address (0x0000...0000) cannot be used as a payment recipient.',
      suggestedAction: 'Provide a valid beneficiary address.',
    });
  } else {
    try {
      resolvedPayee = getAddress(rawAddr);
    } catch {
      resolvedPayee = rawAddr.toLowerCase() as `0x${string}`;
    }
  }

  // Payee Name (Informational / Warning)
  if (!invoice.payeeName.value || invoice.payeeName.value.trim().length === 0) {
    issues.push({
      code: 'MISSING_PAYEE_NAME',
      field: 'payeeName',
      severity: 'WARNING',
      message: 'Invoice does not specify a vendor or payee organization name.',
      suggestedAction: 'Optionally supply the vendor label for your accounting records.',
    });
  }

  // 2. Token & Currency Validation
  let resolvedTokenSymbol: string | null = null;
  let resolvedTokenAddress: `0x${string}` | null = null;
  let isNative = false;
  let tokenDecimals = 18;

  const rawCurrency = invoice.currencyOrToken.value?.trim().toUpperCase();

  if (!rawCurrency) {
    issues.push({
      code: 'MISSING_CURRENCY',
      field: 'currencyOrToken',
      severity: 'CRITICAL',
      message: 'Invoice does not specify a payment currency or token symbol.',
      suggestedAction: 'Select a settlement token (e.g. PROS, USDC, ETH) from the dropdown.',
    });
  } else {
    // Check if it's a fiat currency without settlement crypto
    if (['USD', 'EUR', 'GBP'].includes(rawCurrency)) {
      issues.push({
        code: 'FIAT_CURRENCY_REQUIRES_TOKEN_MAPPING',
        field: 'currencyOrToken',
        severity: 'WARNING',
        message: `Invoice specifies fiat currency "${rawCurrency}". On-chain settlement requires selecting a stablecoin or native token.`,
        suggestedAction: `Map "${rawCurrency}" to USDC or PROS to prepare payment.`,
      });
    }

    // Lookup verified token on current network
    const verifiedToken = findVerifiedToken(rawCurrency, selectedChainId);

    if (verifiedToken) {
      resolvedTokenSymbol = verifiedToken.symbol;
      resolvedTokenAddress = verifiedToken.address;
      isNative = !!verifiedToken.isNative;
      tokenDecimals = verifiedToken.decimals;
    } else {
      // Check if rawCurrency exists on any OTHER supported network to give helpful feedback
      let existsOnOther = false;
      for (const otherChainId of Object.keys(SUPPORTED_NETWORKS)) {
        if (Number(otherChainId) !== selectedChainId && findVerifiedToken(rawCurrency, Number(otherChainId))) {
          existsOnOther = true;
          break;
        }
      }

      issues.push({
        code: 'UNSUPPORTED_TOKEN_ON_NETWORK',
        field: 'currencyOrToken',
        severity: 'CRITICAL',
        message: `Token "${rawCurrency}" is not verified or available on ${network ? network.networkName : 'the selected chain'}${
          existsOnOther ? ' (found on another supported network)' : ''
        }.`,
        suggestedAction: existsOnOther
          ? 'Switch network or select an available token on this network.'
          : 'Choose a verified token from the list.',
      });
    }
  }

  // 3. Amount Validation
  let resolvedBaseUnits: bigint | null = null;
  const rawAmount = invoice.amount.value?.trim();

  if (!rawAmount) {
    issues.push({
      code: 'MISSING_AMOUNT',
      field: 'amount',
      severity: 'CRITICAL',
      message: 'Invoice does not specify a payment amount.',
      suggestedAction: 'Enter the required payment amount.',
    });
  } else {
    const num = Number(rawAmount);
    if (isNaN(num) || num <= 0) {
      issues.push({
        code: 'INVALID_AMOUNT',
        field: 'amount',
        severity: 'CRITICAL',
        message: `Amount "${rawAmount}" is not a valid positive number.`,
        suggestedAction: 'Enter a positive numeric amount.',
      });
    } else {
      // Check decimal precision against token decimals
      const parts = rawAmount.split('.');
      if (parts[1] && parts[1].length > tokenDecimals) {
        issues.push({
          code: 'EXCESSIVE_DECIMALS',
          field: 'amount',
          severity: 'CRITICAL',
          message: `Amount "${rawAmount}" has ${parts[1].length} decimal places, but ${resolvedTokenSymbol || 'the token'} only supports ${tokenDecimals} decimals.`,
          suggestedAction: `Round the amount to at most ${tokenDecimals} decimals.`,
        });
      } else {
        try {
          resolvedBaseUnits = parseUnits(rawAmount, tokenDecimals);
        } catch (e: any) {
          issues.push({
            code: 'AMOUNT_CONVERSION_FAILED',
            field: 'amount',
            severity: 'CRITICAL',
            message: `Failed to convert amount to base units: ${e.message}`,
            suggestedAction: 'Check amount format.',
          });
        }
      }
    }
  }

  // 4. Reference Validation
  const rawRef = invoice.invoiceReference.value?.trim();
  if (!rawRef) {
    issues.push({
      code: 'MISSING_INVOICE_REFERENCE',
      field: 'invoiceReference',
      severity: 'CRITICAL',
      message: 'Invoice reference or payment memo is missing. On-chain verification requires a unique invoice identifier.',
      suggestedAction: 'Specify the invoice reference number before preparing payment.',
    });
  } else {
    // Duplicate reference check
    if (knownExistingReferences.map((r) => r.toLowerCase()).includes(rawRef.toLowerCase())) {
      issues.push({
        code: 'DUPLICATE_INVOICE_REFERENCE',
        field: 'invoiceReference',
        severity: 'WARNING',
        message: `An invoice with reference "${rawRef}" has already been processed or prepared in this session.`,
        suggestedAction: 'Verify this is not an accidental double-payment.',
      });
    }
  }

  // 5. Reference Encoding Architecture Determination
  const cleanRef = rawRef || 'UNSPECIFIED_REFERENCE';
  let referenceEncoding: ReferenceEncodingDetails;

  if (isNative) {
    // Native payment: Calldata Hex Memo
    const memoHex = stringToHexData(cleanRef);
    referenceEncoding = {
      tier: 'CALLEDATA_HEX_MEMO',
      humanReadableReference: cleanRef,
      encodedDataHex: memoHex,
      calldataCarriesReference: true,
      explanation: `Native gas transfer includes invoice reference "${cleanRef}" hex-encoded in the transaction calldata.`,
    };
  } else {
    // ERC-20 payment: Payment Record Metadata
    referenceEncoding = {
      tier: 'PAYMENT_RECORD_METADATA',
      humanReadableReference: cleanRef,
      encodedDataHex: '0x',
      calldataCarriesReference: false,
      explanation: `Standard ERC-20 transfer(address,uint256) does not take a memo argument. Reference "${cleanRef}" is bound to the unsigned action card and local ledger metadata.`,
      contractMethodLimitationDisclosed:
        'Standard ERC-20 transfer specification (EIP-20) defines transfer(address to, uint256 value) with no memo argument. Arbitrary bytes must not be appended to calldata.',
    };
  }

  // 6. Overall Status Determination
  const hasCritical = issues.some((i) => i.severity === 'CRITICAL');
  const hasWarning = issues.some((i) => i.severity === 'WARNING');

  let status: ValidationStatus = 'READY_FOR_TRANSACTION_PREPARATION';

  if (hasCritical) {
    if (issues.some((i) => i.code === 'UNSUPPORTED_TOKEN_ON_NETWORK' || i.code === 'UNSUPPORTED_CHAIN')) {
      status = 'UNSUPPORTED_ASSET';
    } else if (issues.some((i) => i.code.includes('MISSING'))) {
      status = 'NEEDS_USER_INPUT';
    } else {
      status = 'INVALID_INVOICE';
    }
  } else if (hasWarning) {
    status = 'READY_FOR_REVIEW';
  }

  return {
    status,
    canPreparePayment: !hasCritical && resolvedPayee !== null && resolvedBaseUnits !== null && resolvedTokenSymbol !== null,
    issues,
    resolvedPayee,
    resolvedTokenSymbol,
    resolvedTokenAddress,
    isNative,
    resolvedBaseUnits,
    resolvedChainId: selectedChainId,
    referenceEncoding,
    validatedAt: new Date().toISOString(),
  };
}
