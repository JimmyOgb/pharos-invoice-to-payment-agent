import type { ExtractedField, ExtractedInvoice } from '../types/invoice.ts';

const EVM_ADDRESS_REGEX = /0x[a-fA-F0-9]{40}/i;
const STRICT_EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const KNOWN_TOKENS = ['PROS', 'USDC', 'ETH', 'WPROS', 'LINK', 'USDT', 'DAI', 'USD', 'EUR'];

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
    extractionMethod: 'TEXT_REGEX',
    confidence,
    isUserEdited: false,
    originalExtractedValue: value,
  };
}

export interface LineWithMeta {
  text: string;
  lineNumber: number;
  pageNumber?: number;
}

export function extractFromTextLines(
  linesWithMeta: LineWithMeta[],
  formatName: 'TEXT' | 'PDF' = 'TEXT',
  fileName: string = 'invoice.txt',
  fileSizeBytes: number = 0,
  rawText: string = ''
): ExtractedInvoice {
  let payeeNameVal: string | null = null;
  let payeeNameRaw = '';
  let payeeNameLoc = '';
  let payeeNameConf = 0;

  let payeeAddrVal: `0x${string}` | null = null;
  let payeeAddrRaw = '';
  let payeeAddrLoc = '';
  let payeeAddrConf = 0;

  let amountVal: string | null = null;
  let amountRaw = '';
  let amountLoc = '';
  let amountConf = 0;

  let tokenVal: string | null = null;
  let tokenRaw = '';
  let tokenLoc = '';
  let tokenConf = 0;

  let refVal: string | null = null;
  let refRaw = '';
  let refLoc = '';
  let refConf = 0;

  let dateVal: string | null = null;
  let dateRaw = '';
  let dateLoc = '';

  let dueDateVal: string | null = null;
  let dueDateRaw = '';
  let dueDateLoc = '';

  for (const { text, lineNumber, pageNumber } of linesWithMeta) {
    const trimmed = text.trim();
    if (!trimmed) continue;

    const locPrefix = pageNumber ? `Page ${pageNumber}, Line ${lineNumber}` : `Line ${lineNumber}`;

    // 1. Payee Name Patterns
    if (!payeeNameVal) {
      const nameMatch = trimmed.match(/^(?:Payee\s*Name|Payee|Vendor|Biller|From|Seller|Company|Merchant)\s*[:=]\s*(.+)$/i);
      if (nameMatch) {
        const candidate = nameMatch[1].trim();
        // Ensure it's not just an Ethereum address
        if (!candidate.startsWith('0x')) {
          payeeNameVal = candidate;
          payeeNameRaw = candidate;
          payeeNameLoc = `${locPrefix}: "${trimmed}"`;
          payeeNameConf = 0.95;
        }
      }
    }

    // 2. Payee Address Patterns
    const addrMatch = trimmed.match(EVM_ADDRESS_REGEX);
    if (addrMatch) {
      const candidate = addrMatch[0] as `0x${string}`;
      const isExplicitPayeeLine = /(?:payee|recipient|to|wallet|address|send to|destination)/i.test(trimmed);

      if (!payeeAddrVal || isExplicitPayeeLine) {
        payeeAddrVal = candidate;
        payeeAddrRaw = candidate;
        payeeAddrLoc = `${locPrefix}: "${trimmed}"`;
        payeeAddrConf = isExplicitPayeeLine ? 0.98 : 0.8;
      }
    }

    // 3. Amount and Currency Patterns
    if (!amountVal) {
      // Look for lines like "Total Due: 150.50 PROS" or "Amount: 1,200.00 USDC" or "Total: $500.00"
      const amountTokenMatch = trimmed.match(
        /(?:Total\s*Amount|Amount\s*Due|Total\s*Due|Balance\s*Due|Total|Amount|Pay|Subtotal)\s*[:=]?\s*[$€£]?\s*([0-9,]+(?:\.[0-9]+)?)\s*([A-Za-z]+)?/i
      );

      if (amountTokenMatch) {
        const numStr = amountTokenMatch[1].replace(/,/g, '');
        if (!isNaN(Number(numStr)) && Number(numStr) > 0) {
          amountVal = numStr;
          amountRaw = amountTokenMatch[1];
          amountLoc = `${locPrefix}: "${trimmed}"`;
          amountConf = 0.95;

          if (amountTokenMatch[2]) {
            const potentialToken = amountTokenMatch[2].toUpperCase();
            if (KNOWN_TOKENS.includes(potentialToken)) {
              tokenVal = potentialToken;
              tokenRaw = amountTokenMatch[2];
              tokenLoc = `${locPrefix}: "${trimmed}"`;
              tokenConf = 0.95;
            }
          }
        }
      }
    }

    // 4. Currency or Token (standalone lines)
    if (!tokenVal) {
      const tokenMatch = trimmed.match(/(?:Currency|Token|Asset|Denomination)\s*[:=]\s*([A-Za-z]+)/i);
      if (tokenMatch) {
        const potential = tokenMatch[1].toUpperCase();
        tokenVal = potential;
        tokenRaw = tokenMatch[1];
        tokenLoc = `${locPrefix}: "${trimmed}"`;
        tokenConf = 0.95;
      }
    }

    // 5. Reference / Invoice Number Patterns
    if (!refVal) {
      const refMatch = trimmed.match(
        /(?:Invoice\s*(?:#|No\.?|Num(?:ber)?|ID)?|Inv\s*#?|Reference\s*(?:#|No\.?|ID)?|Ref\s*#?|Payment\s*Ref(?:erence)?|Memo|Order\s*(?:#|ID))\s*[:#=-]\s*([A-Za-z0-9\-_./#]+)/i
      );
      if (refMatch) {
        const candidate = refMatch[1].trim();
        // Ignore generic English words
        const ignoreWords = ['NUMBER', 'IS', 'WAS', 'NOT', 'DUE', 'NONE', 'N/A', 'PENDING'];
        if (!ignoreWords.includes(candidate.toUpperCase())) {
          refVal = candidate;
          refRaw = candidate;
          refLoc = `${locPrefix}: "${trimmed}"`;
          refConf = 0.95;
        }
      }
    }

    // 6. Dates
    if (!dateVal) {
      const dateMatch = trimmed.match(/(?:Invoice\s*Date|Issue\s*Date|Date)\s*[:=]\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[A-Za-z]+ \d{1,2},? \d{4})/i);
      if (dateMatch) {
        dateVal = dateMatch[1];
        dateRaw = dateMatch[1];
        dateLoc = `${locPrefix}: "${trimmed}"`;
      }
    }

    if (!dueDateVal) {
      const dueMatch = trimmed.match(/(?:Due\s*Date|Payment\s*Due|Pay\s*By)\s*[:=]\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[A-Za-z]+ \d{1,2},? \d{4})/i);
      if (dueMatch) {
        dueDateVal = dueMatch[1];
        dueDateRaw = dueMatch[1];
        dueDateLoc = `${locPrefix}: "${trimmed}"`;
      }
    }
  }

  // Fallback: If currency not found yet, inspect raw text for known tokens
  if (!tokenVal) {
    for (const t of KNOWN_TOKENS) {
      const tokenRegex = new RegExp(`\\b${t}\\b`, 'i');
      if (tokenRegex.test(rawText)) {
        tokenVal = t;
        tokenRaw = t;
        tokenLoc = 'Document text search';
        tokenConf = 0.7;
        break;
      }
    }
  }

  const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: invoiceId,
    format: formatName,
    fileName,
    fileSizeBytes: fileSizeBytes || rawText.length,
    rawContentPreview: rawText.length > 500 ? rawText.substring(0, 500) + '...' : rawText,
    payeeName: createField(payeeNameVal, payeeNameRaw, payeeNameLoc, payeeNameConf),
    payeeAddress: createField(payeeAddrVal, payeeAddrRaw, payeeAddrLoc, payeeAddrConf),
    amount: createField(amountVal, amountRaw, amountLoc, amountConf),
    currencyOrToken: createField(tokenVal, tokenRaw, tokenLoc, tokenConf),
    invoiceReference: createField(refVal, refRaw, refLoc, refConf),
    invoiceDate: dateVal ? createField(dateVal, dateRaw, dateLoc, 0.9) : undefined,
    dueDate: dueDateVal ? createField(dueDateVal, dueDateRaw, dueDateLoc, 0.9) : undefined,
    parsedAt: new Date().toISOString(),
  };
}

export function parseTextInvoice(
  text: string,
  fileName: string = 'invoice.txt',
  fileSizeBytes: number = 0
): ExtractedInvoice {
  const lines = text.split(/\r?\n/);
  const linesWithMeta: LineWithMeta[] = lines.map((line, index) => ({
    text: line,
    lineNumber: index + 1,
  }));

  return extractFromTextLines(linesWithMeta, 'TEXT', fileName, fileSizeBytes, text);
}
