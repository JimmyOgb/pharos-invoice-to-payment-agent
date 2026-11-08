import type { ExtractedInvoice, InvoiceFormat } from '../types/invoice.ts';
import { parseJsonInvoice } from './jsonParser.ts';
import { parseTextInvoice } from './textParser.ts';
import { parsePdfInvoice } from './pdfParser.ts';

export function detectInvoiceFormat(fileName: string, contentSample?: string): InvoiceFormat {
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.json')) return 'JSON';
  if (lowerName.endsWith('.pdf')) return 'PDF';
  if (lowerName.endsWith('.txt') || lowerName.endsWith('.md') || lowerName.endsWith('.csv')) return 'TEXT';

  if (contentSample) {
    const trimmed = contentSample.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        JSON.parse(trimmed);
        return 'JSON';
      } catch (e) {
        // Not JSON
      }
    }
    if (trimmed.startsWith('%PDF-')) {
      return 'PDF';
    }
  }

  return 'TEXT';
}

export async function parseInvoiceContent(
  content: string | ArrayBuffer,
  fileName: string = 'document',
  fileSize: number = 0
): Promise<ExtractedInvoice> {
  if (content instanceof ArrayBuffer) {
    // ArrayBuffer is typically PDF or binary
    const format = detectInvoiceFormat(fileName);
    if (format === 'PDF') {
      return await parsePdfInvoice(content, fileName, fileSize || content.byteLength);
    } else {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(content);
      return parseInvoiceContent(text, fileName, fileSize || content.byteLength);
    }
  }

  // String content
  const format = detectInvoiceFormat(fileName, content);

  if (format === 'JSON') {
    return parseJsonInvoice(content, fileName, fileSize || content.length);
  } else if (format === 'PDF') {
    // If string was passed for PDF, convert to Uint8Array
    const encoder = new TextEncoder();
    const buffer = encoder.encode(content).buffer;
    return await parsePdfInvoice(buffer, fileName, fileSize || content.length);
  } else {
    return parseTextInvoice(content, fileName, fileSize || content.length);
  }
}

export async function parseInvoiceFile(file: File): Promise<ExtractedInvoice> {
  const fileName = file.name;
  const format = detectInvoiceFormat(fileName);

  if (format === 'PDF') {
    const buffer = await file.arrayBuffer();
    return await parsePdfInvoice(buffer, fileName, file.size);
  } else {
    const text = await file.text();
    return await parseInvoiceContent(text, fileName, file.size);
  }
}

export { parseJsonInvoice, parseTextInvoice, parsePdfInvoice };
