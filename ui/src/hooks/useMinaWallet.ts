import { useState, useEffect, useCallback } from 'react';

interface MinaWindow extends Window {
  mina?: any;
}

declare let window: MinaWindow;

export const useMinaWallet = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.mina !== 'undefined') {
        const accounts = await window.mina.getAccounts();
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
        }
      }
    };

    checkConnection();

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
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window.mina !== 'undefined') {
      try {
        const accounts = await window.mina.requestAccounts();
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setIsConnected(true);
          return accounts[0];
        }
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    } else {
      console.error("Auro Wallet is not installed");
    }
    return null;
  }, []);

  return { account, isConnected, connectWallet };
};