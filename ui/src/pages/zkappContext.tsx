import { createContext, useContext, useEffect, useState } from 'react';
import ZkappWorkerClient from './zkappWorkerClient';

interface ZkappContextType {
  zkappWorkerClient: ZkappWorkerClient | null;
  hasWallet: boolean | null;
  hasBeenSetup: boolean;
  accountExists: boolean;
  publicKey: string;
  isLoading: boolean;
  error: string | null;
}

const ZkappContext = createContext<ZkappContextType>({
  zkappWorkerClient: null,
  hasWallet: null,
  hasBeenSetup: false,
  accountExists: false,
  publicKey: '',
  isLoading: true,
  error: null,
});

export function ZkappProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ZkappContextType>({
    zkappWorkerClient: null,
    hasWallet: null,
    hasBeenSetup: false,
    accountExists: false,
    publicKey: '',
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    async function initialize() {
      try {
        const zkappWorkerClient = new ZkappWorkerClient();
        await zkappWorkerClient.setActiveInstanceToDevnet();

        const mina = (window as any).mina;
        if (!mina) {
          setState(s => ({ ...s, hasWallet: false, isLoading: false }));
          return;
        }

        const publicKey = (await mina.requestAccounts())[0];
        const accountExists = (await zkappWorkerClient.fetchAccount(publicKey)).error === null;

        await zkappWorkerClient.loadContract();
        await zkappWorkerClient.compileContract();

        setState({
          zkappWorkerClient,
          hasWallet: true,
          hasBeenSetup: true,
          accountExists,
          publicKey,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState(s => ({ 
          ...s, 
          isLoading: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }));
      }
    }

    initialize();
  }, []);

  return (
    <ZkappContext.Provider value={state}>
      {children}
    </ZkappContext.Provider>
  );
}

export function useZkapp() {
  return useContext(ZkappContext);
} 