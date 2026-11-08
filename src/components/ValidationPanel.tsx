import React from 'react';
import type { InvoiceValidationResult, ValidationIssue } from '../types/invoice.ts';
import { AlertCircle, AlertTriangle, CheckCircle, Info, ShieldAlert, Cpu } from 'lucide-react';

interface ValidationPanelProps {
  validation: InvoiceValidationResult;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({ validation }) => {
  const criticalCount = validation.issues.filter((i) => i.severity === 'CRITICAL').length;
  const warningCount = validation.issues.filter((i) => i.severity === 'WARNING').length;

  let headerColor = 'bg-emerald-950/40 border-emerald-800 text-emerald-300';
  let statusTitle = 'All Validation Invariants Satisfied';
  let statusIcon = <CheckCircle className="w-5 h-5 text-emerald-400" />;

  if (validation.status === 'NEEDS_USER_INPUT') {
    headerColor = 'bg-amber-950/40 border-amber-800 text-amber-300';
    statusTitle = 'Required Invoice Fields Missing (Req-02 No-Guessing Rule)';
    statusIcon = <AlertTriangle className="w-5 h-5 text-amber-400" />;
  } else if (validation.status === 'MISMATCH_DETECTED' || validation.status === 'UNSUPPORTED_ASSET') {
    headerColor = 'bg-rose-950/40 border-rose-800 text-rose-300';
    statusTitle = 'Asset or Network Mismatch Detected';
    statusIcon = <AlertCircle className="w-5 h-5 text-rose-400" />;
  } else if (validation.status === 'INVALID_INVOICE') {
    headerColor = 'bg-rose-950/40 border-rose-800 text-rose-300';
    statusTitle = 'Invalid Invoice Specification / Cryptographic Blocker';
    statusIcon = <ShieldAlert className="w-5 h-5 text-rose-400" />;
  } else if (validation.status === 'READY_FOR_REVIEW') {
    headerColor = 'bg-cyan-950/40 border-cyan-800 text-cyan-300';
    statusTitle = 'Ready for Payment Preparation with Warnings';
    statusIcon = <Info className="w-5 h-5 text-cyan-400" />;
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-8">
      {/* Header status bar */}
      <div className={`p-4 rounded-lg border flex items-center justify-between mb-4 ${headerColor}`}>
        <div className="flex items-center space-x-3">
          {statusIcon}
          <div>
            <h3 className="text-sm font-bold tracking-wide uppercase font-mono">{validation.status}</h3>
            <p className="text-xs text-slate-300 mt-0.5">{statusTitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono">
          {criticalCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 border border-rose-700">
              {criticalCount} Critical
            </span>
          )}
          {warningCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-900/80 text-amber-200 border border-amber-700">
              {warningCount} Warning
            </span>
          )}
          {criticalCount === 0 && warningCount === 0 && (
            <span className="px-2 py-0.5 rounded bg-emerald-900/80 text-emerald-200 border border-emerald-700">
              0 Issues
            </span>
          )}
        </div>
      </div>

      {/* No-Guessing Policy Notice */}
      <div className="mb-4 p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg flex items-start space-x-3 text-xs text-slate-400">
        <Cpu className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-200 font-semibold">Strict Zero-Simulation Policy:</strong> The agent does not silently guess recipient addresses, fabricate missing token decimals, or assume unsupported token mappings. Missing or mismatched values are surfaced as explicit blockers with actionable correction steps.
        </p>
      </div>

      {/* Issues list */}
      {validation.issues.length > 0 ? (
        <div className="space-y-2">
          {validation.issues.map((issue, idx) => {
            const isCrit = issue.severity === 'CRITICAL';
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-xs flex items-start space-x-3 ${
                  isCrit
                    ? 'bg-rose-950/20 border-rose-900/60 text-rose-200'
                    : 'bg-amber-950/20 border-amber-900/60 text-amber-200'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isCrit ? (
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="font-semibold uppercase">{issue.code}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">Field: {issue.field}</span>
                  </div>
                  <p className="mt-1 text-slate-300 leading-relaxed">{issue.message}</p>
                  {issue.suggestedAction && (
                    <p className="mt-1.5 text-cyan-400 font-medium">
                      ↳ Remediation: {issue.suggestedAction}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 bg-emerald-950/10 border border-emerald-900/30 rounded-lg text-xs text-emerald-300 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Payee cryptographic address, amount base-units, settlement token, and invoice reference are fully validated.</span>
        </div>
      )}
    </div>
  );
};
