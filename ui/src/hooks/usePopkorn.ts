import { useState, useEffect, useCallback } from 'react';
import {
  Mina,
  PublicKey,
  UInt64,
  Field,
  MerkleMapWitness,
  Signature,
  Int64,
  fetchAccount,
} from 'o1js';
import { Popkorn, AccountUpdateDescr } from '../../../contracts/build/src/Popkorn';

declare const window: Window & { mina: any };

const DEPLOYMENT_FEE = 1; // 1 MINA
const TRANSACTION_FEE = 0.1; // 0.1 MINA

export const usePopkornContract = (zkAppAddress: string) => {
  const [zkApp, setZkApp] = useState<Popkorn | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeployed, setIsDeployed] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Check if contract is deployed
  const checkDeploymentStatus = useCallback(async () => {
    try {
      await fetchAccount({ publicKey: PublicKey.fromBase58(zkAppAddress) });
      const account = Mina.getAccount(PublicKey.fromBase58(zkAppAddress));
      return !!account;
    } catch {
      return false;
    }
  }, [zkAppAddress]);

  // Initialize contract
  useEffect(() => {
    (async () => {
      try {
        // Setup network
        const Devnet = Mina.Network('https://proxy.devnet.minaexplorer.com/graphql');
        Mina.setActiveInstance(Devnet);
        console.log('Network set to Devnet');

        // First compile
        console.log('Compiling contract...');
        await Popkorn.compile();
        console.log('Contract compiled');

        // Check deployment status
        const deployed = await checkDeploymentStatus();
        setIsDeployed(deployed);
        console.log('Contract deployed:', deployed);

        if (!deployed) {
          console.log('Contract not deployed to this address');
          return;
        }

        // Create instance
        const zkAppPublicKey = PublicKey.fromBase58(zkAppAddress);
        const zkAppInstance = new Popkorn(zkAppPublicKey);
        setZkApp(zkAppInstance);
        console.log('zkApp instance created');

        // Check initialization
        const state = await zkAppInstance.isInitialized.get();
        setIsInitialized(state.toBoolean());
        console.log('Contract initialized:', state.toBoolean());

      } catch (err) {
        console.error('Initialization error:', err);
        setError(`Contract initialization failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    })();
  }, [zkAppAddress, checkDeploymentStatus]);

  const refreshContractState = useCallback(async () => {
    if (!zkApp) return;
    try {
      await fetchAccount({ publicKey: PublicKey.fromBase58(zkAppAddress) });
      const state = await zkApp.isInitialized.get();
      setIsInitialized(state.toBoolean());
    } catch (err) {
      console.error('Failed to refresh state:', err);
    }
  }, [zkApp, zkAppAddress]);

  const sendTransaction = useCallback(async (
    txFunction: () => Promise<void>
  ): Promise<string> => {
    if (!zkApp) throw new Error('Contract not initialized');
    if (!isDeployed) throw new Error('Contract not deployed');

    setIsLoading(true);
    setError(null);
    
    try {
      // Verify wallet connection
      const accounts = await window.mina.requestAccounts();
      if (!accounts || accounts.length === 0) {
        throw new Error('No wallet account found');
      }
      
      const senderPublicKey = PublicKey.fromBase58(accounts[0]);
      console.log('Sender:', senderPublicKey.toBase58());

      // Refresh account data
      await fetchAccount({ publicKey: PublicKey.fromBase58(zkAppAddress) });

      // Create transaction
      console.log('Creating transaction...');
      const tx = await Mina.transaction({
        sender: senderPublicKey,
        fee: TRANSACTION_FEE * 1e9,
        memo: 'Popkorn Multisig',
      }, async () => {
        try {
          await txFunction();
        } catch (err) {
          console.error('Transaction function error:', err);
          throw err;
        }
      });

      // Generate proof
      console.log('Generating proof...');
      try {
        await tx.prove();
        console.log('Proof generated');
      } catch (err) {
        console.error('Proof generation error:', err);
        throw new Error(`Proof generation failed: ${err instanceof Error ? err.message : String(err)}`);
      }

      // Send transaction
      console.log('Sending transaction...');
      const { hash } = await window.mina.sendTransaction({
        transaction: tx.toJSON(),
        feePayer: {
          fee: TRANSACTION_FEE,
          memo: 'Popkorn Multisig',
        },
      });

      console.log('Transaction sent:', hash);

      // Wait for confirmation and refresh state
      await new Promise(resolve => setTimeout(resolve, 3000));
      await refreshContractState();

      return hash;

    } catch (err: any) {
      console.error('Transaction error:', err);
      if (err.code === 1002) {
        throw new Error('Transaction rejected by user');
      }
      if (err.code === 1001) {
        throw new Error('Insufficient balance');
      }
      throw new Error(err.message || 'Transaction failed');
    } finally {
      setIsLoading(false);
    }
  }, [zkApp, zkAppAddress, isDeployed, refreshContractState]);

  const getContractState = useCallback(async () => {
    if (!zkApp) throw new Error('Contract not initialized');
    if (!isDeployed) throw new Error('Contract not deployed');
    
    try {
      await fetchAccount({ publicKey: PublicKey.fromBase58(zkAppAddress) });
      
      return {
        isInitialized: await zkApp.isInitialized.get(),
        signersMapRoot: await zkApp.signersMapRoot.get(),
        signersCount: await zkApp.signersCount.get(),
        signedAmount: await zkApp.signedAmount.get(),
        threshold: await zkApp.threshold.get(),
        nonce: await zkApp.nonce.get(),
        pendingTransactionHash: await zkApp.pendingTransactionHash.get(),
      };
    } catch (err) {
      console.error('Failed to fetch state:', err);
      throw err;
    }
  }, [zkApp, zkAppAddress, isDeployed]);

  const setupMultisig = useCallback(async (
    signersMapRoot: Field, 
    signersCount: UInt64,
    threshold: UInt64
  ) => {
    if (!zkApp) throw new Error('Contract not initialized');
    if (!isDeployed) throw new Error('Contract not deployed');
    if (isInitialized) throw new Error('Contract already initialized');
    
    try {
      // Verify inputs
      if (threshold.toBigInt() > signersCount.toBigInt()) {
        throw new Error('Threshold cannot be greater than signer count');
      }
      if (threshold.toBigInt() <= 0n) {
        throw new Error('Threshold must be greater than 0');
      }

      console.log('Setting up multisig with params:', {
        signersMapRoot: signersMapRoot.toString(),
        signersCount: signersCount.toString(),
        threshold: threshold.toString()
      });

      const hash = await sendTransaction(async () => {
        await zkApp.setupMultisig(signersMapRoot, signersCount, threshold);
      });

      return hash;
    } catch (err) {
      console.error('Setup failed:', err);
      throw err;
    }
  }, [zkApp, isDeployed, isInitialized, sendTransaction]);

  const addSigner = useCallback(async (
    signerPubKey: PublicKey,
    witness: MerkleMapWitness
  ) => {
    if (!zkApp || !isDeployed) throw new Error('Contract not initialized');
    return sendTransaction(async () => {
      await zkApp.addSigner(signerPubKey, witness);
    });
  }, [zkApp, isDeployed, sendTransaction]);

  const removeSigner = useCallback(async (
    signerPubKey: PublicKey,
    witness: MerkleMapWitness
  ) => {
    if (!zkApp || !isDeployed) throw new Error('Contract not initialized');
    return sendTransaction(async () => {
      await zkApp.removeSigner(signerPubKey, witness);
    });
  }, [zkApp, isDeployed, sendTransaction]);

  const setThreshold = useCallback(async (newThreshold: UInt64) => {
    if (!zkApp || !isDeployed) throw new Error('Contract not initialized');
    return sendTransaction(async () => {
      await zkApp.setThreshold(newThreshold);
    });
  }, [zkApp, isDeployed, sendTransaction]);

  const sign = useCallback(async (
    rootUpdate: AccountUpdateDescr,
    signature: Signature,
    signerPubKey: PublicKey,
    witness: MerkleMapWitness
  ) => {
    if (!zkApp || !isDeployed) throw new Error('Contract not initialized');
    return sendTransaction(async () => {
      await zkApp.sign(rootUpdate, signature, signerPubKey, witness);
    });
  }, [zkApp, isDeployed, sendTransaction]);

  const executeTransaction = useCallback(async (rootUpdate: AccountUpdateDescr) => {
    if (!zkApp || !isDeployed) throw new Error('Contract not initialized');
    return sendTransaction(async () => {
      await zkApp.executeTransaction(rootUpdate);
    });
  }, [zkApp, isDeployed, sendTransaction]);

  // Auto refresh state
  useEffect(() => {
    if (!zkApp || !isDeployed) return;
    
    const interval = setInterval(refreshContractState, 30000);
    return () => clearInterval(interval);
  }, [zkApp, isDeployed, refreshContractState]);

  return {
    isLoading,
    error,
    isDeployed,
    isInitialized,
    setupMultisig,
    addSigner,
    removeSigner,
    setThreshold,
    sign,
    executeTransaction,
    getContractState,
    DEPLOYMENT_FEE,
    TRANSACTION_FEE,
  };
};
