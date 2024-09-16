import React, { useState, useEffect } from 'react';
import { useMinaWallet } from '@/hooks/useMinaWallet';
import styles from '@/styles/WalletConnection.module.css';
import { DefaultSupportNetorkIDs } from '@/constants/config';

const WalletConnection: React.FC = () => {
  const { account, isConnected, network, balance, setBalance, connectWallet, checkConnection } = useMinaWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    if (account) {
      fetchBalance(account);
    } else {
      setBalance(null);
    }
  }, [account, setBalance]);

  const fetchBalance = async (address: string) => {
    try {
      setError(null);
      const response = await fetch(`/api/balance?address=${address}`);
      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }
      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setError('Failed to fetch balance. Please try again later.');
      setBalance(null);
    }
  };

  const shortenAddress = (address: string | null) => {
    return address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  };

  const handleConnect = async () => {
    await connectWallet();
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const getNetworkName = (networkId: string | null) => {
    return Object.entries(DefaultSupportNetorkIDs).find(([_, value]) => value === networkId)?.[0] || 'Unknown';
  };

  return (
    <div className={styles.walletConnection}>
      {!isConnected ? (
        <button onClick={handleConnect} className={styles.connectButton}>
          Connect Wallet
        </button>
      ) : (
        <>
          <button onClick={toggleModal} className={styles.addressButton}>
            {shortenAddress(account)}
          </button>
          {isModalOpen && (
            <div className={styles.modalOverlay} onClick={toggleModal}>
              <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalContent}>
                  <h3>Wallet Details</h3>
                  <p><strong>Address:</strong> {account}</p>
                  <p><strong>Network:</strong> {getNetworkName(network)}</p>
                  <p><strong>Balance:</strong> {balance ? `${balance} MINA` : 'Loading...'}</p>
                  {error && <p className={styles.error}>{error}</p>}
                  <button onClick={toggleModal} className={styles.closeButton}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WalletConnection;