import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/MultiSig.module.css';
import { useMinaWallet } from '../hooks/useMinaWallet';

const predefinedAddresses = [
  'B62qnXy1f75qq8c6HS2Am88Gk6UyvTHK3iSYh4Hb3nD6DS2eS6wZ4or',
  'B62qjsV6WQwTeEWrNrRRBP6VaaLvQhwWTnFi4WP4LQjGvpfZEumXzxb',
  'B62qodtMG7Dwo7f6zWdzxWkG8ULtKZBFjbq9H6RTqMm4KhJVh1VPwrN',
  'B62qrYzMtqbdW3oRv6aX9G24L2ZqN6VnbDY8mJi8x3EWDbZw2bK6kDK',
  'B62qkRoGi7bbDJzFHpoSzQRqYSkjqUYiR8yM9c6aZpzKmke6zXxcS69',
];

const MultiSig: React.FC = () => {
  const { account, isConnected } = useMinaWallet();
  const [signers, setSigners] = useState<string[]>([]);
  const [threshold, setThreshold] = useState<number>(2);
  const [newSigner, setNewSigner] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [walletName, setWalletName] = useState<string>('');

  const addSigner = (address: string) => {
    if (!signers.includes(address)) {
      setSigners([...signers, address]);
    }
  };

  const removeSigner = (index: number) => {
    setSigners(signers.filter((_, i) => i !== index));
  };

  const createMultiSig = async () => {
    if (signers.length >= threshold && walletName && isConnected) {
      // Here you would typically interact with the Mina blockchain
      // For now, we'll just simulate success
      setIsSuccess(true);
    }
  };

  if (isSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.background}>
          <div className={styles.backgroundGradients}></div>
        </div>
        <main className={styles.main}>
          <h1 className={styles.title}>MultiSig Created!</h1>
          <div className={styles.card}>
            <h2>{walletName}</h2>
            <p>Your MultiSig wallet has been successfully created with the following details:</p>
            <ul className={styles.summaryList}>
              <li>Number of Signers: {signers.length}</li>
              <li>Threshold: {threshold}</li>
            </ul>
            <Link href="/" className={styles.backButton}>
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Create MultiSig Wallet - MINA</title>
        <meta name="description" content="Create a MultiSig wallet on MINA" />
      </Head>

      <div className={styles.background}>
        <div className={styles.backgroundGradients}></div>
      </div>

      <main className={styles.main}>
        <h1 className={styles.title}>Create MultiSig Wallet</h1>
        <p className={styles.tagline}>Secure your assets with multiple signatures</p>

        <div className={styles.card}>
          {!isConnected ? (
            <p className={styles.notConnected}>Please connect your Auro Wallet to create a MultiSig wallet.</p>
          ) : (
            <>
              <p className={styles.connectedAccount}>Connected: {account ? `${account.slice(0, 10)}...${account.slice(-4)}` : 'Unknown'}</p>
              <div className={styles.inputGroup}>
                <label htmlFor="walletName">Wallet Name:</label>
                <input
                  type="text"
                  id="walletName"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  className={styles.input}
                  placeholder="Enter wallet name"
                />
              </div>

              <h2>Signers</h2>
              <ul className={styles.signerList}>
                {signers.map((signer, index) => (
                  <li key={index}>
                    {signer.slice(0, 10)}...{signer.slice(-4)}
                    <button onClick={() => removeSigner(index)} className={styles.removeButton}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>

              <div className={styles.predefinedAddresses}>
                <h3>Quick Add:</h3>
                {predefinedAddresses.map((address, index) => (
                  <button
                    key={index}
                    onClick={() => addSigner(address)}
                    className={styles.addressButton}
                    disabled={signers.includes(address)}
                  >
                    Address {index + 1}
                  </button>
                ))}
              </div>

              <div className={styles.addSigner}>
                <input
                  type="text"
                  value={newSigner}
                  onChange={(e) => setNewSigner(e.target.value)}
                  placeholder="Enter custom signer address"
                  className={styles.input}
                />
                <button onClick={() => addSigner(newSigner)} className={styles.addButton}>
                  Add Signer
                </button>
              </div>

              <div className={styles.threshold}>
                <label htmlFor="threshold">Threshold (required signatures):</label>
                <input
                  type="number"
                  id="threshold"
                  value={threshold}
                  onChange={(e) => setThreshold(Math.max(1, Math.min(signers.length, parseInt(e.target.value))))}
                  min="1"
                  max={signers.length}
                  className={styles.input}
                />
              </div>

              <div className={styles.summary}>
                <p>Total Signers: <span className={styles.code}>{signers.length}</span></p>
                <p>Required Signatures: <span className={styles.code}>{threshold}</span></p>
              </div>

              <button onClick={createMultiSig} className={styles.createButton} disabled={signers.length < threshold || !walletName}>
                Create MultiSig Wallet
              </button>
            </>
          )}
        </div>

        <Link href="/" className={styles.backButton}>
          Back to Home
        </Link>
      </main>
    </div>
  );
};

export default MultiSig;