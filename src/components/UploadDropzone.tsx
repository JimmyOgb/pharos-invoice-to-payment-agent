import React, { useState, useRef } from 'react';
import { Upload, FileUp, ClipboardPaste, FileCode, CheckCircle2 } from 'lucide-react';
import { parseInvoiceContent, parseInvoiceFile } from '../parsers/index.ts';
import type { ExtractedInvoice } from '../types/invoice.ts';

interface UploadDropzoneProps {
  onInvoiceParsed: (invoice: ExtractedInvoice) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  onError: (error: string) => void;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({
  onInvoiceParsed,
  isLoading,
  setIsLoading,
  onError,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [pastedFormat, setPastedFormat] = useState<'AUTO' | 'JSON' | 'TEXT'>('AUTO');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setIsLoading(true);
    try {
      const invoice = await parseInvoiceFile(file);
      onInvoiceParsed(invoice);
    } catch (err: any) {
      onError(`Failed to parse file: ${err.message || 'Unknown parsing error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) {
      onError('Please enter or paste invoice text or JSON.');
      return;
    }
    setIsLoading(true);
    try {
      const fileName = pastedFormat === 'JSON' ? 'pasted-invoice.json' : 'pasted-invoice.txt';
      const invoice = await parseInvoiceContent(pastedText, fileName, pastedText.length);
      onInvoiceParsed(invoice);
    } catch (err: any) {
      onError(`Failed to parse pasted text: ${err.message || 'Invalid format'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 mb-8">
      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-4 mb-5">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'upload'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileUp className="w-4 h-4" />
          <span>Upload File (PDF / JSON / TXT)</span>
        </button>
        <button
          onClick={() => setActiveTab('paste')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeTab === 'paste'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ClipboardPaste className="w-4 h-4" />
          <span>Paste Raw Text / JSON</span>
        </button>
      </div>

      {activeTab === 'upload' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-750 hover:border-slate-600 bg-slate-850/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
            accept=".json,.pdf,.txt,.md"
            className="hidden"
          />

          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            <Upload className="w-6 h-6 text-cyan-400" />
          </div>

          <h3 className="text-base font-medium text-slate-200 mb-1">
            Drag and drop your invoice document here, or <span className="text-cyan-400 underline">browse</span>
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Supports PDF invoices, structured JSON e-invoices, and plain-text/markdown payment requests (Req-01)
          </p>
        </div>
      ) : (
        <div>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={7}
            placeholder={`Paste raw JSON or plain text invoice here...\n\nExample JSON:\n{\n  "payee": { "name": "Acme", "address": "0x71C8..." },\n  "amount": "100.0",\n  "currency": "PROS",\n  "reference": "INV-2026-001"\n}`}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-3"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <span>Format:</span>
              {(['AUTO', 'JSON', 'TEXT'] as const).map((fmt) => (
                <label key={fmt} className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    name="pasteFormat"
                    value={fmt}
                    checked={pastedFormat === fmt}
                    onChange={() => setPastedFormat(fmt)}
                    className="text-cyan-500 focus:ring-0"
                  />
                  <span>{fmt}</span>
                </label>
              ))}
            </div>

            <button
              onClick={handlePasteSubmit}
              disabled={isLoading || !pastedText.trim()}
              className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-semibold shadow transition"
            >
              Parse Pasted Invoice →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
