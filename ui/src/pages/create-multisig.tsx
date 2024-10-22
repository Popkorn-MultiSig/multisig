import { useState, useEffect } from 'react';
import { PublicKey, UInt64, Field, MerkleMap, Int64, Signature, Poseidon } from 'o1js';
import { useMinaWallet } from '../hooks/useMinaWallet';
import { usePopkorn3Contract } from '../hooks/usePopkorn';
import { AccountUpdateDescr } from '../../../contracts/build/src/Popkorn3';
import MerkleRootComponent from './MerkleRootComponent';

declare const window: Window & { mina: any };

const ZKAPP_ADDRESS = 'B62qpE6LNNhE8rT7mQLq75APVKyjagzX4UBvKRs9NpmgoqJUrAWUP2n';

export default function Home() {
  const { account, isConnected, connectWallet, disconnectWallet } = useMinaWallet();
  const { 
    isLoading, 
    error, 
    setupMultisig, 
    addSigner, 
    removeSigner, 
    setThreshold: contractSetThreshold, 
    sign, 
    executeTransaction 
  } = usePopkorn3Contract(ZKAPP_ADDRESS);

  const [signersMapRoot, setSignersMapRoot] = useState('');
  const [signersCount, setSignersCount] = useState('');
  const [threshold, setThreshold] = useState('1');
  const [newSignerPubKey, setNewSignerPubKey] = useState('');
  const [removeSignerPubKey, setRemoveSignerPubKey] = useState('');
  const [newThreshold, setNewThreshold] = useState('');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [status, setStatus] = useState('');
  
  const [signersMap, setSignersMap] = useState<MerkleMap | null>(null);
  const [o1jsLoaded, setO1jsLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { MerkleMap } = await import('o1js');
      setO1jsLoaded(true);
      setSignersMap(new MerkleMap());
    })();
  }, []);

  useEffect(() => {
    if (isConnected) {
      setStatus('');
    } else {
      setStatus('Please connect your wallet to continue.');
    }
  }, [isConnected]);

  const handleSetupMultisig = async () => {
    console.log("signersCount", signersCount);
    if (!isConnected || !signersMap) {
      setStatus('Please connect your wallet and wait for initialization.');
      return;
    }
    try {
      setStatus('Setting up multisig...');
      const txHash = await setupMultisig(
        Field(signersMapRoot),
        UInt64.from(signersCount),
        UInt64.from(threshold)
      );
      setStatus(`Multisig setup successful! Transaction hash: ${txHash}`);
    } catch (err) {
      setStatus(`Failed to setup multisig: ${(err as Error).message}`);
    }
  };

  const handleAddSigner = async () => {
    if (!isConnected || !signersMap) {
      setStatus('Please connect your wallet and wait for initialization.');
      return;
    }
    try {
      setStatus('Adding signer...');
      const signerPubKey = PublicKey.fromBase58(newSignerPubKey);
      const witness = signersMap.getWitness(signerPubKey.toFields()[0]);
      const txHash = await addSigner(signerPubKey, witness);
      signersMap.set(signerPubKey.toFields()[0], Field(1));
      setStatus(`Signer added successfully! Transaction hash: ${txHash}`);
      setNewSignerPubKey('');
    } catch (err) {
      setStatus(`Failed to add signer: ${(err as Error).message}`);
    }
  };

  const handleRemoveSigner = async () => {
    if (!isConnected || !signersMap) {
      setStatus('Please connect your wallet and wait for initialization.');
      return;
    }
    try {
      setStatus('Removing signer...');
      const signerPubKey = PublicKey.fromBase58(removeSignerPubKey);
      const witness = signersMap.getWitness(signerPubKey.toFields()[0]);
      const txHash = await removeSigner(signerPubKey, witness);
      signersMap.set(signerPubKey.toFields()[0], Field(0));
      setStatus(`Signer removed successfully! Transaction hash: ${txHash}`);
      setRemoveSignerPubKey('');
    } catch (err) {
      setStatus(`Failed to remove signer: ${(err as Error).message}`);
    }
  };

  const handleSetThreshold = async () => {
    if (!isConnected) {
      setStatus('Please connect your wallet first.');
      return;
    }
    try {
      setStatus('Setting new threshold...');
      const txHash = await contractSetThreshold(UInt64.from(threshold));
      setStatus(`Threshold updated successfully! Transaction hash: ${txHash}`);
    } catch (err) {
      setStatus(`Failed to set threshold: ${(err as Error).message}`);
    }
  };

  const handleSign = async () => {
    if (!isConnected || !signersMap || !account) {
      setStatus('Please connect your wallet and wait for initialization.');
      return;
    }
    try {
      setStatus('Signing transaction...');
      const accountUpdateDescr = new AccountUpdateDescr({ balanceChange: Int64.from(transactionAmount) });
      
      const messageToSign = Poseidon.hash(
        accountUpdateDescr.balanceChange.toFields()
      ).toString();
  
      const signature = await window.mina.signMessage({
        message: messageToSign,
      });
  
      const o1jsSignature = Signature.fromJSON(signature);
  
      const signerPubKey = PublicKey.fromBase58(account);
      const witness = signersMap.getWitness(signerPubKey.toFields()[0]);
      
      const txHash = await sign(accountUpdateDescr, o1jsSignature, signerPubKey, witness);
      setStatus(`Transaction signed successfully! Transaction hash: ${txHash}`);
    } catch (err) {
      setStatus(`Failed to sign transaction: ${(err as Error).message}`);
    }
  };

  const handleExecuteTransaction = async () => {
    if (!isConnected) {
      setStatus('Please connect your wallet first.');
      return;
    }
    try {
      setStatus('Executing transaction...');
      const accountUpdateDescr = new AccountUpdateDescr({ balanceChange: Int64.from(transactionAmount) });
      const txHash = await executeTransaction(accountUpdateDescr);
      setStatus(`Transaction executed successfully! Transaction hash: ${txHash}`);
      setTransactionAmount('');
    } catch (err) {
      setStatus(`Failed to execute transaction: ${(err as Error).message}`);
    }
  };

  if (!o1jsLoaded) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <h1 className="text-2xl font-semibold mb-5">Create Multisig Wallet</h1>
          
          {!isConnected ? (
            <button onClick={connectWallet} className="w-full bg-blue-500 text-white px-4 py-2 rounded">
              Connect Wallet
            </button>
          ) : (
            <>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Setup Multisig</h2>

              <div className="space-y-4">
                <MerkleRootComponent
                  setSignersMapRoot={setSignersMapRoot}
                  setSignersCount={setSignersCount}
                />
                  <label htmlFor="thresholdSlider" className="block text-sm font-medium text-gray-700">
                    Threshold: <strong>{threshold}</strong> / {signersCount ? signersCount : "0"}
                  </label>
                  <input
                    id="thresholdSlider"
                    type="range"
                    min="1"
                    max={signersCount || "1"}
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                  />
                  <button onClick={handleSetupMultisig} className="w-full bg-green-500 text-white px-4 py-2 rounded mt-2">
                    Setup Multisig
                  </button>
                </div>
              </div>

              {isLoading && <p className="mt-4 text-center">Loading...</p>}
              {error && <p className="mt-4 text-center text-red-500">Error: {error}</p>}
              <p className="mt-4 text-center font-semibold">{status}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
