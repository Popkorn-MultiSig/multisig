import { useState, useEffect } from 'react';
import {
  Mina,
  PublicKey,
  PrivateKey,
  Field,
  UInt64,
  Signature,
  MerkleMap,
  Int64,
  Poseidon,
} from 'o1js';
import { Popkorn3 } from '../../../contracts/build/src/Popkorn3';
import { useMinaWallet } from './useMinaWallet';

export const usePopkorn = () => {
  const { account, isConnected } = useMinaWallet();
  const [contract, setContract] = useState<Popkorn3 | null>(null);
  const [signerMap, setSignerMap] = useState<MerkleMap | null>(null);

  useEffect(() => {
    const initializeContract = async () => {
      if (isConnected && account) {
        const Berkeley = Mina.Network(
          'https://proxy.berkeley.minaexplorer.com/graphql'
        );
        Mina.setActiveInstance(Berkeley);
        const contractAddress = PublicKey.fromBase58('YOUR_CONTRACT_ADDRESS');
        const zkApp = new Popkorn3(contractAddress);
        setContract(zkApp);

        // Initialize MerkleMap for signers
        const newSignerMap = new MerkleMap();
        setSignerMap(newSignerMap);
      }
    };

    initializeContract();
  }, [isConnected, account]);

  const setupMultisig = async (signersCount: number, threshold: number) => {
    if (!contract || !signerMap) return;

    const tx = await Mina.transaction(account!, () => {
      contract.setupMultisig(
        signerMap.getRoot(),
        UInt64.from(signersCount),
        UInt64.from(threshold)
      );
    });
    await tx.prove();
    await tx.sign().send();
  };

  const addSigner = async (signerPubKey: string) => {
    if (!contract || !signerMap) return;

    const publicKey = PublicKey.fromBase58(signerPubKey);
    const signerHash = Poseidon.hash(publicKey.toFields());
    const witness = signerMap.getWitness(signerHash);

    signerMap.set(signerHash, Field(1));

    const tx = await Mina.transaction(account!, () => {
      contract.addSigner(publicKey, witness);
    });
    await tx.prove();
    await tx.sign().send();
  };

  const removeSigner = async (signerPubKey: string) => {
    if (!contract || !signerMap) return;

    const publicKey = PublicKey.fromBase58(signerPubKey);
    const signerHash = Poseidon.hash(publicKey.toFields());
    const witness = signerMap.getWitness(signerHash);

    signerMap.set(signerHash, Field(0));

    const tx = await Mina.transaction(account!, () => {
      contract.removeSigner(publicKey, witness);
    });
    await tx.prove();
    await tx.sign().send();
  };

  const setThreshold = async (newThreshold: number) => {
    if (!contract) return;

    const tx = await Mina.transaction(account!, () => {
      contract.setThreshold(UInt64.from(newThreshold));
    });
    await tx.prove();
    await tx.sign().send();
  };

  const sign = async (balanceChange: number, privateKey: string) => {
    if (!contract || !signerMap) return;

    const signerPrivateKey = PrivateKey.fromBase58(privateKey);
    const signerPublicKey = signerPrivateKey.toPublicKey();
    const signerHash = Poseidon.hash(signerPublicKey.toFields());
    const witness = signerMap.getWitness(signerHash);

    const nonce = await contract.nonce.get();
    const signature = Signature.create(signerPrivateKey, [
      nonce,
      ...Int64.from(balanceChange).toFields(),
    ]);

    const rootUpdate = new AccountUpdateDescr({
      balanceChange: Int64.from(balanceChange),
    });

    const tx = await Mina.transaction(account!, () => {
      contract.sign(rootUpdate, signature, signerPublicKey, witness);
    });
    await tx.prove();
    await tx.sign().send();
  };

  const executeTransaction = async (balanceChange: number) => {
    if (!contract) return;

    const rootUpdate = new AccountUpdateDescr({
      balanceChange: Int64.from(balanceChange),
    });

    const tx = await Mina.transaction(account!, () => {
      contract.executeTransaction(rootUpdate);
    });
    await tx.prove();
    await tx.sign().send();
  };

  return {
    setupMultisig,
    addSigner,
    removeSigner,
    setThreshold,
    sign,
    executeTransaction,
  };
};