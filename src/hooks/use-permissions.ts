"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TREX_CONTRACTS } from "@/lib/zigchain-config";
import type { ComplianceConfigResponse } from "@/types/trex-contracts";
import type { TrexClient } from "@/lib/trex-client";

export interface PermissionsState {
  isFactoryAdmin: boolean;
  isIdentityRegistryOwner: boolean;
  isClaimTopicsOwner: boolean;
  isComplianceOwner: boolean;
  isTokenOwner: boolean;
  isTokenIssuer: boolean;
  isTokenController: boolean;
  isTokenAgent: boolean;
  isTrustedIssuer: boolean;
  canKycProvider: boolean;
}

interface UsePermissionsOptions {
  trexClient?: TrexClient | null;
  walletAddress?: string | null;
  tokenContract?: string | null;
}

const emptyPermissions: PermissionsState = {
  isFactoryAdmin: false,
  isIdentityRegistryOwner: false,
  isClaimTopicsOwner: false,
  isComplianceOwner: false,
  isTokenOwner: false,
  isTokenIssuer: false,
  isTokenController: false,
  isTokenAgent: false,
  isTrustedIssuer: false,
  canKycProvider: false,
};

export function usePermissions(options?: UsePermissionsOptions) {
  const { trexClient, walletAddress, tokenContract } = options || {};
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissions, setPermissions] =
    useState<PermissionsState>(emptyPermissions);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    let isCancelled = false;

    const loadPermissions = async () => {
      if (!trexClient || !walletAddress) {
        setPermissions(emptyPermissions);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const normalizedWallet = walletAddress.toLowerCase();
        const contractToCheck = tokenContract || TREX_CONTRACTS.token;

        const [
          factoryConfig,
          identityRegistryConfig,
          claimTopicsOwner,
          complianceConfig,
          tokenRoles,
          isAgent,
          issuerTopics,
        ] = await Promise.all([
          trexClient.getFactoryConfig().catch(() => null),
          trexClient.getIdentityRegistryConfig().catch(() => null),
          trexClient.getClaimTopicsOwner().catch(() => null),
          trexClient.getComplianceConfig().catch(() => null),
          trexClient.getRoles(contractToCheck).catch(() => null),
          trexClient.isAgent(walletAddress, contractToCheck).catch(() => false),
          trexClient.getIssuerTopics(walletAddress).catch(() => null),
        ]);

        if (isCancelled || requestId !== requestIdRef.current) {
          return;
        }

        const isFactoryAdmin =
          !!factoryConfig &&
          factoryConfig.admin.toLowerCase() === normalizedWallet;
        const isIdentityRegistryOwner =
          !!identityRegistryConfig &&
          identityRegistryConfig.owner.toLowerCase() === normalizedWallet;
        const isClaimTopicsOwner =
          !!claimTopicsOwner &&
          claimTopicsOwner.toLowerCase() === normalizedWallet;
        const isComplianceOwner =
          !!(complianceConfig as ComplianceConfigResponse | null) &&
          (complianceConfig as ComplianceConfigResponse).owner.toLowerCase() ===
            normalizedWallet;
        const isTokenOwner =
          !!tokenRoles &&
          tokenRoles.owner.toLowerCase() === normalizedWallet;
        const isTokenIssuer =
          !!tokenRoles &&
          tokenRoles.issuer.toLowerCase() === normalizedWallet;
        const isTokenController =
          !!tokenRoles &&
          tokenRoles.controller.toLowerCase() === normalizedWallet;
        const isTokenAgent = !!isAgent;
        const hasIssuerTopics = !!issuerTopics && issuerTopics.length > 0;
        const canKycProvider =
          !!issuerTopics && issuerTopics.includes(1);

        setPermissions({
          isFactoryAdmin,
          isIdentityRegistryOwner,
          isClaimTopicsOwner,
          isComplianceOwner,
          isTokenOwner,
          isTokenIssuer,
          isTokenController,
          isTokenAgent,
          isTrustedIssuer: hasIssuerTopics,
          canKycProvider,
        });
      } catch (err: any) {
        console.error("Failed to load permissions:", err);
        setError(err.message || "Failed to load permissions");
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
    return () => {
      isCancelled = true;
    };
  }, [trexClient, walletAddress, tokenContract]);

  const canSeeAdminIdentities = useMemo(
    () => permissions.isIdentityRegistryOwner || permissions.isTrustedIssuer,
    [permissions]
  );
  const canSeeCompliance =
    permissions.isComplianceOwner || permissions.isFactoryAdmin;
  const canSeeIssuance = permissions.isFactoryAdmin;
  const canSeeKycProvider = permissions.canKycProvider;
  const canSeeAdminTab =
    permissions.isTokenOwner ||
    permissions.isTokenIssuer ||
    permissions.isTokenController ||
    permissions.isTokenAgent ||
    permissions.isComplianceOwner ||
    permissions.isClaimTopicsOwner ||
    permissions.isFactoryAdmin;

  return {
    permissions,
    loading,
    error,
    canSeeAdminIdentities,
    canSeeCompliance,
    canSeeIssuance,
    canSeeKycProvider,
    canSeeAdminTab,
  };
}
