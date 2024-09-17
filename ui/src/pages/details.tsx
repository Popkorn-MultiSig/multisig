import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { useMinaWallet } from '../hooks/useMinaWallet';
import styles from '../styles/MultiSig.module.css';

interface MultiSigWallet {
  id: string;
  name: string;
  signers: string[];
  threshold: number;
  address: string;
  balance?: string;
}

interface Transaction {
  id: number;
  recipient: string;
  amount: number;
  signatures: number;
}

const MultiSigDetails: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isConnected, account } = useMinaWallet();
  const [wallet, setWallet] = useState<MultiSigWallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  useEffect(() => {
    const fetchWalletDetails = async () => {
    //   if (!id) return;
      try {
        // In a real application, you would fetch this data from your backend or blockchain
        const mockWallet: MultiSigWallet = {
          id: id as string,
          name: 'Team Wallet',
          signers: ['B62qnXy1f75qq8c6HS2Am88Gk6UyvTHK3iSYh4Hb3nD6DS2eS6wZ4or', 'B62qjsV6WQwTeEWrNrRRBP6VaaLvQhwWTnFi4WP4LQjGvpfZEumXzxb', 'B62qodtMG7Dwo7f6zWdzxWkG8ULtKZBFjbq9H6RTqMm4KhJVh1VPwrN'],
          threshold: 2,
          address: 'B62qrYzMtqbdW3oRv6aX9G24L2ZqN6VnbDY8mJi8x3EWDbZw2bK6kDK'
        };

        // const balance = await fetchBalance(mockWallet.address);
        const balance = 1000;
        setWallet({ ...mockWallet, balance });

        // Mock pending transactions
        const mockTransactions: Transaction[] = [
          { id: 1, recipient: 'B62qkRoGi7bbDJzFHpoSzQRqYSkjqUYiR8yM9c6aZpzKmke6zXxcS69', amount: 100, signatures: 1 },
          { id: 2, recipient: 'B62qnXy1f75qq8c6HS2Am88Gk6UyvTHK3iSYh4Hb3nD6DS2eS6wZ4or', amount: 50, signatures: 0 },
        ];
        setTransactions(mockTransactions);

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch wallet details:', error);
        setError('Failed to fetch wallet details. Please try again later.');
        setLoading(false);
      }
    };

    if (isConnected && id) {
      fetchWalletDetails();
    }
  }, [isConnected, id]);

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

  const createTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, you would send this transaction to the blockchain
    console.log(`Creating transaction: Send ${amount} MINA to ${recipient}`);
    // Reset form
    setRecipient('');
    setAmount('');
  };

  if (!isConnected) {
    return (
      <div className={styles.container}>
        <p>Please connect your Auro Wallet to view MultiSig wallet details.</p>
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
        <title>{wallet?.name} - MultiSig Wallet Details - MINA</title>
        <meta name="description" content={`Details of ${wallet?.name} MultiSig wallet on MINA`} />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>{wallet?.name}</h1>
        <p>Address: {wallet?.address}</p>
        <p>Balance: {wallet?.balance} MINA</p>
        <p>Signers: {wallet?.signers.length}</p>
        <p>Threshold: {wallet?.threshold}</p>

        <h2>Signers</h2>
        <ul className={styles.signerList}>
          {wallet?.signers.map((signer, index) => (
            <li key={index}>{signer}</li>
          ))}
        </ul>

        <h2>Pending Transactions</h2>
        {transactions.length > 0 ? (
          <ul className={styles.transactionList}>
            {transactions.map((tx) => (
              <li key={tx.id}>
                Send {tx.amount} MINA to {tx.recipient} ({tx.signatures}/{wallet?.threshold} signatures)
              </li>
            ))}
          </ul>
        ) : (
          <p>No pending transactions.</p>
        )}

        <h2>Create New Transaction</h2>
        <form onSubmit={createTransaction} className={styles.form}>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="Recipient Address"
            required
            className={styles.input}
          />
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount (MINA)"
            required
            className={styles.input}
          />
          <button type="submit" className={styles.button}>Create Transaction</button>
        </form>

        <Link href="/multisig">
          <button className={styles.backButton}>Back to Overview</button>
        </Link>
      </main>
    </div>
  );
};

export default MultiSigDetails;