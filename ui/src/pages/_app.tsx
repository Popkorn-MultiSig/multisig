import "@/styles/globals.css";
import type { AppProps } from 'next/app';
import WalletConnection from "./WalletConnection";
import { ZkappProvider } from './zkappContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ZkappProvider>
      <WalletConnection />
      <Component {...pageProps} />
      </ZkappProvider>
  );
}

export default MyApp;