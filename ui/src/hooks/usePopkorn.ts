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
import { Popkorn3, AccountUpdateDescr } from '../../../contracts/build/src/Popkorn3';

declare const window: Window & { mina: any };



export const usePopkorn3Contract = (zkAppAddress: string) => {
  const [zkApp, setZkApp] = useState<Popkorn3 | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const Devnet = Mina.Network('https://proxy.devnet.minaexplorer.com/graphql');
        Mina.setActiveInstance(Devnet);
        console.log('Network set to Devnet');
  
        console.log('Starting contract compilation...');
        await Popkorn3.compile();
        console.log('Contract compiled successfully');
  
        const zkAppPublicKey = PublicKey.fromBase58(zkAppAddress);
        console.log('Fetching account:', zkAppAddress);
        await fetchAccount({ publicKey: zkAppPublicKey });
        console.log('Account fetched successfully');
  
        const zkAppInstance = new Popkorn3(zkAppPublicKey);
        setZkApp(zkAppInstance);
        console.log('zkApp instance created');
      } catch (err) {
        setError('Failed to initialize contract: ' + (err as Error).message);
        console.error('Initialization error:', err);
      }
    })();
  }, [zkAppAddress]);

  useEffect(() => {
    (async () => {
      await fetchAccount({ publicKey: PublicKey.fromBase58(zkAppAddress) });
    })();
  }, [zkAppAddress]);

  const sendTransaction = useCallback(async (txFunction: () => Promise<void>) => {
    setIsLoading(true);
    setError(null);
    try {
      const tx = await Mina.transaction(() => txFunction());
      await tx.prove();
      
      // Use the wallet to sign the transaction
      const { hash } = await window.mina.sendTransaction({
        transaction: tx.toJSON(),
        feePayer: {
          fee: 0.1,
          memo: '',
        },
      });
      
      return hash;
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setupMultisig = useCallback(async (signersMapRoot: Field, signersCount: UInt64, threshold: UInt64) => {
    if (!zkApp) throw new Error('Contract not initialized');
    return sendTransaction(() => zkApp.setupMultisig(signersMapRoot, signersCount, threshold));
  }, [zkApp, sendTransaction]);

  const addSigner = useCallback(async (signerPubKey: PublicKey, witness: MerkleMapWitness) => {
    if (!zkApp) throw new Error('Contract not initialized');
    return sendTransaction(() => zkApp.addSigner(signerPubKey, witness));
  }, [zkApp, sendTransaction]);

  const removeSigner = useCallback(async (signerPubKey: PublicKey, witness: MerkleMapWitness) => {
    if (!zkApp) throw new Error('Contract not initialized');
    return sendTransaction(() => zkApp.removeSigner(signerPubKey, witness));
  }, [zkApp, sendTransaction]);

  const setThreshold = useCallback(async (newThreshold: UInt64) => {
    if (!zkApp) throw new Error('Contract not initialized');
    return sendTransaction(() => zkApp.setThreshold(newThreshold));
  }, [zkApp, sendTransaction]);

  const sign = useCallback(async (
    rootUpdate: AccountUpdateDescr,
    signature: Signature,
    signerPubKey: PublicKey,
    witness: MerkleMapWitness
  ) => {
    if (!zkApp) throw new Error('Contract not initialized');
    return sendTransaction(() => zkApp.sign(rootUpdate, signature, signerPubKey, witness));
  }, [zkApp, sendTransaction]);

  const executeTransaction = useCallback(async (rootUpdate: AccountUpdateDescr) => {
    if (!zkApp) throw new Error('Contract not initialized');
    return sendTransaction(() => zkApp.executeTransaction(rootUpdate));
  }, [zkApp, sendTransaction]);

  return {
    isLoading,
    error,
    setupMultisig,
    addSigner,
    removeSigner,
    setThreshold,
    sign,
    executeTransaction,
  };
};