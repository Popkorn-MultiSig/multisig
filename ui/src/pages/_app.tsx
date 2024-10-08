import "@/styles/globals.css";
import type { AppProps } from 'next/app';
import WalletConnection from "./WalletConnection";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <WalletConnection />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;