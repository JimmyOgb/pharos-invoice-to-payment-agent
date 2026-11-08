import React from 'react';
import { SUPPORTED_NETWORKS } from '../config/networks.ts';
import type { WalletState } from '../hooks/useWallet.ts';
import { ShieldCheck, Wallet, Activity, ExternalLink } from 'lucide-react';

interface HeaderProps {
  selectedChainId: number;
  onSelectChainId: (chainId: number) => void;
  wallet: WalletState & {
    connect: () => Promise<void>;
    disconnect: () => void;
    switchNetwork: (chainId: number) => Promise<void>;
  };
}

export const Header: React.FC<HeaderProps> = ({ selectedChainId, onSelectChainId, wallet }) => {
  const currentNetwork = SUPPORTED_NETWORKS[selectedChainId];

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">Pharos PayInvoice</span>
              <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-950 text-cyan-400 border border-cyan-800 rounded-full">
                Zero-Simulation Agent
              </span>
            </div>
            <p className="text-xs text-slate-400">EIP-1193 Invoice Extraction & Payment Preparation Sentinel</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-4">
          {/* RPC Live Status */}
          <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                wallet.networkStatus?.isReachable ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300 font-mono">
              {wallet.networkStatus?.isReachable
                ? `Block #${wallet.networkStatus.blockNumber.toString()} (${wallet.networkStatus.latencyMs}ms)`
                : 'Connecting RPC...'}
            </span>
          </div>

          {/* Network Selector */}
          <select
            value={selectedChainId}
            onChange={(e) => {
              const newCid = Number(e.target.value);
              onSelectChainId(newCid);
              if (wallet.isConnected && wallet.chainId !== newCid) {
                wallet.switchNetwork(newCid);
              }
            }}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {Object.values(SUPPORTED_NETWORKS).map((net) => (
              <option key={net.chainId} value={net.chainId}>
                {net.networkName} ({net.chainId})
              </option>
            ))}
          </select>

          {/* Wallet Button */}
          {wallet.isConnected && wallet.address ? (
            <div className="flex items-center space-x-2">
              <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center space-x-2 text-xs">
                <span className="text-slate-400 font-mono">
                  {wallet.nativeBalance ? `${Number(wallet.nativeBalance).toFixed(4)} ${currentNetwork?.nativeCurrency.symbol}` : '...'}
                </span>
                <span className="text-slate-600">|</span>
                <span className="font-mono text-cyan-400 font-semibold">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </span>
              </div>
              <button
                onClick={wallet.disconnect}
                className="text-xs text-slate-400 hover:text-rose-400 px-2 py-1.5 rounded border border-slate-700 hover:border-rose-900/60 transition"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={wallet.connect}
              disabled={wallet.isConnecting}
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs sm:text-sm px-4 py-2 rounded-lg shadow transition disabled:opacity-50"
            >
              <Wallet className="w-4 h-4" />
              <span>{wallet.isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
