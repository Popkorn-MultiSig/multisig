import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/MultiSig.module.css';

const MultiSig: React.FC = () => {
  const [signers, setSigners] = useState<string[]>([]);
  const [threshold, setThreshold] = useState<number>(2);
  const [newSigner, setNewSigner] = useState<string>('');

  const addSigner = () => {
    if (newSigner && !signers.includes(newSigner)) {
      setSigners([...signers, newSigner]);
      setNewSigner('');
    }
  };

  const removeSigner = (index: number) => {
    setSigners(signers.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>MultiSig Wallet - MINA</title>
        <meta name="description" content="MultiSig wallet functionality for MINA" />
      </Head>

      <div className={styles.background}>
        <div className={styles.backgroundGradients}></div>
      </div>

      <main className={styles.main}>
        <h1 className={styles.title}>MultiSig Wallet</h1>
        <p className={styles.tagline}>Secure your assets with multiple signatures</p>

        <div className={styles.card}>
          <h2>Signers</h2>
          <ul className={styles.signerList}>
            {signers.map((signer, index) => (
              <li key={index}>
                {signer}
                <button onClick={() => removeSigner(index)} className={styles.removeButton}>
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.addSigner}>
            <input
              type="text"
              value={newSigner}
              onChange={(e) => setNewSigner(e.target.value)}
              placeholder="Enter signer address"
              className={styles.input}
            />
            <button onClick={addSigner} className={styles.addButton}>
              Add Signer
            </button>
          </div>

          <div className={styles.threshold}>
            <label htmlFor="threshold">Threshold (required signatures):</label>
            <input
              type="number"
              id="threshold"
              value={threshold}
              onChange={(e) => setThreshold(Math.max(1, parseInt(e.target.value)))}
              min="1"
              max={signers.length}
              className={styles.input}
            />
          </div>

          <div className={styles.summary}>
            <p>Total Signers: <span className={styles.code}>{signers.length}</span></p>
            <p>Required Signatures: <span className={styles.code}>{threshold}</span></p>
          </div>
        </div>

        <Link href="/" className={styles.backButton}>
          Back to Home
        </Link>
      </main>
    </div>
  );
};

export default MultiSig;