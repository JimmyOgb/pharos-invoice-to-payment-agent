import { createPublicClient, http, formatUnits, parseAbi } from 'viem';
import { SUPPORTED_NETWORKS, getNetworkConfig } from '../config/networks.ts';

const ERC20_BALANCE_ABI = parseAbi([
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]);

export interface LiveNetworkStatus {
  chainId: number;
  blockNumber: bigint;
  isReachable: boolean;
  latencyMs: number;
  checkedAt: string;
}

export function createRpcClient(chainId: number) {
  const network = getNetworkConfig(chainId);
  return createPublicClient({
    transport: http(network.rpcUrl, {
      timeout: 10_000,
      retryCount: 2,
    }),
  });
}

export async function checkNetworkHealth(chainId: number): Promise<LiveNetworkStatus> {
  const client = createRpcClient(chainId);
  const start = performance.now();
  try {
    const blockNumber = await client.getBlockNumber();
    const latency = Math.round(performance.now() - start);
    return {
      chainId,
      blockNumber,
      isReachable: true,
      latencyMs: latency,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      chainId,
      blockNumber: 0n,
      isReachable: false,
      latencyMs: Math.round(performance.now() - start),
      checkedAt: new Date().toISOString(),
    };
  }
}

export async function fetchLiveBalance(
  accountAddress: `0x${string}`,
  chainId: number,
  tokenAddress?: `0x${string}`
): Promise<{ rawBalance: bigint; formatted: string; symbol: string; decimals: number }> {
  const client = createRpcClient(chainId);
  const network = getNetworkConfig(chainId);

  if (!tokenAddress || tokenAddress === '0x0000000000000000000000000000000000000000') {
    // Native gas token balance
    const balance = await client.getBalance({ address: accountAddress });
    return {
      rawBalance: balance,
      formatted: formatUnits(balance, network.nativeCurrency.decimals),
      symbol: network.nativeCurrency.symbol,
      decimals: network.nativeCurrency.decimals,
    };
  } else {
    // ERC-20 token balance
    const [balance, decimals, symbol] = await Promise.all([
      client.readContract({
        address: tokenAddress,
        abi: ERC20_BALANCE_ABI,
        functionName: 'balanceOf',
        args: [accountAddress],
      }),
      client.readContract({
        address: tokenAddress,
        abi: ERC20_BALANCE_ABI,
        functionName: 'decimals',
      }),
      client.readContract({
        address: tokenAddress,
        abi: ERC20_BALANCE_ABI,
        functionName: 'symbol',
      }),
    ]);

    return {
      rawBalance: balance,
      formatted: formatUnits(balance, decimals),
      symbol,
      decimals,
    };
  }
}
