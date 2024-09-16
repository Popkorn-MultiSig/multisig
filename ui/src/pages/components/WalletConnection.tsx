import React, { useState, useEffect } from 'react';
import { useMinaWallet } from '@/hooks/useMinaWallet';
import styles from '@/styles/WalletConnection.module.css';

const WalletConnection: React.FC = () => {
  const { account, isConnected, network, connectWallet, checkConnection } = useMinaWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    if (account) {
      fetchBalance(account);
    } else {
      setBalance(null);
    }
  }, [account]);

  const fetchBalance = async (address: string) => {
    try {
      const response = await fetch(`https://proxy.berkeley.minaexplorer.com/wallet/${address}`);
      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
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
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <h3>Wallet Details</h3>
                <p>Address: {account}</p>
                <p>Network: {network}</p>
                <p>Balance: {balance ? `${balance} MINA` : 'Loading...'}</p>
                <button onClick={toggleModal} className={styles.closeButton}>
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WalletConnection;