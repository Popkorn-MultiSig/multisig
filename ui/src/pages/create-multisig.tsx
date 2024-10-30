import { useState, useEffect, useCallback } from 'react';
import { PublicKey, UInt64, Field, MerkleMap } from 'o1js';
import { useMinaWallet } from '../hooks/useMinaWallet';
import { usePopkornContract } from '../hooks/usePopkorn';
import { AccountUpdateDescr } from '../../../contracts/build/src/Popkorn';
import MerkleRootComponent from './MerkleRootComponent';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ContractDebugger } from './debug';
import ZkappWorkerClient from './zkappWorkerClient';

const ZKAPP_ADDRESS = 'B62qnsHGVW6dMndUfuHgjhimuPoS15hma2rhhJDrP3VxsE3hQjobeED';

export default function CreateMultisig() {
  const [zkappWorkerClient, setZkappWorkerClient] = useState<null | ZkappWorkerClient>(null);
  const { account, isConnected, connectWallet } = useMinaWallet();
  const { 
    isLoading, 
    error: contractError, 
    setupMultisig,
    getContractState,
    DEPLOYMENT_FEE,
    TRANSACTION_FEE
  } = usePopkornContract(ZKAPP_ADDRESS);

  const [signersMapRoot, setSignersMapRoot] = useState('');
  const [signersCount, setSignersCount] = useState('');
  const [threshold, setThreshold] = useState('1');
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [o1jsLoaded, setO1jsLoaded] = useState(false);
  const [setupStep, setSetupStep] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize and check contract state
  useEffect(() => {
    (async () => {
      try {
        const { MerkleMap } = await import('o1js');
        setO1jsLoaded(true);

        if (isConnected) {
          const state = await getContractState();
          setIsInitialized(state.isInitialized.toBoolean());
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    })();
  }, [isConnected, getContractState]);

  // Handle wallet connection status
  useEffect(() => {
    if (isConnected) {
      setStatus('');
      setError(null);
    } else {
      setStatus('Please connect your wallet to continue.');
    }
  }, [isConnected]);

  // Handle contract errors
  useEffect(() => {
    if (contractError) {
      setError(contractError);
      setStatus('');
    }
  }, [contractError]);

  const handleSetupMultisig = useCallback(async () => {
    if (!isConnected) {
      setError('Please connect your wallet');
      return;
    }

    if (isInitialized) {
      setError('Contract is already initialized');
      return;
    }

    try {
      setError(null);
      setSetupStep(1);
      setStatus('Preparing transaction...');

      if (!signersMapRoot || !signersCount || !threshold) {
        throw new Error('Please fill in all required fields');
      }

      const count = parseInt(signersCount);
      const thresholdNum = parseInt(threshold);
      
      if (thresholdNum > count) {
        throw new Error('Threshold cannot be greater than the number of signers');
      }

      if (thresholdNum <= 0) {
        throw new Error('Threshold must be greater than 0');
      }

      setSetupStep(2);
      setStatus('Setting up multisig...');

      console.log('Setup params:', {
        root: signersMapRoot,
        count: signersCount,
        threshold: threshold
      });

      const hash = await setupMultisig(
        Field(signersMapRoot),
        UInt64.from(signersCount),
        UInt64.from(threshold)
      );

      setTxHash(hash);
      setSetupStep(3);
      setStatus(`Multisig setup successful! Transaction hash: ${hash}`);

      // Refresh contract state
      const newState = await getContractState();
      setIsInitialized(newState.isInitialized.toBoolean());

    } catch (err) {
      console.error('Setup error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setStatus('');
      setSetupStep(0);
    }
  }, [isConnected, isInitialized, signersMapRoot, signersCount, threshold, setupMultisig, getContractState]);

  const handleThresholdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const count = parseInt(signersCount || '0');
    if (parseInt(value) <= count) {
      setThreshold(value);
    }
  }, [signersCount]);

  if (!o1jsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="p-6">
            <Alert>
              <AlertTitle>Contract Already Initialized</AlertTitle>
              <AlertDescription>
                This multisig wallet has already been set up.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create Multisig Wallet</CardTitle>
            <CardDescription>
              Setup cost: {DEPLOYMENT_FEE + TRANSACTION_FEE} MINA ({DEPLOYMENT_FEE} MINA for deployment + {TRANSACTION_FEE} MINA fee)
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {setupStep > 0 && (
              <div className="mb-6">
                <Progress value={(setupStep / 3) * 100} className="mb-2" />
                <p className="text-sm text-gray-500">
                  {setupStep === 1 && 'Preparing transaction...'}
                  {setupStep === 2 && 'Creating multisig...'}
                  {setupStep === 3 && 'Setup complete!'}
                </p>
              </div>
            )}

            {!isConnected ? (
              <Button 
                onClick={connectWallet} 
                className="w-full"
                size="lg"
              >
                Connect Wallet
              </Button>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Multisig Configuration</h3>

                  <div className="space-y-6">
                    <MerkleRootComponent
                      setSignersMapRoot={setSignersMapRoot}
                      setSignersCount={setSignersCount}
                    />
                    
                    <div>
                      <label htmlFor="thresholdSlider" className="block text-sm font-medium text-gray-700">
                        Required Signatures: <strong>{threshold}</strong> / {signersCount || "0"}
                      </label>
                      <input
                        id="thresholdSlider"
                        type="range"
                        min="1"
                        max={signersCount || "1"}
                        value={threshold}
                        onChange={handleThresholdChange}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-2"
                        disabled={isLoading}
                      />
                    </div>

                    <Button 
                      onClick={handleSetupMultisig} 
                      className="w-full"
                      size="lg"
                      disabled={isLoading || !signersMapRoot || !signersCount || parseInt(threshold) > parseInt(signersCount)}
                    >
                      {isLoading ? 'Setting up...' : 'Create Multisig'}
                    </Button>
                  </div>
                </div>

                {status && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">{status}</p>
                    {txHash && (
                      <a 
                        href={`https://minascan.io/devnet/tx/${txHash}?type=zk-tx`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:text-blue-600 mt-2 inline-block"
                      >
                        View on MinaScan →
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
