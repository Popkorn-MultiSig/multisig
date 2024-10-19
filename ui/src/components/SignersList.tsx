import React from 'react';
import styles from '../styles/MultiSig.module.css';

interface SignersListProps {
  signers: string[];
  removeSigner: (index: number) => void;
}

const SignersList: React.FC<SignersListProps> = ({ signers, removeSigner }) => {
  return (
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
  );
};

export default SignersList;