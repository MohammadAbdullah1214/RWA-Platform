'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrexClient } from '@/lib/trex-client';
import { toast } from 'sonner';

export interface UserIdentity {
  wallet: string;
  onchainIdAddress: string | null;
  country: string | null;
  isVerified: boolean;
  verificationReason: string | null;
  claims: IdentityClaim[];
}

export interface IdentityClaim {
  id: number;
  topic: number;
  topicName: string;
  issuer: string;
  data: string | null;
  issuedAt: number;
  expiresAt: number | null;
  revoked: boolean;
}

interface UseIdentityOptions {
  trexClient?: TrexClient | null;
  walletAddress?: string | null;
}

export function useIdentity(options?: UseIdentityOptions) {
  const { trexClient, walletAddress } = options || {};
  const [identity, setIdentity] = useState<UserIdentity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingOnchainId, setPendingOnchainId] = useState<string | null>(null); // NEW: Store created but unregistered OnchainID

  // Map topic numbers to human-readable names
  const getTopicName = (topic: number): string => {
    const topicMap: Record<number, string> = {
      1: 'KYC Verified',
      2: 'AML Checked',
      3: 'Accredited Investor',
      4: 'Country Approved',
      5: 'Age Verified',
    };
    return topicMap[topic] || `Topic ${topic}`;
  };

  // Load identity data from blockchain
  const loadIdentity = useCallback(async () => {
    if (!trexClient || !walletAddress) {
      console.log('Skipping identity load - wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userIdentity = await trexClient.getUserIdentity(walletAddress);
      
      // Transform claims to include topic names (handle empty or undefined claims array)
      const claimsWithNames = (userIdentity.claims || []).map((claim: any, index: number) => ({
        id: claim.id || index,
        topic: claim.topic,
        topicName: getTopicName(claim.topic),
        issuer: claim.issuer,
        data: claim.data || null,
        issuedAt: claim.issued_at || Date.now(),
        expiresAt: claim.expires_at || null,
        revoked: claim.revoked || false,
      }));

      setIdentity({
        wallet: userIdentity.wallet,
        onchainIdAddress: userIdentity.onchainIdAddress || pendingOnchainId, // Use pending if not registered yet
        country: userIdentity.country || null,
        isVerified: userIdentity.isVerified || false,
        verificationReason: userIdentity.verificationReason || null,
        claims: claimsWithNames,
      });
      
      // Clear pending OnchainID if it's now registered
      if (userIdentity.onchainIdAddress && pendingOnchainId) {
        setPendingOnchainId(null);
      }
    } catch (err: any) {
      console.error('Failed to load identity:', err);
      setError(err.message);
      // Don't show error toast on initial load - user might not have identity yet
    } finally {
      setLoading(false);
    }
  }, [trexClient, walletAddress, pendingOnchainId]);

  // Create a new OnchainID for the connected wallet
  const createOnchainId = useCallback(async () => {
    if (!trexClient || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    const loadingToast = toast.loading('Creating your OnchainID...');

    try {
      const onchainIdAddress = await trexClient.createOnChainId(
        walletAddress,
        `OnchainID-${walletAddress.slice(0, 10)}`
      );

      // Store the pending OnchainID address
      setPendingOnchainId(onchainIdAddress);

      toast.success(
        `OnchainID created! Now register it with your country.`,
        { 
          id: loadingToast,
          description: `Address: ${onchainIdAddress.slice(0, 20)}...`
        }
      );

      // Reload identity to update UI
      await loadIdentity();
      return onchainIdAddress;
    } catch (err: any) {
      toast.error(`Failed to create OnchainID: ${err.message}`, { id: loadingToast });
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trexClient, walletAddress, loadIdentity]);

  // Register identity in the Identity Registry
  const registerIdentity = useCallback(async (country: string) => {
    if (!trexClient || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    const onchainIdToRegister = identity?.onchainIdAddress || pendingOnchainId;
    
    if (!onchainIdToRegister) {
      throw new Error('OnchainID must be created first');
    }

    setLoading(true);
    const loadingToast = toast.loading('Registering your identity...');

    try {
      const txHash = await trexClient.registerIdentity(
        walletAddress,
        onchainIdToRegister,
        country
      );

      toast.success(
        `Identity registered! Now waiting for admin KYC approval.`,
        { 
          id: loadingToast,
          description: `TX: ${txHash.slice(0, 10)}...`
        }
      );

      // Clear pending OnchainID since it's now registered
      setPendingOnchainId(null);

      // Reload identity to reflect changes
      await loadIdentity();
      return txHash;
    } catch (err: any) {
      toast.error(`Failed to register identity: ${err.message}`, { id: loadingToast });
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trexClient, walletAddress, identity, pendingOnchainId, loadIdentity]);

  // Add a claim to the OnchainID (admin/issuer only)
  const addClaim = useCallback(async (
    topic: number,
    data?: string,
    expiresAt?: number
  ) => {
    if (!trexClient || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    const onchainIdToUse = identity?.onchainIdAddress || pendingOnchainId;
    
    if (!onchainIdToUse) {
      throw new Error('OnchainID required');
    }

    setLoading(true);
    const topicName = getTopicName(topic);
    const loadingToast = toast.loading(`Adding ${topicName} claim...`);

    try {
      const txHash = await trexClient.addClaim(
        onchainIdToUse,
        topic,
        data,
        expiresAt
      );

      toast.success(
        `${topicName} claim added! TX: ${txHash.slice(0, 10)}...`,
        { id: loadingToast }
      );

      // Reload identity to show new claim
      await loadIdentity();
      return txHash;
    } catch (err: any) {
      toast.error(`Failed to add claim: ${err.message}`, { id: loadingToast });
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trexClient, walletAddress, identity, pendingOnchainId, loadIdentity]);

  // Auto-load identity when wallet connects
  useEffect(() => {
    loadIdentity();
  }, [loadIdentity]);

  return {
    identity,
    loading,
    error,
    loadIdentity,
    createOnchainId,
    registerIdentity,
    addClaim,
    hasOnchainId: !!identity?.onchainIdAddress,
    isVerified: identity?.isVerified || false,
    claims: identity?.claims || [],
  };
}
