import type { ExtractedField, ExtractedInvoice } from '../types/invoice.ts';

function createField<T>(
  value: T | null,
  rawString: string,
  sourceLocation: string,
  confidence: number
): ExtractedField<T> {
  return {
    value,
    rawString,
    sourceLocation,
    extractionMethod: 'STRUCTURED_JSON',
    confidence,
    isUserEdited: false,
    originalExtractedValue: value,
  };
}

const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function parseJsonInvoice(
  jsonString: string,
  fileName: string = 'invoice.json',
  fileSizeBytes: number = 0
): ExtractedInvoice {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: any) {
    throw new Error(`Invalid JSON format: ${err.message || 'Syntax error'}`);
  }

  // 1. Payee Name search paths
  let payeeNameVal: string | null = null;
  let payeeNameRaw = '';
  let payeeNameLoc = 'JSON';
  let payeeNameConf = 0;

  const nameCandidates = [
    { path: 'payee.name', val: parsed?.payee?.name },
    { path: 'recipient.name', val: parsed?.recipient?.name },
    { path: 'vendor.name', val: parsed?.vendor?.name },
    { path: 'seller.name', val: parsed?.seller?.name },
    { path: 'biller.name', val: parsed?.biller?.name },
    { path: 'payeeName', val: parsed?.payeeName },
    { path: 'recipientName', val: parsed?.recipientName },
    { path: 'vendorName', val: parsed?.vendorName },
    { path: 'payee', val: typeof parsed?.payee === 'string' && !EVM_ADDRESS_REGEX.test(parsed.payee) ? parsed.payee : null },
  ];

  for (const c of nameCandidates) {
    if (typeof c.val === 'string' && c.val.trim().length > 0) {
      payeeNameVal = c.val.trim();
      payeeNameRaw = String(c.val);
      payeeNameLoc = `JSON path: ${c.path}`;
      payeeNameConf = 1.0;
      break;
    }
  }

  // 2. Payee Address search paths
  let payeeAddrVal: `0x${string}` | null = null;
  let payeeAddrRaw = '';
  let payeeAddrLoc = 'JSON';
  let payeeAddrConf = 0;

  const addrCandidates = [
    { path: 'payee.address', val: parsed?.payee?.address },
    { path: 'payee.walletAddress', val: parsed?.payee?.walletAddress },
    { path: 'recipient.address', val: parsed?.recipient?.address },
    { path: 'recipient.walletAddress', val: parsed?.recipient?.walletAddress },
    { path: 'vendor.walletAddress', val: parsed?.vendor?.walletAddress },
    { path: 'vendor.address', val: parsed?.vendor?.address },
    { path: 'seller.walletAddress', val: parsed?.seller?.walletAddress },
    { path: 'seller.address', val: parsed?.seller?.address },
    { path: 'biller.walletAddress', val: parsed?.biller?.walletAddress },
    { path: 'biller.address', val: parsed?.biller?.address },
    { path: 'walletAddress', val: parsed?.walletAddress },
    { path: 'recipientAddress', val: parsed?.recipientAddress },
    { path: 'payeeAddress', val: parsed?.payeeAddress },
    { path: 'payee', val: typeof parsed?.payee === 'string' && EVM_ADDRESS_REGEX.test(parsed.payee) ? parsed.payee : null },
    { path: 'to', val: parsed?.to },
    { path: 'address', val: parsed?.address },
  ];

  for (const c of addrCandidates) {
    if (typeof c.val === 'string' && c.val.trim().length > 0) {
      payeeAddrRaw = c.val.trim();
      payeeAddrLoc = `JSON path: ${c.path}`;
      if (EVM_ADDRESS_REGEX.test(payeeAddrRaw)) {
        payeeAddrVal = payeeAddrRaw as `0x${string}`;
        payeeAddrConf = 1.0;
      } else {
        // Raw string extracted, but not a valid address - will be caught by validator
        payeeAddrVal = null;
        payeeAddrConf = 0.4;
      }
      break;
    }
  }

  // 3. Amount search paths
  let amountVal: string | null = null;
  let amountRaw = '';
  let amountLoc = 'JSON';
  let amountConf = 0;

  const amountCandidates = [
    { path: 'amount', val: parsed?.amount },
    { path: 'total', val: parsed?.total },
    { path: 'totalAmount', val: parsed?.totalAmount },
    { path: 'amountDue', val: parsed?.amountDue },
    { path: 'balanceDue', val: parsed?.balanceDue },
    { path: 'payment.amount', val: parsed?.payment?.amount },
    { path: 'invoice.amount', val: parsed?.invoice?.amount },
  ];

  for (const c of amountCandidates) {
    if (c.val !== undefined && c.val !== null && String(c.val).trim().length > 0) {
      amountRaw = String(c.val).trim();
      amountLoc = `JSON path: ${c.path}`;
      // Clean potential currency prefix or commas
      const numericClean = amountRaw.replace(/[^0-9.-]/g, '');
      if (numericClean && !isNaN(Number(numericClean))) {
        amountVal = numericClean;
        amountConf = 1.0;
      } else {
        amountVal = amountRaw;
        amountConf = 0.5;
      }
      break;
    }
  }

  // 4. Currency or Token search paths
  let tokenVal: string | null = null;
  let tokenRaw = '';
  let tokenLoc = 'JSON';
  let tokenConf = 0;

  const tokenCandidates = [
    { path: 'token', val: parsed?.token },
    { path: 'tokenSymbol', val: parsed?.tokenSymbol },
    { path: 'currency', val: parsed?.currency },
    { path: 'currencyOrToken', val: parsed?.currencyOrToken },
    { path: 'asset', val: parsed?.asset },
    { path: 'payment.token', val: parsed?.payment?.token },
    { path: 'payment.currency', val: parsed?.payment?.currency },
  ];

  for (const c of tokenCandidates) {
    if (typeof c.val === 'string' && c.val.trim().length > 0) {
      tokenRaw = c.val.trim();
      tokenVal = tokenRaw.toUpperCase();
      tokenLoc = `JSON path: ${c.path}`;
      tokenConf = 1.0;
      break;
    }
  }

  // 5. Invoice Reference search paths
  let refVal: string | null = null;
  let refRaw = '';
  let refLoc = 'JSON';
  let refConf = 0;

  const refCandidates = [
    { path: 'invoiceReference', val: parsed?.invoiceReference },
    { path: 'reference', val: parsed?.reference },
    { path: 'invoiceNumber', val: parsed?.invoiceNumber },
    { path: 'invoiceId', val: parsed?.invoiceId },
    { path: 'memo', val: parsed?.memo },
    { path: 'ref', val: parsed?.ref },
    { path: 'id', val: parsed?.id },
    { path: 'orderId', val: parsed?.orderId },
  ];

  for (const c of refCandidates) {
    if (c.val !== undefined && c.val !== null && String(c.val).trim().length > 0) {
      refRaw = String(c.val).trim();
      refVal = refRaw;
      refLoc = `JSON path: ${c.path}`;
      refConf = 1.0;
      break;
    }
  }

  // 6. Dates (optional)
  let dateField: ExtractedField<string> | undefined;
  if (parsed?.date || parsed?.invoiceDate || parsed?.issueDate) {
    const raw = String(parsed.date || parsed.invoiceDate || parsed.issueDate);
    dateField = createField(raw, raw, 'JSON path: date', 1.0);
  }

  let dueDateField: ExtractedField<string> | undefined;
  if (parsed?.dueDate || parsed?.paymentDueDate) {
    const raw = String(parsed.dueDate || parsed.paymentDueDate);
    dueDateField = createField(raw, raw, 'JSON path: dueDate', 1.0);
  }

  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: invoiceId,
    format: 'JSON',
    fileName,
    fileSizeBytes: fileSizeBytes || jsonString.length,
    rawContentPreview: jsonString.length > 500 ? jsonString.substring(0, 500) + '...' : jsonString,
    payeeName: createField(payeeNameVal, payeeNameRaw, payeeNameLoc, payeeNameConf),
    payeeAddress: createField(payeeAddrVal, payeeAddrRaw, payeeAddrLoc, payeeAddrConf),
    amount: createField(amountVal, amountRaw, amountLoc, amountConf),
    currencyOrToken: createField(tokenVal, tokenRaw, tokenLoc, tokenConf),
    invoiceReference: createField(refVal, refRaw, refLoc, refConf),
    invoiceDate: dateField,
    dueDate: dueDateField,
    parsedAt: new Date().toISOString(),
  };
}
