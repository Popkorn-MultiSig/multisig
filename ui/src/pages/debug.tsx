// ContractDebugger.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAccount, PublicKey } from 'o1js';
import { Popkorn } from '../../../contracts/build/src/Popkorn';

interface ContractState {
  isInitialized: boolean;
  signersMapRoot: string;
  signersCount: string;
  signedAmount: string;
  threshold: string;
  nonce: string;
  pendingTransactionHash: string;
}

export function ContractDebugger({ zkAppAddress }: { zkAppAddress: string }) {
  const [state, setState] = useState<ContractState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkContractState = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const zkApp = new Popkorn(PublicKey.fromBase58(zkAppAddress));
      
      // Fetch all state values
      const state = {
        isInitialized: (await zkApp.isInitialized.get()).toBoolean(),
        signersMapRoot: (await zkApp.signersMapRoot.get()).toString(),
        signersCount: (await zkApp.signersCount.get()).toString(),
        signedAmount: (await zkApp.signedAmount.get()).toString(),
        threshold: (await zkApp.threshold.get()).toString(),
        nonce: (await zkApp.nonce.get()).toString(),
        pendingTransactionHash: (await zkApp.pendingTransactionHash.get()).toString()
      };

      setState(state);
      console.log('Contract State:', state);

    } catch (err) {
      console.error('Failed to fetch state:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [zkAppAddress]);

  useEffect(() => {
    checkContractState();
    const interval = setInterval(checkContractState, 30000);
    return () => clearInterval(interval);
  }, [checkContractState]);

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Contract State</h2>
        <button 
          onClick={checkContractState}
          className="px-3 py-1 bg-blue-500 text-white rounded"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      {state && (
        <div className="bg-white shadow rounded p-4 space-y-2">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(state).map(([key, value]) => (
              <div key={key} className="border p-2 rounded">
                <div className="font-medium text-gray-500">{key}</div>
                <div className="font-mono break-all">{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        Auto-refreshes every 30 seconds
      </div>
    </div>
  );
}
