/**
 * Use Assets Hook
 * Fetches real TREX token data from blockchain
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrexClient } from '@/lib/trex-client';
import { TrexToken, UserIdentity, CLAIM_TOPIC_NAMES } from '@/types/trex-contracts';

export interface AssetData {
  token: TrexToken | null;
  userBalance: string;
  userIdentity: UserIdentity | null;
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAssets(trexClient: TrexClient | null, walletAddress: string | null) {
  const [token, setToken] = useState<TrexToken | null>(null);
  const [userBalance, setUserBalance] = useState<string>('0');
  const [userIdentity, setUserIdentity] = useState<UserIdentity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch token information
   */
  const fetchTokenInfo = useCallback(async () => {
    if (!trexClient || !walletAddress) return;

    try {
      const tokenData = await trexClient.getTokenData();
      setToken(tokenData);
    } catch (err: any) {
      console.error('Failed to fetch token info:', err);
      setError(err.message || 'Failed to load token data');
    }
  }, [trexClient]);

  /**
   * Fetch user balance
   */
  const fetchBalance = useCallback(async () => {
    if (!trexClient || !walletAddress) {
      setUserBalance('0');
      return;
    }

    try {
      const balance = await trexClient.getBalance(walletAddress);
      setUserBalance(balance);
    } catch (err: any) {
      console.error('Failed to fetch balance:', err);
      setUserBalance('0');
    }
  }, [trexClient, walletAddress]);

  /**
   * Fetch user identity and verification status
   */
  const fetchUserIdentity = useCallback(async () => {
    if (!trexClient || !walletAddress) {
      setUserIdentity(null);
      return;
    }

    try {
      const identity = await trexClient.getUserIdentity(walletAddress);
      setUserIdentity(identity);
    } catch (err: any) {
      console.error('Failed to fetch user identity:', err);
      // Create a basic identity object even if query fails
      setUserIdentity({
        wallet: walletAddress,
        isVerified: false,
        verificationReason: 'Failed to check verification status',
        claims: [],
      });
    }
  }, [trexClient, walletAddress]);

  /**
   * Fetch all asset data
   */
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([fetchTokenInfo(), fetchBalance(), fetchUserIdentity()]);
    } catch (err: any) {
      console.error('Failed to fetch asset data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchTokenInfo, fetchBalance, fetchUserIdentity]);

  /**
   * Refresh data
   */
  const refresh = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  /**
   * Initial load
   */
  useEffect(() => {
    if (trexClient && walletAddress) {
      // Only load data when both client AND wallet are connected
      fetchAllData();
    } else {
      // Clear data when client or wallet disconnects
      setToken(null);
      setUserBalance('0');
      setUserIdentity(null);
      setIsLoading(false);
      setError(null);
    }
  }, [trexClient, walletAddress, fetchAllData]);

  return {
    // Data
    token,
    userBalance,
    userIdentity,
    isVerified: userIdentity?.isVerified || false,

    // State
    isLoading,
    error,

    // Actions
    refresh,
  };
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
 * Get claim topic name
 */
export function getClaimTopicName(topicId: number): string {
  return CLAIM_TOPIC_NAMES[topicId] || `Unknown Topic ${topicId}`;
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
