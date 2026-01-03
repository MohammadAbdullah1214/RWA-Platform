'use client';

import { useCallback, useEffect } from 'react';
import { TrexClient } from '@/lib/trex-client';
import { getZigChainConfig } from '@/lib/zigchain-config';
import { toast } from 'sonner';
import { useAppContext } from '@/contexts/app-context';

// Extend Window interface for Keplr
declare global {
  interface Window {
    keplr?: any;
    leap?: any;
    getOfflineSigner?: any;
  }
}

export function useWallet() {
  const {
    address,
    balance,
    trexClient,
    isConnected,
    isConnecting,
    setWalletState,
    setIsConnecting,
    clearWalletState,
  } = useAppContext();

  /**
   * Connect to Keplr wallet
   */
  const connectKeplr = useCallback(async () => {
    if (!window.keplr) {
      toast.error('Keplr wallet not found. Please install Keplr extension.');
      window.open('https://www.keplr.app/', '_blank');
      return;
    }

    try {
      setIsConnecting(true);
      const config = getZigChainConfig();

      // Suggest chain to Keplr (in case it's not added)
      try {
        await window.keplr.experimentalSuggestChain({
          chainId: config.chainId,
          chainName: config.chainId.includes('test') ? 'ZigChain Testnet' : 'ZigChain',
          rpc: config.rpcEndpoint,
          rest: config.restEndpoint || config.rpcEndpoint,
          bip44: {
            coinType: 118,
          },
          bech32Config: {
            bech32PrefixAccAddr: config.prefix,
            bech32PrefixAccPub: `${config.prefix}pub`,
            bech32PrefixValAddr: `${config.prefix}valoper`,
            bech32PrefixValPub: `${config.prefix}valoperpub`,
            bech32PrefixConsAddr: `${config.prefix}valcons`,
            bech32PrefixConsPub: `${config.prefix}valconspub`,
          },
          currencies: [
            {
              coinDenom: config.tokenSymbol,
              coinMinimalDenom: config.tokenDenom,
              coinDecimals: 6,
            },
          ],
          feeCurrencies: [
            {
              coinDenom: config.tokenSymbol,
              coinMinimalDenom: config.tokenDenom,
              coinDecimals: 6,
              gasPriceStep: {
                low: 0.01,
                average: 0.025,
                high: 0.04,
              },
            },
          ],
          stakeCurrency: {
            coinDenom: config.tokenSymbol,
            coinMinimalDenom: config.tokenDenom,
            coinDecimals: 6,
          },
        });
      } catch (suggestError) {
        // Chain might already be added, continue
        console.log('Chain already configured or user rejected');
      }

      // Enable Keplr for this chain
      await window.keplr.enable(config.chainId);

      // Get offline signer
      const offlineSigner = window.keplr.getOfflineSigner(config.chainId);
      const accounts = await offlineSigner.getAccounts();

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const walletAddress = accounts[0].address;

      // Create TREX client with signer
      const client = await TrexClient.connectWithSigner(offlineSigner, walletAddress);

      // Fetch native ZIG balance (for gas)
      let nativeBal = '0';
      try {
        nativeBal = await client.getNativeBalance(walletAddress);
      } catch (balError) {
        console.error('Failed to fetch native balance:', balError);
      }

      // Update global state with NATIVE ZIG balance
      setWalletState(walletAddress, client, nativeBal);

      // Save to localStorage
      localStorage.setItem('walletAddress', walletAddress);
      localStorage.setItem('walletType', 'keplr');

      toast.success(`Connected to ${walletAddress.slice(0, 10)}...${walletAddress.slice(-6)}`);

      // Listen for account changes
      window.addEventListener('keplr_keystorechange', handleAccountChange);
    } catch (error: any) {
      console.error('Failed to connect to Keplr:', error);
      toast.error(error.message || 'Failed to connect wallet');
      setIsConnecting(false);
    }
  }, []);

  /**
   * Connect to Leap wallet (alternative)
   */
  const connectLeap = useCallback(async () => {
    if (!window.leap) {
      toast.error('Leap wallet not found. Please install Leap extension.');
      window.open('https://www.leapwallet.io/', '_blank');
      return;
    }

    try {
      setIsConnecting(true);
      const config = getZigChainConfig();

      await window.leap.enable(config.chainId);
      const offlineSigner = window.leap.getOfflineSigner(config.chainId);
      const accounts = await offlineSigner.getAccounts();

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const walletAddress = accounts[0].address;

      const client = await TrexClient.connectWithSigner(offlineSigner, walletAddress);

      // Fetch native ZIG balance (for gas)
      let nativeBal = '0';
      try {
        nativeBal = await client.getNativeBalance(walletAddress);
      } catch (balError) {
        console.error('Failed to fetch native balance:', balError);
      }

      // Update global state with NATIVE ZIG balance
      setWalletState(walletAddress, client, nativeBal);

      localStorage.setItem('walletAddress', walletAddress);
      localStorage.setItem('walletType', 'leap');

      toast.success(`Connected to ${walletAddress.slice(0, 10)}...${walletAddress.slice(-6)}`);
    } catch (error: any) {
      console.error('Failed to connect to Leap:', error);
      toast.error(error.message || 'Failed to connect wallet');
      setIsConnecting(false);
    }
  }, []);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    clearWalletState();
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletType');
    window.removeEventListener('keplr_keystorechange', handleAccountChange);
    toast.info('Wallet disconnected');
  }, [clearWalletState]);

  /**
   * Handle account change in Keplr
   */
  const handleAccountChange = useCallback(() => {
    toast.info('Account changed. Please reconnect.');
    disconnect();
  }, [disconnect]);

  /**
   * Refresh balance
   */
  const refreshBalance = useCallback(async () => {
    if (address && trexClient) {
      try {
        const nativeBal = await trexClient.getNativeBalance(address);
        setWalletState(address, trexClient, nativeBal);
      } catch (error) {
        console.error('Failed to refresh balance:', error);
      }
    }
  }, [address, trexClient, setWalletState]);

  /**
   * Auto-connect on mount if previously connected
   */
  useEffect(() => {
    // Only run if not already connected
    if (address) return;

    const savedAddress = localStorage.getItem('walletAddress');
    const walletType = localStorage.getItem('walletType');

    if (savedAddress && walletType) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        // Auto-reconnect
        if (walletType === 'keplr' && window.keplr) {
          connectKeplr();
        } else if (walletType === 'leap' && window.leap) {
          connectLeap();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []); // Empty deps - run only once on mount

  return {
    // State
    address,
    isConnecting,
    balance,
    trexClient,
    isConnected,

    // Actions
    connectKeplr,
    connectLeap,
    disconnect,
    refreshBalance,
  };
}