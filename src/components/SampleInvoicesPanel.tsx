import React from 'react';
import { SAMPLE_INVOICES, type SampleInvoiceFixture } from '../samples/fixtures.ts';
import { FileText, AlertTriangle, ShieldAlert, CheckCircle, Sparkles } from 'lucide-react';

interface SampleInvoicesPanelProps {
  onSelectSample: (sample: SampleInvoiceFixture) => void;
  currentSampleId?: string;
}

export const SampleInvoicesPanel: React.FC<SampleInvoicesPanelProps> = ({
  onSelectSample,
  currentSampleId,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold text-slate-100">
            Interactive Demo Fixtures & Test Invoices (Req-04)
          </h2>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Click any preset to load and verify agent parsing & validation in real-time
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {SAMPLE_INVOICES.map((sample) => {
          const isSelected = currentSampleId === sample.id;
          let icon = <CheckCircle className="w-4 h-4 text-emerald-400" />;
          let badgeColor = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
          let tagText = 'VALID NATIVE';

          if (sample.expectedBehavior === 'VALID_ERC20') {
            tagText = 'VALID ERC-20';
            badgeColor = 'bg-blue-950/80 text-blue-300 border-blue-800';
          } else if (sample.expectedBehavior === 'MISMATCH_TOKEN') {
            icon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
            tagText = 'TOKEN MISMATCH';
            badgeColor = 'bg-amber-950/80 text-amber-300 border-amber-800';
          } else if (sample.expectedBehavior === 'MISSING_FIELDS') {
            icon = <AlertTriangle className="w-4 h-4 text-rose-400" />;
            tagText = 'MISSING FIELDS';
            badgeColor = 'bg-rose-950/80 text-rose-300 border-rose-800';
          } else if (sample.expectedBehavior === 'ZERO_ADDRESS') {
            icon = <ShieldAlert className="w-4 h-4 text-rose-500" />;
            tagText = 'ZERO ADDRESS';
            badgeColor = 'bg-rose-950/80 text-rose-300 border-rose-800';
          }

          return (
            <button
              key={sample.id}
              onClick={() => onSelectSample(sample)}
              className={`text-left p-3.5 rounded-lg border transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-cyan-950/30 border-cyan-500 ring-1 ring-cyan-500 shadow-md shadow-cyan-900/20'
                  : 'bg-slate-850 hover:bg-slate-800/80 border-slate-750 hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono px-2 py-0.5 rounded border uppercase font-medium flex items-center space-x-1">
                    <FileText className="w-3 h-3 mr-1 text-slate-400" />
                    {sample.format}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${badgeColor}`}>
                    {tagText}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-slate-200 line-clamp-1">{sample.title}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono text-slate-400 truncate max-w-[180px]">{sample.fileName}</span>
                <span className="text-cyan-400 font-medium hover:underline">Load & Verify →</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
