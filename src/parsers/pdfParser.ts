import * as pdfjsLib from 'pdfjs-dist';
import type { ExtractedInvoice } from '../types/invoice.ts';
import { extractFromTextLines, type LineWithMeta } from './textParser.ts';

// Configure worker for browser environment
if (typeof window !== 'undefined') {
  try {
    // Set standard CDN fallback worker if not configured
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }
  } catch (e) {
    // Ignore worker setup error
  }
}

export async function parsePdfInvoice(
  pdfData: ArrayBuffer | Uint8Array,
  fileName: string = 'invoice.pdf',
  fileSizeBytes: number = 0
): Promise<ExtractedInvoice> {
  const loadingTask = pdfjsLib.getDocument({
    data: pdfData,
    useSystemFonts: true,
    disableFontFace: true,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const allLines: LineWithMeta[] = [];
  const fullTextPieces: string[] = [];

  let overallLineCounter = 1;

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();

    // Group items into lines based on Y coordinate transform
    let currentY: number | null = null;
    let currentLineText = '';

    for (const item of content.items as any[]) {
      if (!('str' in item)) continue;
      const str = item.str;
      const y = item.transform ? Math.round(item.transform[5]) : null;

      if (currentY === null || Math.abs(currentY - (y ?? currentY)) > 5) {
        if (currentLineText.trim().length > 0) {
          allLines.push({
            text: currentLineText,
            lineNumber: overallLineCounter++,
            pageNumber: pageNum,
          });
          fullTextPieces.push(currentLineText);
        }
        currentLineText = str;
        currentY = y;
      } else {
        currentLineText += (currentLineText.endsWith(' ') || str.startsWith(' ') ? '' : ' ') + str;
      }
    }

    if (currentLineText.trim().length > 0) {
      allLines.push({
        text: currentLineText,
        lineNumber: overallLineCounter++,
        pageNumber: pageNum,
      });
      fullTextPieces.push(currentLineText);
    }
  }

  const completeText = fullTextPieces.join('\n');

  const invoice = extractFromTextLines(
    allLines,
    'PDF',
    fileName,
    fileSizeBytes || pdfData.byteLength,
    completeText
  );

  // Update extractionMethod tag for PDF fields
  const fields = [
    invoice.payeeName,
    invoice.payeeAddress,
    invoice.amount,
    invoice.currencyOrToken,
    invoice.invoiceReference,
  ];

  for (const f of fields) {
    if (f) {
      f.extractionMethod = 'PDF_STREAM';
    }
  }

  return invoice;
}
