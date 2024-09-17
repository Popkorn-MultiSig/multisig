import { useState, useEffect, useCallback } from 'react';

interface MinaWindow extends Window {
  mina?: any;
}

declare let window: MinaWindow;

interface ProviderError extends Error {
  message: string;
  code: number;
  data?: unknown;
}

export const useMinaWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [network, setNetwork] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    if (typeof window.mina !== 'undefined') {
      try {
        const accounts = await window.mina.getAccounts();
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          setAccount(null);
          setIsConnected(false);
          setBalance(null);
        }
      } catch (error) {
        console.error("Failed to get accounts:", error);
        setAccount(null);
        setIsConnected(false);
        setBalance(null);
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window.mina !== 'undefined') {
      try {
        const accounts: string[] | ProviderError = await window.mina.requestAccounts()
          .catch((err: any) => err);
        if (Array.isArray(accounts) && accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          return accounts[0];
        } else if ((accounts as ProviderError).message) {
          console.error("Failed to connect wallet:", (accounts as ProviderError).message);
        }
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      console.error("Auro Wallet is not installed");
    }
    return null;
  }, []);

  const disconnectWallet = useCallback(async () => {
    setAccount(null);
    setIsConnected(false);
    setBalance(null);
    setNetwork(null);
    // TODO: Use disconnect method from the Mina wallet API
    // This is just clearing the local state
    return null;
  }, []);

  const requestNetwork = useCallback(async () => {
    if (typeof window.mina !== 'undefined') {
      try {
        const networkInfo = await window.mina.requestNetwork();
        setNetwork(networkInfo.networkID);
      } catch (error) {
        console.error("Failed to get network:", error);
      }
    }
  }, []);

  useEffect(() => {
    checkConnection();
    requestNetwork();
    
    if (window.mina) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          setAccount(null);
          setIsConnected(false);
          setBalance(null);
        }
      };

      const handleChainChanged = (chainInfo: { networkId: string }) => {
        setNetwork(chainInfo.networkId);
        requestNetwork();
      };

      window.mina.on("accountsChanged", handleAccountsChanged);
      window.mina.on("chainChanged", handleChainChanged);

      return () => {
        window.mina.removeListener("accountsChanged", handleAccountsChanged);
        window.mina.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [checkConnection, requestNetwork]);

  return { account, isConnected, network, balance, setBalance, connectWallet, disconnectWallet, checkConnection };
};