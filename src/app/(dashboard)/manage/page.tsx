"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/hooks/use-wallet";
import { useAssets } from "@/hooks/use-asets";
import { useTokenBalance } from "@/hooks/use-factory-assets";
import { TokenSelector } from "@/components/rwa/token-selector";
import { TokenTransfer } from "@/components/trex/token-transfer";
import { IdentityManager } from "@/components/trex/identity-manager";
import { IdentityRegistryAdmin } from "@/components/trex/identity-registry-admin";
import { AdminPanel } from "@/components/trex/admin-panel";
import { BatchKYCOps } from "@/components/trex/batch-kyc-ops";
import { IssuanceRedemptionManager } from "@/components/trex/issuance-redemption-manager";
import { ComplianceRulesManager } from "@/components/trex/compliance-rules-manager";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePermissions } from "@/hooks/use-permissions";

function ManagePageContent() {
  const searchParams = useSearchParams();
  const { isConnected, connectKeplr, address, trexClient } = useWallet();
  const {
    assets,
    loading: assetsLoading,
    error,
    loadAssets: refreshAssets,
  } = useAssets({ trexClient, walletAddress: address });

  // Multi-token state
  const [selectedTokenContract, setSelectedTokenContract] = useState<
    string | null
  >(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>("");
  const [selectedDecimals, setSelectedDecimals] = useState<number>(6);
  const { permissions, canSeeAdminTab } = usePermissions({
    trexClient,
    walletAddress: address,
    tokenContract: selectedTokenContract,
  });

  // Identity state
  const [userIdentity, setUserIdentity] = useState<any>(null);
  const [loadingIdentity, setLoadingIdentity] = useState(false);

  // Get balance for selected token
  const { balance: tokenBalance, isLoading: balanceLoading } = useTokenBalance(
    trexClient,
    selectedTokenContract,
    address
  );

  // Load assets on mount
  useEffect(() => {
    refreshAssets();
  }, [refreshAssets]);

  // Auto-select token from URL parameters
  useEffect(() => {
    const assetId = searchParams.get("asset");
    const symbol = searchParams.get("symbol");

    console.log("Auto-select check:", {
      assetId,
      symbol,
      assetsCount: assets.length,
      selectedTokenContract,
    });

    if (assetId && symbol && assets.length > 0 && !selectedTokenContract) {
      const asset = assets.find((a) => a.id === assetId || a.symbol === symbol);
      console.log("Found asset:", asset);
      if (asset) {
        console.log("Setting token:", asset.tokenContractAddress);
        setSelectedTokenContract(asset.tokenContractAddress);
        setSelectedAssetId(asset.id);
        setSelectedSymbol(asset.symbol);
        setSelectedDecimals(6); // Default decimals
      } else {
        console.log("Asset not found in list");
      }
    }
  }, [searchParams, assets, selectedTokenContract]);

  // Load user identity
  useEffect(() => {
    const loadUserIdentity = async () => {
      if (!trexClient || !address) return;

      setLoadingIdentity(true);
      try {
        const identity = await trexClient.getUserIdentity(address);
        setUserIdentity(identity);
      } catch (err) {
        console.log("No identity found for user");
        setUserIdentity(null);
      } finally {
        setLoadingIdentity(false);
      }
    };

    loadUserIdentity();
  }, [trexClient, address]);

  const handleTokenSelect = (
    contract: string,
    assetId: string,
    symbol: string
  ) => {
    setSelectedTokenContract(contract);
    setSelectedAssetId(assetId);
    setSelectedSymbol(symbol);
  };

  // Refresh all data
  const refreshAll = () => {
    refreshAssets();
    // Reload identity
    if (trexClient && address) {
      trexClient
        .getUserIdentity(address)
        .then(setUserIdentity)
        .catch(() => setUserIdentity(null));
    }
  };

  const isLoading = assetsLoading || balanceLoading || loadingIdentity;

  if (!isConnected) {
    return (
      <div className="py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <h1 className="text-3xl font-bold">TREX Token Management</h1>
          <p className="text-muted-foreground">
            Please connect your wallet to access token management features
          </p>
          <Button size="lg" onClick={connectKeplr}>
            Connect Keplr Wallet
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8 glass-panel rounded-[22px]">
      {/* Header */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mt-4">Token Management</h1>
        <p className="text-sm text-gray-600">
          Transfer tokens, manage identity, and admin controls
        </p>
      </div>

      {/* Selected Token Info Card */}
      {selectedTokenContract ? (
        <Card className="bg-white rounded-2xl mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">
                  Selected Token: {selectedSymbol}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  All operations will apply to this token only.
                </p>

                <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-gray-50">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Token Symbol</p>
                    <p className="font-mono font-semibold text-gray-900">
                      {selectedSymbol}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Your Balance</p>
                    <p className="font-semibold text-gray-900">
                      {isLoading
                        ? "..."
                        : (parseInt(tokenBalance) / 1000000).toFixed(2)}{" "}
                      {selectedSymbol}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-1">
                      Contract Address
                    </p>
                    <p className="font-mono text-xs text-gray-700 break-all">
                      {selectedTokenContract}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50">
          <AlertDescription className="text-yellow-800">
            <p className="font-semibold mb-2">No token selected</p>
            <p className="text-sm">
              Please navigate from an asset page to manage a specific token.
            </p>
            <div className="mt-3 text-xs space-y-1 opacity-70">
              <p>Debug Info:</p>
              <p>• URL Asset ID: {searchParams.get("asset") || "none"}</p>
              <p>• URL Symbol: {searchParams.get("symbol") || "none"}</p>
              <p>• Assets Loaded: {assets.length}</p>
              <p>• Loading: {assetsLoading ? "yes" : "no"}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-100 w-full rounded-2xl" />
          <Skeleton className="h-100 w-full rounded-2xl" />
        </div>
      ) : (
        <Tabs defaultValue="transfer" className="w-full">
          <TabsList
            className={`grid w-fit p-1 rounded-xl ${
              canSeeAdminTab ? "grid-cols-3" : "grid-cols-2"
            }`}
          >
            <TabsTrigger
              value="transfer"
              className="rounded-lg data-[state=active]:bg-gradient-to-tr data-[state=active]:from-[#172E7F] data-[state=active]:to-[#2A5FA6] data-[state=active]:text-white transition-all py-1.5 text-sm"
            >
              Transfer
            </TabsTrigger>
            <TabsTrigger
              value="identity"
              className="rounded-lg data-[state=active]:bg-gradient-to-tr data-[state=active]:from-[#172E7F] data-[state=active]:to-[#2A5FA6] data-[state=active]:text-white transition-all py-1.5 text-sm"
            >
              Identity
            </TabsTrigger>
            {canSeeAdminTab && (
              <TabsTrigger
                value="admin"
                className="rounded-lg data-[state=active]:bg-gradient-to-tr data-[state=active]:from-[#172E7F] data-[state=active]:to-[#2A5FA6] data-[state=active]:text-white transition-all py-1.5 text-sm"
              >
                Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* Transfer Tab */}
          <TabsContent value="transfer" className="mt-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TokenTransfer
                tokenContract={selectedTokenContract || undefined}
                tokenSymbol={selectedSymbol}
                tokenDecimals={selectedDecimals}
                userBalance={tokenBalance}
                userIdentity={userIdentity}
                onSuccess={refreshAll}
              />
            </motion.div>
          </TabsContent>

          {/* Identity Tab */}
          <TabsContent value="identity" className="mt-6">
            <div className="grid gap-4 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-1"
              >
                <IdentityManager
                  userIdentity={userIdentity}
                  onUpdate={refreshAll}
                />
              </motion.div>

              {permissions.isIdentityRegistryOwner && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="lg:col-span-1"
                >
                  <IdentityRegistryAdmin onUpdate={refreshAll} />
                </motion.div>
              )}
            </div>
          </TabsContent>

          {/* Admin Tab */}
          {canSeeAdminTab && (
            <TabsContent value="admin" className="mt-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-1"
                >
                  <AdminPanel
                    tokenContract={selectedTokenContract || undefined}
                    tokenSymbol={selectedSymbol}
                    tokenDecimals={selectedDecimals}
                    permissions={permissions}
                    onUpdate={refreshAll}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="lg:col-span-1"
                >
                  <IssuanceRedemptionManager
                    tokenContract={selectedTokenContract || ""}
                    permissions={permissions}
                    onUpdate={refreshAll}
                  />
                </motion.div>

                {(permissions.isTokenOwner || permissions.isTokenAgent) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-1"
                  >
                    <BatchKYCOps
                      tokenContract={selectedTokenContract || undefined}
                      onUpdate={refreshAll}
                    />
                  </motion.div>
                )}

                {permissions.isComplianceOwner && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-1"
                  >
                    <ComplianceRulesManager onUpdate={refreshAll} />
                  </motion.div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      )}

      {/* Info Footer */}
      <div className="mt-6 p-4 rounded-2xl bg-white text-sm text-gray-600">
        <p className="font-medium mb-2 text-gray-900">Important Information:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>
            All transfers require both sender and recipient to have verified
            identities
          </li>
          <li>
            Identity verification requires KYC and AML claims from trusted
            issuers
          </li>
          <li>
            Admin functions (mint, freeze, pause) are restricted to the token
            owner
          </li>
          <li>OnChainID contracts store your identity claims on-chain</li>
        </ul>
      </div>
    </div>
  );
}

export default function ManagePage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 glass-panel rounded-[22px]">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ManagePageContent />
    </Suspense>
  );
}
