import type { ChainConfig, VerifiedToken, AddEthereumChainParameter } from '../types/tokens.ts';

export const SUPPORTED_NETWORKS: Record<number, ChainConfig> = {
  1672: {
    chainId: 1672,
    networkName: 'Pharos Pacific Mainnet',
    shortName: 'Pharos',
    rpcUrl: 'https://rpc.pharos.xyz',
    fallbackRpcUrl: 'https://rpc.pharos.xyz',
    explorerUrl: 'https://www.pharosscan.xyz',
    nativeCurrency: {
      symbol: 'PROS',
      name: 'Pharos Native Gas',
      decimals: 18,
    },
    tokens: [
      {
        symbol: 'PROS',
        name: 'Pharos Native Currency',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        chainId: 1672,
        isNative: true,
        supportsReferenceCalldata: true, // Native tx data can carry utf-8 hex memo
        verificationSource: 'Pharos Canonical Gas Specification (docs.pharos.xyz)',
        lastVerified: '2026-11-08',
      },
      {
        symbol: 'USDC',
        name: 'USD Coin (Circle Deployed)',
        address: '0xc879c018db60520f4355c26ed1a6d572cdac1815',
        decimals: 6,
        chainId: 1672,
        supportsReferenceCalldata: false, // Standard ERC-20 transfer(address,uint256)
        verificationSource: 'Pharos Official Token Registry (docs.pharos.xyz/getting-started/token-registry)',
        lastVerified: '2026-11-08',
      },
      {
        symbol: 'WPROS',
        name: 'Wrapped PROS',
        address: '0x52c48d4213107b20bc583832b0d951fb9ca8f0b0',
        decimals: 18,
        chainId: 1672,
        supportsReferenceCalldata: false,
        verificationSource: 'Pharos Official Token Registry (docs.pharos.xyz/getting-started/token-registry)',
        lastVerified: '2026-11-08',
      },
      {
        symbol: 'LINK',
        name: 'Chainlink Token',
        address: '0x51e2A24742Db77604B881d6781Ee16B5b8fcBE29',
        decimals: 18,
        chainId: 1672,
        supportsReferenceCalldata: false,
        verificationSource: 'Pharos Official Token Registry (docs.pharos.xyz/getting-started/token-registry)',
        lastVerified: '2026-11-08',
      },
    ],
  },
  8453: {
    chainId: 8453,
    networkName: 'Base Mainnet',
    shortName: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: {
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
    },
    tokens: [
      {
        symbol: 'ETH',
        name: 'Ether Native Gas',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        chainId: 8453,
        isNative: true,
        supportsReferenceCalldata: true, // Native tx data can carry utf-8 hex memo
        verificationSource: 'Base Mainnet Protocol Specification',
        lastVerified: '2026-11-08',
      },
      {
        symbol: 'USDC',
        name: 'USD Coin (Circle Canonical)',
        address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        decimals: 6,
        chainId: 8453,
        supportsReferenceCalldata: false, // FiatTokenV2_2 standard transfer without memo
        verificationSource: 'Base Verified Contract (0x8335...2913)',
        lastVerified: '2026-11-08',
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        address: '0x4200000000000000000000000000000000000006',
        decimals: 18,
        chainId: 8453,
        supportsReferenceCalldata: false,
        verificationSource: 'Base Canonical WETH9 (0x4200...0006)',
        lastVerified: '2026-11-08',
      },
    ],
  },
  688689: {
    chainId: 688689,
    networkName: 'Pharos Atlantic Testnet',
    shortName: 'Atlantic',
    rpcUrl: 'https://atlantic.dplabs-internal.com',
    explorerUrl: 'https://atlantic.pharosscan.xyz/',
    nativeCurrency: {
      symbol: 'PROS',
      name: 'Testnet PROS',
      decimals: 18,
    },
    tokens: [
      {
        symbol: 'PROS',
        name: 'Testnet PROS Native',
        address: '0x0000000000000000000000000000000000000000',
        decimals: 18,
        chainId: 688689,
        isNative: true,
        supportsReferenceCalldata: true,
        verificationSource: 'Pharos Atlantic Gas Specification',
        lastVerified: '2026-11-08',
      },
      {
        symbol: 'USDC',
        name: 'USD Coin (Testnet)',
        address: '0xcfC8330f4BCAB529c625D12781b1C19466A9Fc8B',
        decimals: 6,
        chainId: 688689,
        supportsReferenceCalldata: false,
        verificationSource: 'Atlantic Testnet Token Registry (docs.pharos.xyz)',
        lastVerified: '2026-11-08',
      },
    ],
  },
};

export const DEFAULT_CHAIN_ID = 1672; // Pharos Pacific Mainnet

export function getNetworkConfig(chainId: number): ChainConfig {
  const config = SUPPORTED_NETWORKS[chainId];
  if (!config) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return config;
}

export function toHexChainId(chainId: number): `0x${string}` {
  return `0x${chainId.toString(16)}` as `0x${string}`;
}

export function getAddEthereumChainParams(chainId: number): AddEthereumChainParameter {
  const net = getNetworkConfig(chainId);
  return {
    chainId: toHexChainId(net.chainId),
    chainName: net.networkName,
    nativeCurrency: net.nativeCurrency,
    rpcUrls: [net.rpcUrl],
    blockExplorerUrls: [net.explorerUrl],
  };
}

export function findVerifiedToken(symbolOrAddress: string, chainId: number): VerifiedToken | undefined {
  const network = SUPPORTED_NETWORKS[chainId];
  if (!network) return undefined;

  const normalized = symbolOrAddress.trim().toLowerCase();

  return network.tokens.find((t) => {
    return (
      t.symbol.toLowerCase() === normalized ||
      t.address.toLowerCase() === normalized
    );
  });
}
