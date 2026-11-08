import React, { useState, useEffect } from 'react';
import { invoiceDb } from '../storage/db.ts';
import type { InvoicePaymentRecord } from '../types/transaction.ts';
import { History, ExternalLink, Trash2, CheckCircle2 } from 'lucide-react';
import { SUPPORTED_NETWORKS } from '../config/networks.ts';

export const HistoryLedger: React.FC = () => {
  const [records, setRecords] = useState<InvoicePaymentRecord[]>([]);

  const refreshRecords = () => {
    setRecords(invoiceDb.getPaymentRecords());
  };

  useEffect(() => {
    refreshRecords();
    const interval = setInterval(refreshRecords, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = () => {
    if (confirm('Clear local invoice payment history?')) {
      invoiceDb.clearAll();
      setRecords([]);
    }
  };

  if (records.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-8">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-slate-100">
            Invoice Payment Accounting Ledger
          </h2>
        </div>
        <button
          onClick={handleClear}
          className="text-xs text-slate-400 hover:text-rose-400 flex items-center space-x-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Ledger</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <th className="py-2 px-3">Date</th>
              <th className="py-2 px-3">Invoice Ref</th>
              <th className="py-2 px-3">Payee</th>
              <th className="py-2 px-3">Amount</th>
              <th className="py-2 px-3">Chain</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {records.map((rec) => {
              const net = SUPPORTED_NETWORKS[rec.chainId];
              return (
                <tr key={rec.id} className="hover:bg-slate-850/50">
                  <td className="py-2.5 px-3 text-slate-400 font-mono">
                    {new Date(rec.createdAt).toLocaleDateString()} {new Date(rec.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-amber-300">
                    {rec.invoiceReference}
                  </td>
                  <td className="py-2.5 px-3 text-slate-200">
                    <div>{rec.payeeName}</div>
                    <div className="font-mono text-[10px] text-slate-400">{rec.payeeAddress.slice(0, 8)}...{rec.payeeAddress.slice(-6)}</div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-100">
                    {rec.amount} {rec.tokenSymbol}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {net ? net.shortName : rec.chainId}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{rec.status}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    {rec.explorerUrl ? (
                      <a
                        href={rec.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 inline-flex items-center space-x-1"
                      >
                        <span>Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
