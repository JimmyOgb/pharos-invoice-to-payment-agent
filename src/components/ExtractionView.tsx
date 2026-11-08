import React, { useState } from 'react';
import type { ExtractedInvoice, ExtractedField } from '../types/invoice.ts';
import { Check, Edit2, RotateCcw, FileText, MapPin, Hash, DollarSign, Calendar, Layers } from 'lucide-react';

interface ExtractionViewProps {
  invoice: ExtractedInvoice;
  onUpdateInvoice: (updated: ExtractedInvoice) => void;
}

export const ExtractionView: React.FC<ExtractionViewProps> = ({ invoice, onUpdateInvoice }) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');
  const [showRaw, setShowRaw] = useState(false);

  const startEditing = (fieldName: string, currentValue: string | null) => {
    setEditingField(fieldName);
    setTempValue(currentValue || '');
  };

  const saveEdit = (fieldName: keyof ExtractedInvoice) => {
    const updated = { ...invoice };
    const field = updated[fieldName] as ExtractedField<any>;

    if (field) {
      field.value = tempValue.trim() || null;
      field.isUserEdited = true;
    }

    onUpdateInvoice(updated);
    setEditingField(null);
  };

  const revertEdit = (fieldName: keyof ExtractedInvoice) => {
    const updated = { ...invoice };
    const field = updated[fieldName] as ExtractedField<any>;

    if (field) {
      field.value = field.originalExtractedValue;
      field.isUserEdited = false;
    }

    onUpdateInvoice(updated);
  };

  const renderFieldRow = (
    label: string,
    fieldName: keyof ExtractedInvoice,
    field: ExtractedField<any> | undefined,
    icon: React.ReactNode,
    placeholder: string = 'Not detected'
  ) => {
    if (!field) return null;
    const isEditing = editingField === fieldName;

    return (
      <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-lg hover:border-slate-700 transition">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">{icon}</span>
            <span className="text-xs font-semibold text-slate-300">{label}</span>
            {field.isUserEdited ? (
              <span className="px-1.5 py-0.2 text-[10px] bg-amber-950/80 text-amber-300 border border-amber-800 rounded font-mono">
                User Corrected
              </span>
            ) : (
              <span className="px-1.5 py-0.2 text-[10px] bg-slate-800 text-slate-400 rounded font-mono">
                {Math.round(field.confidence * 100)}% Conf
              </span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {field.isUserEdited && (
              <button
                onClick={() => revertEdit(fieldName)}
                title="Revert to original extracted value"
                className="text-[11px] text-slate-400 hover:text-cyan-400 px-2 py-0.5 rounded border border-slate-700 flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Revert</span>
              </button>
            )}
            {!isEditing ? (
              <button
                onClick={() => startEditing(fieldName, field.value)}
                className="text-xs text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => saveEdit(fieldName)}
                className="text-xs text-emerald-400 hover:text-emerald-300 p-1 rounded hover:bg-slate-800"
              >
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="flex items-center space-x-2 mt-1">
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              autoFocus
              className="w-full bg-slate-950 border border-cyan-500 rounded px-2.5 py-1 text-sm text-cyan-200 font-mono focus:outline-none"
            />
          </div>
        ) : (
          <div className="font-mono text-sm break-all font-medium">
            {field.value ? (
              <span className={field.isUserEdited ? 'text-amber-200' : 'text-slate-100'}>
                {field.value}
              </span>
            ) : (
              <span className="text-rose-400/80 italic text-xs">{placeholder}</span>
            )}
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate max-w-[280px]" title={field.sourceLocation}>
            Source: {field.sourceLocation || 'Auto-scan'}
          </span>
          <span className="font-mono uppercase text-[10px]">{field.extractionMethod}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-8">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <span>Structured Extraction Registry (Req-01)</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300">
              {invoice.format}
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Document: <span className="font-mono text-slate-300">{invoice.fileName}</span> ({invoice.fileSizeBytes} bytes)
          </p>
        </div>

        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition"
        >
          {showRaw ? 'Hide Raw Content' : 'View Raw Document'}
        </button>
      </div>

      {showRaw && (
        <div className="mb-4 p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
          {invoice.rawContentPreview}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {renderFieldRow('Payee Organization / Vendor', 'payeeName', invoice.payeeName, <FileText className="w-4 h-4" />)}
        {renderFieldRow('Payee EVM Wallet Address', 'payeeAddress', invoice.payeeAddress, <MapPin className="w-4 h-4" />)}
        {renderFieldRow('Payment Amount', 'amount', invoice.amount, <DollarSign className="w-4 h-4" />)}
        {renderFieldRow('Settlement Token / Currency', 'currencyOrToken', invoice.currencyOrToken, <Layers className="w-4 h-4" />)}
        {renderFieldRow('Invoice Reference / ID', 'invoiceReference', invoice.invoiceReference, <Hash className="w-4 h-4" />)}
        {renderFieldRow('Invoice Issue Date', 'invoiceDate', invoice.invoiceDate, <Calendar className="w-4 h-4" />, 'Not specified in invoice')}
      </div>
    </div>
  );
};
