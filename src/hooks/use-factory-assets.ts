/**
 * Use Factory Assets Hook
 * Manages multi-token assets via TREX Factory
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrexClient } from '@/lib/trex-client';
import { TokenInfoFromFactory } from '@/types/trex-contracts';

export interface FactoryAsset extends TokenInfoFromFactory {
  // Extend with parsed metadata
  parsedMetadata?: {
    name?: string;
    type?: string;
    location?: string;
    underlyingValue?: number;
    currency?: string;
    [key: string]: any;
  };
}

export interface FactoryAssetData {
  assets: FactoryAsset[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getAssetById: (assetId: number) => FactoryAsset | undefined;
  getAssetByContract: (contract: string) => FactoryAsset | undefined;
}

export function useFactoryAssets(trexClient: TrexClient | null): FactoryAssetData {
  const [assets, setAssets] = useState<FactoryAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all assets from factory
   */
  const fetchAssets = useCallback(async () => {
    if (!trexClient) {
      setAssets([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const tokens = await trexClient.getAllFactoryTokens();
      
      // Parse metadata for each token
      const assetsWithParsed: FactoryAsset[] = tokens.map(token => ({
        ...token,
        parsedMetadata: token.metadata ? tryParseJson(token.metadata) : undefined,
      }));

      setAssets(assetsWithParsed);
    } catch (err: any) {
      console.error('Failed to fetch factory assets:', err);
      setError(err.message || 'Failed to load assets');
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, [trexClient]);

  /**
   * Get asset by ID
   */
  const getAssetById = useCallback((assetId: number): FactoryAsset | undefined => {
    return assets.find(a => a.asset_id === assetId);
  }, [assets]);

  /**
   * Get asset by contract address
   */
  const getAssetByContract = useCallback((contract: string): FactoryAsset | undefined => {
    return assets.find(a => a.contract_address === contract);
  }, [assets]);

  /**
   * Initial load
   */
  useEffect(() => {
    if (trexClient) {
      fetchAssets();
    } else {
      setAssets([]);
      setIsLoading(false);
      setError(null);
    }
  }, [trexClient, fetchAssets]);

  return {
    assets,
    isLoading,
    error,
    refresh: fetchAssets,
    getAssetById,
    getAssetByContract,
  };
}

/**
 * Try to parse JSON safely
 */
function tryParseJson(jsonString: string): any {
  try {
    return JSON.parse(jsonString);
  } catch {
    return {};
  }
}

/**
 * Hook to get balances for a specific token
 */
export function useTokenBalance(
  trexClient: TrexClient | null,
  tokenContract: string | null,
  walletAddress: string | null
) {
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!trexClient || !tokenContract || !walletAddress) {
      setBalance('0');
      return;
    }

    setIsLoading(true);
    try {
      const bal = await trexClient.getBalanceForToken(tokenContract, walletAddress);
      setBalance(bal);
    } catch (err) {
      console.error('Failed to fetch token balance:', err);
      setBalance('0');
    } finally {
      setIsLoading(false);
    }
  }, [trexClient, tokenContract, walletAddress]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, isLoading, refresh: fetchBalance };
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(amount: string, decimals: number = 6): string {
  try {
    const num = parseFloat(amount) / Math.pow(10, decimals);
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals,
    });
  } catch {
    return '0.00';
  }
}

/**
 * Parse amount to base units (micro tokens)
 */
export function parseTokenAmount(amount: string, decimals: number = 6): string {
  try {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    return Math.floor(num * Math.pow(10, decimals)).toString();
  } catch {
    return '0';
  }
}
