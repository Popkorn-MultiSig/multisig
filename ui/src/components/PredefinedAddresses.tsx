import React from 'react';
import styles from '../styles/MultiSig.module.css';

interface PredefinedAddressesProps {
  predefinedAddresses: string[];
  addSigner: (address: string) => void;
  signers: string[];
}

const PredefinedAddresses: React.FC<PredefinedAddressesProps> = ({ predefinedAddresses, addSigner, signers }) => {
  return (
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
  );
};

export default PredefinedAddresses;