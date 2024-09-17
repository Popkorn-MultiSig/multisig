import Head from 'next/head'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black font-monument">
      <Head>
        <title>POPKORN: Zero-Knowledge MultiSig Wallet</title>
        <meta name="description" content="Secure your assets with POPKORN's innovative zero-knowledge multisig technology" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="relative min-h-screen">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[url('/assets/hash-pattern.png')] opacity-10 z-0"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-300 via-pink-300 to-blue-300 opacity-20 filter blur-[150px] z-0"></div>
        </div>

        <main className="relative z-10 px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-6xl font-bold mb-4">POPKORN</h1>
            <p className="text-xl font-monument-light">Zero-Knowledge MultiSig Wallet</p>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-4">What is MultiSig?</h2>
            <p className="text-lg mb-4">
              MultiSig, short for multi-signature, is a technology that requires multiple parties to approve a transaction before it can be executed. This adds an extra layer of security to digital asset management.
            </p>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-4">POPKORN Innovative Approach</h2>
            <p className="text-lg mb-4">
              POPKORN takes MultiSig to the next level by incorporating zero-knowledge proofs. This groundbreaking approach enhances privacy and security while maintaining the benefits of traditional MultiSig wallets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            <div className="relative p-6 bg-white border border-gray-800 rounded-sm transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <h3 className="text-xl font-bold mb-2">Enhanced Privacy</h3>
              <p className="text-gray-600">
                Zero-knowledge proofs allow for transaction verification without revealing sensitive information.
              </p>
            </div>
            <div className="relative p-6 bg-white border border-gray-800 rounded-sm transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <h3 className="text-xl font-bold mb-2">Improved Security</h3>
              <p className="text-gray-600">
                Multiple signatures required for transactions, reducing the risk of unauthorized access.
              </p>
            </div>
            <div className="relative p-6 bg-white border border-gray-800 rounded-sm transform transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
              <h3 className="text-xl font-bold mb-2">Flexible Control</h3>
              <p className="text-gray-600">
                Customize the number of required signatures and manage complex approval processes.
              </p>
            </div>
          </div>

          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-4">How POPKORN Works</h2>
            <ol className="list-decimal list-inside space-y-2 text-lg">
              <li>Multiple parties generate their own key pairs</li>
              <li>A threshold number of signatures is agreed upon</li>
              <li>When a transaction is initiated, it is broadcasted to all signers</li>
              <li>Each signer creates a zero-knowledge proof of their signature</li>
              <li>Proofs are aggregated without revealing individual signatures</li>
              <li>The aggregated proof is verified on-chain, ensuring the threshold is met</li>
              <li>If verified, the transaction is executed on the blockchain</li>
            </ol>
          </div>

          <div className="text-center">
            <a href="#" className="inline-block px-8 py-3 text-lg font-bold text-white bg-black rounded-sm hover:bg-gray-800 transition-colors duration-200">
              Get Started with POPKORN
            </a>
          </div>
        </main>
      </div>
    </div>
  )
}