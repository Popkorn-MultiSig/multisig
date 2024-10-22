import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import GradientBG from '../components/GradientBG';
import styles from '../styles/Home.module.css';
import heroMinaLogo from '../../public/assets/hero-mina-logo.svg';
import arrowRightSmall from '../../public/assets/arrow-right-small.svg';

export default function Home() {
  useEffect(() => {
    (async () => {
      const { Mina, PublicKey } = await import('o1js');
      const { Add } = await import('../../../contracts/build/src/');

      // Update this to use the address (public key) for your zkApp account.
      // To try it out, you can try this address for an example "Add" smart contract that we've deployed to
      // Testnet B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA.
      const zkAppAddress = '';
      // This should be removed once the zkAppAddress is updated.
      if (!zkAppAddress) {
        console.error(
          'The following error is caused because the zkAppAddress has an empty string as the public key. Update the zkAppAddress with the public key for your zkApp account, or try this address for an example "Add" smart contract that we deployed to Testnet: B62qkwohsqTBPsvhYE8cPZSpzJMgoKn4i1LQRuBAtVXWpaT4dgH6WoA'
        );
      }
      //const zkApp = new Add(PublicKey.fromBase58(zkAppAddress))
    })();
  }, []);

  return (
    <>
      <Head>
        <title>MultiSig Wallet - Mina zkApp</title>
        <meta name="description" content="MultiSig Wallet built with o1js" />
        <link rel="icon" href="/assets/favicon.ico" />
      </Head>
      <GradientBG>
        <main className={styles.main}>
          <div className={styles.center}>
            <a
              href="https://minaprotocol.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className={styles.logo}
                src={heroMinaLogo}
                alt="Mina Logo"
                width="191"
                height="174"
                priority
              />
            </a>
            <h1 className={styles.title}>MultiSig Wallet</h1>
            <p className={styles.tagline}>
              Secure your assets with multiple signatures
            </p>
          </div>
          <div className={styles.grid}>
            <Link href="/create-multisig" className={styles.card}>
              <h2>
                <span>Create</span>
                <div>
                  <Image
                    src={arrowRightSmall}
                    alt="Arrow Right"
                    width={16}
                    height={16}
                    priority
                  />
                </div>
              </h2>
              <p>Create a new MultiSig wallet</p>
            </Link>
            <Link href="/overview" className={styles.card}>
              <h2>
                <span>Overview</span>
                <div>
                  <Image
                    src={arrowRightSmall}
                    alt="Arrow Right"
                    width={16}
                    height={16}
                    priority
                  />
                </div>
              </h2>
              <p>View and manage your MultiSig wallets</p>
            </Link>
            {/* <Link href="/details" className={styles.card}>
              <h2>
                <span>Details</span>
                <div>
                  <Image
                    src={arrowRightSmall}
                    alt="Arrow Right"
                    width={16}
                    height={16}
                    priority
                  />
                </div>
              </h2>
              <p>View details of a specific MultiSig wallet</p>
            </Link> */}
            <Link href="/about" className={styles.card}>
              <h2>
                <span>FAQ</span>
                <div>
                  <Image
                    src={arrowRightSmall}
                    alt="Arrow Right"
                    width={16}
                    height={16}
                    priority
                  />
                </div>
              </h2>
              <p>What is POPKORN?</p>
            </Link>
          </div>
        </main>
      </GradientBG>
    </>
  );
}