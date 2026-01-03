'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrexClient } from '@/lib/trex-client';
import { RWAAsset, IssuanceRequest } from '@/types/rwa';
import { toast } from 'sonner';

interface UseAssetsOptions {
  trexClient: TrexClient | null;
  walletAddress: string | null;
}

export function useAssets(options?: UseAssetsOptions) {
  const [assets, setAssets] = useState<RWAAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<RWAAsset | null>(null);

  const { trexClient, walletAddress } = options || {};

  // Load all assets from factory
  const loadAssets = useCallback(async () => {
    // Don't try to load if wallet isn't connected
    if (!trexClient || !walletAddress) {
      console.log('Skipping asset load - wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Query factory for all tokens
      const factoryTokens = await trexClient.getAllFactoryTokens();
      
      // Map to RWAAsset interface
      const loadedAssets: RWAAsset[] = factoryTokens.map((token) => {
        const metadata = token.metadata ? JSON.parse(token.metadata) : {};
        
        // Validate assetType to match RWAAsset union type
        const validAssetTypes = ['real-estate', 'commodity', 'equity', 'debt', 'art', 'intellectual-property'];
        const assetType = validAssetTypes.includes(metadata.type) 
          ? metadata.type 
          : 'real-estate';
        
        return {
          id: token.asset_id.toString(),
          name: metadata.name || token.name,
          symbol: token.symbol,
          description: token.description,
          assetType: assetType as 'real-estate' | 'commodity' | 'equity' | 'debt' | 'art' | 'intellectual-property',
          totalSupply: 0, // Will be fetched separately if needed
          tokenizedAmount: 0,
          tokenPrice: 1.0,
          tokenDenom: 'uzig',
          underlyingValue: metadata.underlyingValue || 0,
          currency: metadata.currency || 'USD',
          location: metadata.location || '',
          issuer: token.legal_owner,
          issuerAddress: token.legal_owner,
          complianceStatus: 'compliant' as const,
          kycRequired: true,
          amlRequired: true,
          accreditedInvestorsOnly: false,
          issuanceDate: new Date(token.deployed_at * 1000),
          lastUpdated: new Date(token.deployed_at * 1000),
          documents: [],
          contractAddress: token.contract_address,
          tokenContractAddress: token.contract_address,
          chainId: 'zig-test-2',
        };
      });
      
      setAssets(loadedAssets);
      
      // Update localStorage cache for performance (optional)
      const cacheKey = `assets_${walletAddress}`;
      const assetIds = factoryTokens.map((a) => a.asset_id);
      localStorage.setItem(cacheKey, JSON.stringify(assetIds));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
    } catch (err: any) {
      setError(err.message);
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  }, [trexClient, walletAddress]);

  // Load single asset
  const loadAsset = useCallback(async (assetId: string) => {
    if (!trexClient || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);
    
    try {
      // TODO: Implement getAsset in TrexClient
      // const asset = await trexClient.getAsset(assetId);
      // setSelectedAsset(asset);
      // return asset;
      throw new Error('Not implemented yet');
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load asset');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trexClient, walletAddress]);

  // Issue new asset via factory
  const issueAsset = useCallback(async (request: IssuanceRequest) => {
    if (!trexClient || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    setError(null);
    
    const loadingToast = toast.loading('Creating asset token via factory...');
    
    try {
      const factoryConfig = await trexClient.getFactoryConfig();
      const normalizedWallet = walletAddress.toLowerCase();
      if (factoryConfig.admin.toLowerCase() !== normalizedWallet) {
        throw new Error('Only the factory admin wallet can create new tokens.');
      }

      // Create asset token via factory - this creates a new CW3643 token contract
      const { assetDetails } = request;
      const legalOwner = assetDetails.legalOwner || walletAddress;
      const desiredOwner = request.tokenDetails.owner || walletAddress;
      const desiredIssuer = request.tokenDetails.issuer || walletAddress;
      const desiredController = request.tokenDetails.controller || walletAddress;
      const needsRoleUpdate =
        factoryConfig.default_owner !== desiredOwner ||
        factoryConfig.default_issuer !== desiredIssuer ||
        factoryConfig.default_controller !== desiredController;

      if (needsRoleUpdate) {
        toast.loading('Updating factory defaults...', { id: loadingToast });
        await trexClient.updateFactoryConfig({
          default_owner: desiredOwner,
          default_issuer: desiredIssuer,
          default_controller: desiredController,
        });
      }

      const result = await trexClient.createAssetToken({
        referenceId: assetDetails.symbol,
        description: assetDetails.description,
        legalOwner,
        name: assetDetails.name,
        type: assetDetails.assetType,
        location: assetDetails.location,
        underlyingValue: assetDetails.underlyingValue,
        currency: assetDetails.currency,
      });

      toast.success(
        `Asset token created! Asset ID: ${result.assetId}, Contract: ${result.tokenContract.slice(0, 10)}...`,
        { id: loadingToast }
      );

      // Wait for blockchain state to propagate
      toast.loading('Syncing blockchain state...', { id: loadingToast });
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Reload assets to show the new one
      await loadAssets();
      
      toast.success('Asset fully synchronized!', { id: loadingToast });
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to create asset token: ${err.message}`, { id: loadingToast });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trexClient, walletAddress, loadAssets]);

  // Update compliance status
  const updateCompliance = useCallback(async (assetId: string, status: string, requirements: Record<string, any>) => {
    if (!trexClient || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    
    try {
      // TODO: Implement in TrexClient
      toast.info('Compliance update not yet implemented');
      throw new Error('Not implemented yet');
    } catch (err: any) {
      toast.error('Failed to update compliance');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trexClient, walletAddress]);

  // Mint tokens
  const mintTokens = useCallback(async (assetId: string, recipient: string, amount: number) => {
    if (!trexClient || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    const loadingToast = toast.loading('Minting tokens...');
    
    try {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) {
        throw new Error('Asset not found');
      }

      const txHash = await trexClient.mint(
        recipient,
        amount.toString(),
        asset.tokenContractAddress
      );
      toast.success(`Tokens minted! TX: ${txHash.slice(0, 10)}...`, { id: loadingToast });
      await loadAssets();
    } catch (err: any) {
      toast.error(`Failed to mint tokens: ${err.message}`, { id: loadingToast });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trexClient, walletAddress, loadAssets]);

  // Transfer tokens from specific token contract
  const transferTokens = useCallback(async (assetId: string, recipient: string, amount: number) => {
    if (!trexClient || !walletAddress) {
      throw new Error('Wallet not connected');
    }

    setLoading(true);
    const loadingToast = toast.loading('Transferring tokens...');
    
    try {
      // Find the asset to get its token contract
      const asset = assets.find(a => a.id === assetId);
      if (!asset) {
        throw new Error('Asset not found');
      }

      const txHash = await trexClient.transferFromToken(
        asset.tokenContractAddress,
        recipient,
        amount.toString()
      );
      toast.success(`Tokens transferred! TX: ${txHash.slice(0, 10)}...`, { id: loadingToast });
      await loadAssets();
    } catch (err: any) {
      toast.error(`Failed to transfer tokens: ${err.message}`, { id: loadingToast });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [trexClient, walletAddress, assets, loadAssets]);

  // Get token balance for specific asset
  const getBalance = useCallback(async (assetId: string, address: string) => {
    if (!trexClient) {
      return 0;
    }

    try {
      // Find the asset to get its token contract
      const asset = assets.find(a => a.id === assetId);
      if (!asset) {
        return 0;
      }

      const balance = await trexClient.getBalanceForToken(asset.tokenContractAddress, address);
      return parseInt(balance) || 0;
    } catch (err: any) {
      console.error('Failed to get balance:', err);
      return 0;
    }
  }, [trexClient]);

  // Clear assets when wallet disconnects
  useEffect(() => {
    if (!trexClient || !walletAddress) {
      setAssets([]);
      setSelectedAsset(null);
      setError(null);
      setLoading(false);
    } else {
      // Auto-load assets when wallet connects
      loadAssets();
    }
  }, [trexClient, walletAddress, loadAssets]);

  // Manually add an asset ID to the cache (for recovery of old assets)
  const addAssetToCache = useCallback((assetId: number) => {
    if (!walletAddress) {
      toast.error('Wallet not connected');
      return;
    }

    const cacheKey = `assets_${walletAddress}`;
    const cached = localStorage.getItem(cacheKey);
    const assetIds: number[] = cached ? JSON.parse(cached) : [];
    
    if (!assetIds.includes(assetId)) {
      assetIds.push(assetId);
      localStorage.setItem(cacheKey, JSON.stringify(assetIds));
      toast.success(`Asset ID ${assetId} added to cache`);
      loadAssets(); // Reload to show the asset
    } else {
      toast.info(`Asset ID ${assetId} already in cache`);
    }
  }, [walletAddress, loadAssets]);

  return {
    assets,
    selectedAsset,
    loading,
    error,
    loadAssets,
    loadAsset,
    issueAsset,
    updateCompliance,
    mintTokens,
    transferTokens,
    getBalance,
    setSelectedAsset,
    addAssetToCache, // NEW: For recovering old assets
  };
}
