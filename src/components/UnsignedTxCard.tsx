import React, { useState } from 'react';
import type { PreparedInvoiceActionCard } from '../types/transaction.ts';
import type { WalletState } from '../hooks/useWallet.ts';
import { getNetworkConfig } from '../config/networks.ts';
import { invoiceDb } from '../storage/db.ts';
import { Copy, Check, ExternalLink, Send, ShieldCheck, Terminal, AlertCircle } from 'lucide-react';

interface UnsignedTxCardProps {
  card: PreparedInvoiceActionCard;
  wallet: WalletState & {
    connect: () => Promise<void>;
    sendTransaction: (tx: any) => Promise<`0x${string}`>;
  };
  onPaymentSuccess?: (txHash: `0x${string}`) => void;
}

export const UnsignedTxCard: React.FC<UnsignedTxCardProps> = ({ card, wallet, onPaymentSuccess }) => {
  const [copiedTx, setCopiedTx] = useState(false);
  const [copiedData, setCopiedData] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const network = getNetworkConfig(card.chainId);

  const copyToClipboard = (text: string, type: 'tx' | 'data') => {
    navigator.clipboard.writeText(text);
    if (type === 'tx') {
      setCopiedTx(true);
      setTimeout(() => setCopiedTx(false), 2000);
    } else {
      setCopiedData(true);
      setTimeout(() => setCopiedData(false), 2000);
    }
  };

  const handleExecutePayment = async () => {
    if (!wallet.isConnected) {
      await wallet.connect();
      return;
    }

    setIsSending(true);
    setSendError(null);

    try {
      const hash = await wallet.sendTransaction(card.unsignedTx);
      setTxHash(hash);

      // Record in local database
      invoiceDb.savePaymentRecord({
        id: `pay_${Date.now()}`,
        invoiceId: card.invoiceId,
        invoiceReference: card.invoiceReference,
        payeeName: card.payeeName,
        payeeAddress: card.payeeAddress,
        amount: card.amountFormatted,
        tokenSymbol: card.tokenSymbol,
        chainId: card.chainId,
        status: 'PAID',
        txHash: hash,
        explorerUrl: `${network.explorerUrl}/tx/${hash}`,
        createdAt: new Date().toISOString(),
      });

      if (onPaymentSuccess) {
        onPaymentSuccess(hash);
      }
    } catch (err: any) {
      setSendError(err.message || 'Transaction rejected by user or RPC error.');
    } finally {
      setIsSending(false);
    }
  };

  const isNative = card.isNative;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 mb-8">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
            <span>Payment Summary & Unsigned On-Chain Transaction (Req-03)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically prepared and ready for non-custodial EIP-1193 wallet signing
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
          Ready for Signature
        </span>
      </div>

      {/* Grid: Payment Summary & Reference Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Payment Summary */}
        <div className="bg-slate-950/80 rounded-lg p-4 border border-slate-850">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Payment Summary Breakdown
          </h3>
          <dl className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-850">
              <dt className="text-slate-400">Payee Organization</dt>
              <dd className="font-semibold text-slate-200">{card.payeeName}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-850">
              <dt className="text-slate-400">Payee 0x Address</dt>
              <dd className="font-mono text-cyan-400 break-all">{card.payeeAddress}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-850">
              <dt className="text-slate-400">Payment Amount</dt>
              <dd className="font-bold text-slate-100 text-sm">
                {card.amountFormatted} {card.tokenSymbol}
              </dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-850">
              <dt className="text-slate-400">Base Units (Wei / Int)</dt>
              <dd className="font-mono text-slate-300">{card.amountBaseUnits}</dd>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-850">
              <dt className="text-slate-400">Target Network</dt>
              <dd className="font-medium text-slate-200">{card.networkName} ({card.chainId})</dd>
            </div>
            <div className="flex justify-between py-1">
              <dt className="text-slate-400">Invoice Reference</dt>
              <dd className="font-mono font-bold text-amber-300">{card.invoiceReference}</dd>
            </div>
          </dl>
        </div>

        {/* Reference Architecture & Calldata Details */}
        <div className="bg-slate-950/80 rounded-lg p-4 border border-slate-850">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Invoice Reference Architecture
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                isNative
                  ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  : 'bg-indigo-950 text-indigo-300 border-indigo-800'
              }`}
            >
              {card.referenceEncoding.tier}
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-3">
            <p className="leading-relaxed text-slate-400">
              {card.referenceEncoding.explanation}
            </p>

            {card.referenceEncoding.contractMethodLimitationDisclosed && (
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-amber-300/90 flex items-start space-x-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{card.referenceEncoding.contractMethodLimitationDisclosed}</span>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Method / Execution Selector:</span>
                <span className="font-mono text-slate-200">{card.functionSelector}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Calldata Carries Memo:</span>
                <span
                  className={`font-mono font-bold ${
                    card.calldataBreakdown.calldataCarriesReference ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  {card.calldataBreakdown.calldataCarriesReference ? 'YES (UTF-8 Hex Memo)' : 'NO (Bound in Metadata)'}
                </span>
              </div>
            </div>

            {/* Calldata snippet */}
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Raw Calldata Data:</span>
                <button
                  onClick={() => copyToClipboard(card.calldataBreakdown.rawHex, 'data')}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                >
                  {copiedData ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedData ? 'Copied' : 'Copy Data'}</span>
                </button>
              </div>
              <pre className="p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                {card.calldataBreakdown.rawHex}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Unsigned Transaction JSON payload */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Unsigned EIP-155 Transaction Payload
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(JSON.stringify(card.unsignedTx, null, 2), 'tx')}
            className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1 rounded bg-slate-800 border border-slate-700 flex items-center space-x-1"
          >
            {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedTx ? 'Copied JSON' : 'Copy Unsigned TX'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed">
          {JSON.stringify(card.unsignedTx, null, 2)}
        </pre>
      </div>

      {/* Wallet Execution or Broadcast Feedback */}
      {txHash ? (
        <div className="p-4 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-200">
          <div className="flex items-center space-x-2 mb-2 font-bold text-sm">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>Transaction Submitted to Network!</span>
          </div>
          <p className="text-xs text-slate-300 font-mono break-all mb-2">
            Tx Hash: {txHash}
          </p>
          <a
            href={`${network.explorerUrl}/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1 text-xs text-cyan-400 underline hover:text-cyan-300"
          >
            <span>View on Block Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ) : (
        <div>
          {sendError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300">
              Execution Error: {sendError}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-slate-950 border border-slate-800">
            <div className="flex items-center space-x-3">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Non-Custodial User Execution</p>
                <p className="text-[11px] text-slate-400">
                  Transactions are submitted directly to your connected browser wallet for cryptographic signing.
                </p>
              </div>
            </div>

            <button
              onClick={handleExecutePayment}
              disabled={isSending}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-bold tracking-wide shadow-lg shadow-emerald-900/20 flex items-center justify-center space-x-2 transition"
            >
              <Send className="w-4 h-4" />
              <span>{isSending ? 'Waiting for Signature...' : wallet.isConnected ? 'Sign & Execute via Wallet' : 'Connect Wallet to Pay'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
