'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrexClient } from '@/lib/trex-client';
import { TREX_CONTRACTS } from '@/lib/zigchain-config';

export interface UserRoles {
  isOwner: boolean;
  isIssuer: boolean;
  isController: boolean;
  isAgent: boolean;
  roles: {
    owner: string;
    issuer: string;
    controller: string;
  } | null;
}

interface UseRoleOptions {
  trexClient?: TrexClient | null;
  walletAddress?: string | null;
  tokenContracts?: string[];
}

export function useRole(options?: UseRoleOptions) {
  const { trexClient, walletAddress, tokenContracts } = options || {};
  const [userRoles, setUserRoles] = useState<UserRoles>({
    isOwner: false,
    isIssuer: false,
    isController: false,
    isAgent: false,
    roles: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRoles = useCallback(async () => {
    if (!trexClient || !walletAddress) {
      console.log('Skipping role load - wallet not connected');
      return;
    }

    const tokensToCheck =
      tokenContracts && tokenContracts.length > 0
        ? tokenContracts
        : TREX_CONTRACTS.tokens && TREX_CONTRACTS.tokens.length > 0
        ? TREX_CONTRACTS.tokens
        : [TREX_CONTRACTS.token];

    setLoading(true);
    setError(null);

    try {
      const roleResults = await Promise.all(
        tokensToCheck.map(async (token) => {
          try {
            const roles = await trexClient.getRoles(token);
            return { token, roles };
          } catch (err) {
            return null;
          }
        })
      );
      const validRoles = roleResults.filter(Boolean) as Array<{
        token: string;
        roles: { owner: string; issuer: string; controller: string };
      }>;
      const normalizedWallet = walletAddress.toLowerCase();
      const isOwner = validRoles.some(
        ({ roles }) => roles.owner.toLowerCase() === normalizedWallet
      );
      const isIssuer = validRoles.some(
        ({ roles }) => roles.issuer.toLowerCase() === normalizedWallet
      );
      const isController = validRoles.some(
        ({ roles }) => roles.controller.toLowerCase() === normalizedWallet
      );
      const isAgentChecks = await Promise.all(
        tokensToCheck.map(async (token) => {
          try {
            return await trexClient.isAgent(walletAddress, token);
          } catch (err) {
            return false;
          }
        })
      );
      const isAgentResponse = isAgentChecks.some(Boolean);
      const primaryRoles =
        validRoles.find(
          ({ roles }) =>
            roles.owner.toLowerCase() === normalizedWallet ||
            roles.issuer.toLowerCase() === normalizedWallet ||
            roles.controller.toLowerCase() === normalizedWallet
        )?.roles || validRoles[0]?.roles || null;

      setUserRoles({
        isOwner,
        isIssuer,
        isController,
        isAgent: isAgentResponse,
        roles: primaryRoles,
      });
    } catch (err: any) {
      console.error('Failed to load roles:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [trexClient, walletAddress, tokenContracts]);

  // Auto-load roles when wallet connects
  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  return {
    ...userRoles,
    loading,
    error,
    loadRoles,
  };
}
