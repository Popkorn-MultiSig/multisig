import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { useMinaWallet } from '../hooks/useMinaWallet';
import styles from '../styles/MultiSig.module.css';

interface MultiSigWallet {
  id: number;
  name: string;
  signers: number;
  threshold: number;
  address: string;
  balance?: string;
}

const MultiSigOverview: React.FC = () => {
  const { isConnected } = useMinaWallet();
  const [multiSigs, setMultiSigs] = useState<MultiSigWallet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMultiSigs = async () => {
      try {

        // Temporary mock data
        const mockData: MultiSigWallet[] = [
          { id: 1, name: 'Team Wallet', signers: 3, threshold: 2, address: 'B62qnXy1f75qq8c6HS2Am88Gk6UyvTHK3iSYh4Hb3nD6DS2eS6wZ4or' },
          { id: 2, name: 'Project Fund', signers: 4, threshold: 3, address: 'B62qjsV6WQwTeEWrNrRRBP6VaaLvQhwWTnFi4WP4LQjGvpfZEumXzxb' },
          { id: 3, name: 'Emergency Reserve', signers: 5, threshold: 4, address: 'B62qodtMG7Dwo7f6zWdzxWkG8ULtKZBFjbq9H6RTqMm4KhJVh1VPwrN' },
        ];

        const multiSigsWithBalance = await Promise.all(mockData.map(async (wallet) => {
          // const balance = await fetchBalance(wallet.address);
          const balance = 1000;
          return { ...wallet, balance };
        }));

        setMultiSigs(multiSigsWithBalance);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch MultiSig wallets:', error);
        setError('Failed to fetch MultiSig wallets. Please try again later.');
        setLoading(false);
      }
    };

    if (isConnected) {
      fetchMultiSigs();
    }
  }, [isConnected]);

  const fetchBalance = async (address: string): Promise<string> => {
    try {
      const response = await fetch(`/api/balance?address=${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      const data = await response.json();
      return data.balance.total;
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      return 'Error';
    }
  };

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <p>Please connect your Auro Wallet to view MultiSig wallets.</p>
      </div>
    );
  }

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.container}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>MultiSig Wallets Overview - MINA</title>
        <meta name="description" content="Overview of your MultiSig wallets on MINA" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Your MultiSig Wallets</h1>

        <div className={styles.grid}>
          {multiSigs.map((wallet) => (
            <Link href={`/multisig/${wallet.id}`} key={wallet.id}>
              <div className={styles.card}>
                <h2>{wallet.name}</h2>
                <p>Signers: {wallet.signers}</p>
                <p>Threshold: {wallet.threshold}</p>
                <p>Balance: {wallet.balance} MINA</p>
              </div>
            </Link>
          ))}
        </div>

        <Link href="/create-multisig">
          <button className={styles.button}>Create New MultiSig Wallet</button>
        </Link>
      </main>
    </div>
  );
};

export default MultiSigOverview;