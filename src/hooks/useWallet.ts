import { useState, useEffect, useCallback } from 'react';
import { getAddEthereumChainParams, toHexChainId, DEFAULT_CHAIN_ID } from '../config/networks.ts';
import { fetchLiveBalance, checkNetworkHealth, type LiveNetworkStatus } from '../services/liveRpc.ts';
import type { UnsignedEip155Transaction } from '../types/transaction.ts';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletState {
  isAvailable: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  address: `0x${string}` | null;
  chainId: number | null;
  nativeBalance: string | null;
  networkStatus: LiveNetworkStatus | null;
  error: string | null;
}

export function useWallet(targetChainId: number = DEFAULT_CHAIN_ID) {
  const [state, setState] = useState<WalletState>({
    isAvailable: typeof window !== 'undefined' && !!window.ethereum,
    isConnected: false,
    isConnecting: false,
    address: null,
    chainId: null,
    nativeBalance: null,
    networkStatus: null,
    error: null,
  });

  // Check network RPC health
  const refreshNetworkHealth = useCallback(async (chainId: number) => {
    try {
      const status = await checkNetworkHealth(chainId);
      setState((prev) => ({ ...prev, networkStatus: status }));
    } catch (e) {
      // Ignore background check failure
    }
  }, []);

  // Update live balance
  const refreshBalance = useCallback(async (address: `0x${string}`, chainId: number) => {
    try {
      const bal = await fetchLiveBalance(address, chainId);
      setState((prev) => ({ ...prev, nativeBalance: bal.formatted }));
    } catch (e: any) {
      console.warn('Could not fetch balance from RPC:', e.message);
    }
  }, []);

  // Sync state on load
  useEffect(() => {
    refreshNetworkHealth(targetChainId);

    if (typeof window === 'undefined' || !window.ethereum) {
      setState((prev) => ({ ...prev, isAvailable: false }));
      return;
    }

    const eth = window.ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setState((prev) => ({ ...prev, isConnected: false, address: null, nativeBalance: null }));
      } else {
        const addr = accounts[0] as `0x${string}`;
        setState((prev) => ({ ...prev, isConnected: true, address: addr }));
        if (state.chainId) {
          refreshBalance(addr, state.chainId);
        }
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      const cid = parseInt(chainIdHex, 16);
      setState((prev) => ({ ...prev, chainId: cid }));
      refreshNetworkHealth(cid);
      if (state.address) {
        refreshBalance(state.address, cid);
      }
    };

    // Initial check
    eth
      .request({ method: 'eth_accounts' })
      .then((accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          const addr = accounts[0] as `0x${string}`;
          eth.request({ method: 'eth_chainId' }).then((hexChain: string) => {
            const cid = parseInt(hexChain, 16);
            setState((prev) => ({
              ...prev,
              isConnected: true,
              address: addr,
              chainId: cid,
            }));
            refreshBalance(addr, cid);
          });
        }
      })
      .catch(() => {});

    eth.on?.('accountsChanged', handleAccountsChanged);
    eth.on?.('chainChanged', handleChainChanged);

    return () => {
      eth.removeListener?.('accountsChanged', handleAccountsChanged);
      eth.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [targetChainId, refreshBalance, refreshNetworkHealth]);

  const connect = async () => {
    if (!window.ethereum) {
      setState((prev) => ({
        ...prev,
        error: 'No EIP-1193 compatible web3 wallet found. Please install MetaMask, Coinbase Wallet, or Rabby.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const hexChain = await window.ethereum.request({ method: 'eth_chainId' });
      const cid = parseInt(hexChain, 16);
      const addr = accounts[0] as `0x${string}`;

      setState((prev) => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        address: addr,
        chainId: cid,
        error: null,
      }));

      refreshBalance(addr, cid);
    } catch (err: any) {
      setState((prev) => ({
        ...prev,
        isConnecting: false,
        error: err.message || 'User rejected the connection request.',
      }));
    }
  };

  const disconnect = () => {
    setState((prev) => ({
      ...prev,
      isConnected: false,
      address: null,
      nativeBalance: null,
    }));
  };

  const switchNetwork = async (chainId: number) => {
    if (!window.ethereum) return;
    const hexChainId = toHexChainId(chainId);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      setState((prev) => ({ ...prev, chainId }));
      refreshNetworkHealth(chainId);
      if (state.address) {
        refreshBalance(state.address, chainId);
      }
    } catch (switchError: any) {
      // Code 4902 means network is not added yet
      if (switchError.code === 4902) {
        try {
          const params = getAddEthereumChainParams(chainId);
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [params],
          });
          setState((prev) => ({ ...prev, chainId }));
          refreshNetworkHealth(chainId);
        } catch (addError: any) {
          setState((prev) => ({ ...prev, error: `Failed to add network: ${addError.message}` }));
        }
      } else {
        setState((prev) => ({ ...prev, error: `Failed to switch network: ${switchError.message}` }));
      }
    }
  };

  const sendTransaction = async (tx: UnsignedEip155Transaction): Promise<`0x${string}`> => {
    if (!window.ethereum) {
      throw new Error('No web3 wallet detected.');
    }
    if (!state.address) {
      throw new Error('Wallet is not connected.');
    }

    const txParams = {
      from: state.address,
      to: tx.to,
      value: tx.value,
      data: tx.data,
    };

    const hash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [txParams],
    });

    if (state.address && state.chainId) {
      refreshBalance(state.address, state.chainId);
    }

    return hash as `0x${string}`;
  };

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    sendTransaction,
    refreshBalance: () => {
      if (state.address && state.chainId) {
        refreshBalance(state.address, state.chainId);
      }
    },
  };
}
