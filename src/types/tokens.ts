/**
 * Network and Token configuration types
 */

export interface VerifiedToken {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
  chainId: number;
  isNative?: boolean;
  supportsReferenceCalldata?: boolean; // True for native or tokens with transferWithReference
  verificationSource: string;
  lastVerified: string;
}

export interface NativeCurrencyConfig {
  name: string;
  symbol: string;
  decimals: number;
}

export interface ChainConfig {
  chainId: number;
  networkName: string;
  shortName: string;
  rpcUrl: string;
  fallbackRpcUrl?: string;
  explorerUrl: string;
  nativeCurrency: NativeCurrencyConfig;
  tokens: VerifiedToken[];
}

export interface AddEthereumChainParameter {
  chainId: `0x${string}`;
  chainName: string;
  nativeCurrency: NativeCurrencyConfig;
  rpcUrls: string[];
  blockExplorerUrls: string[];
}
