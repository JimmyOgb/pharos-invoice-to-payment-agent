import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header.tsx';
import { SampleInvoicesPanel } from './components/SampleInvoicesPanel.tsx';
import { UploadDropzone } from './components/UploadDropzone.tsx';
import { ExtractionView } from './components/ExtractionView.tsx';
import { ValidationPanel } from './components/ValidationPanel.tsx';
import { UnsignedTxCard } from './components/UnsignedTxCard.tsx';
import { HistoryLedger } from './components/HistoryLedger.tsx';
import { useWallet } from './hooks/useWallet.ts';
import { validateInvoice } from './engine/validator.ts';
import { buildInvoiceTransaction } from './engine/txBuilder.ts';
import { invoiceDb } from './storage/db.ts';
import { SAMPLE_INVOICES, type SampleInvoiceFixture } from './samples/fixtures.ts';
import { parseInvoiceContent } from './parsers/index.ts';
import type { ExtractedInvoice } from './types/invoice.ts';
import type { PreparedInvoiceActionCard } from './types/transaction.ts';
import { DEFAULT_CHAIN_ID } from './config/networks.ts';
import { Shield, Sparkles, BookOpen, CheckCircle, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  const [selectedChainId, setSelectedChainId] = useState<number>(DEFAULT_CHAIN_ID);
  const wallet = useWallet(selectedChainId);

  const [currentInvoice, setCurrentInvoice] = useState<ExtractedInvoice | null>(null);
  const [currentSampleId, setCurrentSampleId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load initial sample invoice on mount
  useEffect(() => {
    const firstSample = SAMPLE_INVOICES[0];
    if (firstSample) {
      loadSample(firstSample);
    }
  }, []);

  const loadSample = async (sample: SampleInvoiceFixture) => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentSampleId(sample.id);

    try {
      const invoice = await parseInvoiceContent(sample.content, sample.fileName, sample.content.length);
      setCurrentInvoice(invoice);
      invoiceDb.saveInvoice(invoice);
    } catch (err: any) {
      setErrorMessage(`Failed to load sample: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvoiceParsed = (invoice: ExtractedInvoice) => {
    setCurrentInvoice(invoice);
    setCurrentSampleId(undefined);
    setErrorMessage(null);
    invoiceDb.saveInvoice(invoice);
  };

  const handleInvoiceUpdated = (updated: ExtractedInvoice) => {
    setCurrentInvoice(updated);
    invoiceDb.saveInvoice(updated);
  };

  // Run validation engine on current invoice
  const validationResult = useMemo(() => {
    if (!currentInvoice) return null;
    const knownRefs = invoiceDb.getKnownReferences().filter((r) => r !== currentInvoice.invoiceReference.value);
    return validateInvoice(currentInvoice, selectedChainId, knownRefs);
  }, [currentInvoice, selectedChainId]);

  // Build unsigned transaction action card if validation passes
  const preparedActionCard = useMemo<PreparedInvoiceActionCard | null>(() => {
    if (!currentInvoice || !validationResult || !validationResult.canPreparePayment) {
      return null;
    }
    try {
      const card = buildInvoiceTransaction(currentInvoice, validationResult);
      invoiceDb.saveActionCard(card);
      return card;
    } catch (err: any) {
      console.error('Failed to construct transaction card:', err);
      return null;
    }
  }, [currentInvoice, validationResult]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Navigation & Wallet Bar */}
      <Header
        selectedChainId={selectedChainId}
        onSelectChainId={setSelectedChainId}
        wallet={wallet}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800 text-cyan-400 text-xs font-mono mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pharos Agent Arena • Invoice-to-Payment Task Sentinel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Non-Custodial Invoice Extraction & Payment Preparation
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-3xl leading-relaxed">
            Genuinely reads incoming invoices (PDF, JSON, Text), validates payment invariants with strict zero-guessing logic, and constructs matching unsigned EIP-155 transactions carrying the invoice reference.
          </p>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-200 text-sm flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-300 hover:text-white underline ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. Interactive Demo Fixtures Panel (Req-04) */}
        <SampleInvoicesPanel
          onSelectSample={loadSample}
          currentSampleId={currentSampleId}
        />

        {/* 2. Upload / Input Dropzone (Req-01) */}
        <UploadDropzone
          onInvoiceParsed={handleInvoiceParsed}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          onError={setErrorMessage}
        />

        {/* 3. Extraction View (Req-01) */}
        {currentInvoice && (
          <ExtractionView
            invoice={currentInvoice}
            onUpdateInvoice={handleInvoiceUpdated}
          />
        )}

        {/* 4. Validation Panel (Req-02 No-Guessing Rule) */}
        {validationResult && (
          <ValidationPanel validation={validationResult} />
        )}

        {/* 5. Payment Summary & Unsigned Transaction Card (Req-03) */}
        {preparedActionCard ? (
          <UnsignedTxCard
            card={preparedActionCard}
            wallet={wallet}
            onPaymentSuccess={() => {
              // Trigger reload of ledger
            }}
          />
        ) : currentInvoice && validationResult && !validationResult.canPreparePayment ? (
          <div className="p-6 rounded-xl bg-slate-900/60 border border-slate-800 text-center mb-8">
            <Shield className="w-10 h-10 text-amber-400 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-200 mb-1">
              Transaction Preparation Blocked by Invariants
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Per official requirements, the agent will not generate a speculative or fabricated transaction until all required fields are validated. Correct the missing fields above to prepare payment.
            </p>
          </div>
        ) : null}

        {/* 6. Payment History Ledger */}
        <HistoryLedger />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-400">Pharos Invoice-to-Payment Agent</span>
            <span>•</span>
            <span>Pharos Pacific (1672) & Base (8453)</span>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href="https://pharos-agent-arena.vercel.app/tasks/invoice-to-payment-agent"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition"
            >
              Task Page
            </a>
            <a
              href="https://docs.pharos.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition"
            >
              Pharos Docs
            </a>
            <a
              href="https://www.pharosscan.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-400 transition"
            >
              PharosScan
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
