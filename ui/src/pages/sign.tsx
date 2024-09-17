import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useMinaWallet } from '../hooks/useMinaWallet';

const predefinedAddresses = [
  'B62qnXy1f75qq8c6HS2Am88Gk6UyvTHK3iSYh4Hb3nD6DS2eS6wZ4or',
  'B62qjsV6WQwTeEWrNrRRBP6VaaLvQhwWTnFi4WP4LQjGvpfZEumXzxb',
  'B62qodtMG7Dwo7f6zWdzxWkG8ULtKZBFjbq9H6RTqMm4KhJVh1VPwrN',
  'B62qrYzMtqbdW3oRv6aX9G24L2ZqN6VnbDY8mJi8x3EWDbZw2bK6kDK',
  'B62qkRoGi7bbDJzFHpoSzQRqYSkjqUYiR8yM9c6aZpzKmke6zXxcS69',
];

export default function PopkornPage() {
  const { account, isConnected } = useMinaWallet();
  const [walletName, setWalletName] = useState('');
  const [signers, setSigners] = useState<string[]>([]);
  const [newSigner, setNewSigner] = useState('');
  const [threshold, setThreshold] = useState(1);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const addSigner = (address: string) => {
    if (!signers.includes(address) && address.trim() !== '') {
      setSigners([...signers, address]);
      setNewSigner('');
    }
  };

  const removeSigner = (index: number) => {
    setSigners(signers.filter((_, i) => i !== index));
  };

  const handleCreateWallet = () => {
    if (!walletName) {
      setError('Please enter a wallet name.');
      return;
    }
    if (signers.length < 2) {
      setError('Number of signers must be at least 2.');
      return;
    }
    if (threshold > signers.length) {
      setError('Threshold cannot be greater than the number of signers.');
      return;
    }
    console.log('Creating wallet with:', { walletName, signers, threshold });
    setError('');
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">MultiSig Created!</CardTitle>
          </CardHeader>
          <CardContent>
            <h2 className="text-xl font-semibold">{walletName}</h2>
            <p>Your MultiSig wallet has been successfully created with the following details:</p>
            <ul className="list-disc list-inside mt-2">
              <li>Number of Signers: {signers.length}</li>
              <li>Threshold: {threshold}</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => setIsSuccess(false)}>Create Another Wallet</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">POPKORN</CardTitle>
          <CardDescription className="text-center text-lg">
            Zero-Knowledge MultiSig for Mina Protocol
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {!isConnected ? (
            <p className="text-center text-red-500">Please connect your Auro Wallet to create a MultiSig wallet.</p>
          ) : (
            <>
              <p className="text-sm text-gray-500">Connected: {account ? `${account.slice(0, 10)}...${account.slice(-4)}` : 'Unknown'}</p>
              <div className="space-y-2">
                <Label htmlFor="walletName">Wallet Name</Label>
                <Input
                  id="walletName"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                  placeholder="Enter wallet name"
                />
              </div>
              <div className="space-y-2">
                <Label>Signers</Label>
                <ul className="space-y-2">
                  {signers.map((signer, index) => (
                    <li key={index} className="flex justify-between items-center">
                      <span className="text-sm">{signer.slice(0, 10)}...{signer.slice(-4)}</span>
                      <Button variant="destructive" size="sm" onClick={() => removeSigner(index)}>Remove</Button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newSigner">Add Signer</Label>
                <div className="flex space-x-2">
                  <Input
                    id="newSigner"
                    value={newSigner}
                    onChange={(e) => setNewSigner(e.target.value)}
                    placeholder="Enter signer address"
                  />
                  <Button onClick={() => addSigner(newSigner)}>Add</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Quick Add:</Label>
                <div className="flex flex-wrap gap-2">
                  {predefinedAddresses.map((address, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => addSigner(address)}
                      disabled={signers.includes(address)}
                    >
                      Address {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Confirmation Threshold</Label>
                <Slider
                  id="threshold"
                  min={1}
                  max={Math.max(signers.length, 1)}
                  step={1}
                  value={[threshold]}
                  onValueChange={(value) => setThreshold(value[0])}
                />
                <p className="text-sm text-gray-500">Selected Threshold: {threshold}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Total Signers: {signers.length}</p>
                <p className="text-sm text-gray-500">Required Signatures: {threshold}</p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleCreateWallet} disabled={!isConnected || signers.length < 2 || !walletName}>
            Create MultiSig Wallet
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}