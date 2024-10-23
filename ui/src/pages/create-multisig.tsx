import { useState, useEffect } from 'react';
import { PublicKey, UInt64, Field, MerkleMap, Int64, Signature, Poseidon } from 'o1js';
import { useMinaWallet } from '../hooks/useMinaWallet';
import { usePopkorn3Contract } from '../hooks/usePopkorn';
import { AccountUpdateDescr } from '../../../contracts/build/src/Popkorn3';
import MerkleRootComponent from './MerkleRootComponent';

declare const window: Window & { mina: any };

const ZKAPP_ADDRESS = 'B62qnsHGVW6dMndUfuHgjhimuPoS15hma2rhhJDrP3VxsE3hQjobeED';

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
     if (!isConnected || !signersMap) {
      setStatus('Please connect your wallet and wait for initialization.');
      return;
    }
    try {
      setStatus('Setting up multisig...');
      console.log("signersMapRoot", signersMapRoot);
      console.log("signersCount", signersCount);
      console.log("threshold", threshold);  
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
