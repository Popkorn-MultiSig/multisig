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
        }
      } catch (error) {
        console.error("Failed to get accounts:", error);
        setAccount(null);
        setIsConnected(false);
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

  const requestNetwork = useCallback(async () => {
    if (typeof window.mina !== 'undefined') {
      try {
        const networkInfo = await window.mina.requestNetwork();
        setNetwork(networkInfo.networkId);
      } catch (error) {
        console.error("Failed to get network:", error);
      }
    }
  }, []);

  useEffect(() => {
    checkConnection();
    requestNetwork();

    if (window.mina) {
      window.mina.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        } else {
          setAccount(null);
          setIsConnected(false);
        }
      });

      window.mina.on("chainChanged", (chainInfo: { networkId: string }) => {
        setNetwork(chainInfo.networkId);
      });
    }

    return () => {
      if (window.mina) {
        window.mina.removeAllListeners("accountsChanged");
        window.mina.removeAllListeners("chainChanged");
      }
    };
  }, [checkConnection, requestNetwork]);

  return { account, isConnected, network, connectWallet, checkConnection };
};