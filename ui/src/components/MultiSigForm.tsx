import React, { useState } from 'react';
import styles from '../styles/MultiSig.module.css';
import PredefinedAddresses from './PredefinedAddresses';
import SignersList from './SignersList';

interface MultiSigFormProps {
  signers: string[];
  addSigner: (address: string) => void;
  removeSigner: (index: number) => void;
  threshold: number;
  setThreshold: (threshold: number) => void;
  walletName: string;
  setWalletName: (name: string) => void;
  createMultiSig: () => void;
  isLoading: boolean;
}

const MultiSigForm: React.FC<MultiSigFormProps> = ({
  signers,
  addSigner,
  removeSigner,
  threshold,
  setThreshold,
  walletName,
  setWalletName,
  createMultiSig,
  isLoading
}) => {
  const [newSigner, setNewSigner] = useState<string>('');
  const predefinedAddresses = [
    'B62qnXy1f75qq8c6HS2Am88Gk6UyvTHK3iSYh4Hb3nD6DS2eS6wZ4or',
    'B62qjsV6WQwTeEWrNrRRBP6VaaLvQhwWTnFi4WP4LQjGvpfZEumXzxb',
    'B62qodtMG7Dwo7f6zWdzxWkG8ULtKZBFjbq9H6RTqMm4KhJVh1VPwrN',
    'B62qrYzMtqbdW3oRv6aX9G24L2ZqN6VnbDY8mJi8x3EWDbZw2bK6kDK',
    'B62qkRoGi7bbDJzFHpoSzQRqYSkjqUYiR8yM9c6aZpzKmke6zXxcS69',
  ];

  return (
    <>
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
      <SignersList signers={signers} removeSigner={removeSigner} />

      <PredefinedAddresses
        predefinedAddresses={predefinedAddresses}
        addSigner={addSigner}
        signers={signers}
      />

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

      <button 
        onClick={createMultiSig} 
        className={styles.createButton} 
        disabled={signers.length < threshold || !walletName || isLoading}
      >
        {isLoading ? 'Creating...' : 'Create MultiSig Wallet'}
      </button>
    </>
  );
};

export default MultiSigForm;
