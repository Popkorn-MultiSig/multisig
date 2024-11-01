import { useState, useEffect, useCallback } from 'react';
import { PublicKey, MerkleMap, Field, MerkleMapWitness } from 'o1js';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MAX_SIGNERS = 10;

type MerkleRootComponentProps = {
  setSignersMapRoot: (root: string) => void;
  setSignersCount: (count: string) => void;
};

// Predefined signer addresses for testing
const predefinedAddresses = [
  'B62qnXy1f75qq8c6HS2Am88Gk6UyvTHK3iSYh4Hb3nD6DS2eS6wZ4or',
  'B62qjsV6WQwTeEWrNrRRBP6VaaLvQhwWTnFi4WP4LQjGvpfZEumXzxb',
  'B62qodtMG7Dwo7f6zWdzxWkG8ULtKZBFjbq9H6RTqMm4KhJVh1VPwrN',
  'B62qrYzMtqbdW3oRv6aX9G24L2ZqN6VnbDY8mJi8x3EWDbZw2bK6kDK',
  'B62qkRoGi7bbDJzFHpoSzQRqYSkjqUYiR8yM9c6aZpzKmke6zXxcS69',
] as const;

export default function MerkleRootComponent({ 
  setSignersMapRoot, 
  setSignersCount 
}: MerkleRootComponentProps) {
  // State
  const [customAddress, setCustomAddress] = useState('');
  const [addresses, setAddresses] = useState<string[]>([...predefinedAddresses]);
  const [selectedAddresses, setSelectedAddresses] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState('');
  const [merkleMap, setMerkleMap] = useState<MerkleMap | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [witnesses, setWitnesses] = useState<Record<string, MerkleMapWitness>>({});

  // Initialize MerkleMap
  useEffect(() => {
    try {
      const map = new MerkleMap();
      setMerkleMap(map);
      console.log('MerkleMap initialized');
    } catch (err) {
      console.error('Failed to initialize MerkleMap:', err);
      setErrorMsg('Failed to initialize MerkleMap');
    }
    return () => setMerkleMap(null);
  }, []);

  // Validate Mina address format
  const validateMinaAddress = useCallback((address: string): boolean => {
    try {
      PublicKey.fromBase58(address);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Handle address selection
  const handleAddressSelect = useCallback((address: string) => {
    if (!validateMinaAddress(address)) {
      setErrorMsg('Invalid Mina address format');
      return;
    }

    setSelectedAddresses(prev => {
      const newAddresses = new Set(prev);
      if (newAddresses.has(address)) {
        newAddresses.delete(address);
      } else {
        if (newAddresses.size >= MAX_SIGNERS) {
          setErrorMsg(`Maximum of ${MAX_SIGNERS} signers allowed`);
          return prev;
        }
        newAddresses.add(address);
      }
      return newAddresses;
    });
  }, [validateMinaAddress]);

  // Handle custom address addition
  const handleCustomAddressAdd = useCallback(() => {
    setErrorMsg('');
    
    if (!customAddress.trim()) {
      setErrorMsg('Please enter an address');
      return;
    }

    if (!validateMinaAddress(customAddress)) {
      setErrorMsg('Invalid Mina address format');
      return;
    }

    if (addresses.includes(customAddress)) {
      setErrorMsg('Address already in the list');
      return;
    }

    if (addresses.length >= MAX_SIGNERS) {
      setErrorMsg(`Maximum of ${MAX_SIGNERS} signers allowed`);
      return;
    }

    setAddresses(prev => [...prev, customAddress]);
    setSelectedAddresses(prev => new Set(prev).add(customAddress));
    setCustomAddress('');
  }, [customAddress, addresses, validateMinaAddress]);

  // Handle key press for custom address input
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomAddressAdd();
    }
  }, [handleCustomAddressAdd]);

  // Update Merkle root when selected addresses change
  useEffect(() => {
    const updateMerkleRoot = async () => {
      if (!merkleMap) {
        setErrorMsg('Add at least one signer');
        return;
      }

      if (selectedAddresses.size === 0) {
        setSignersMapRoot('');
        setSignersCount('0');
        setWitnesses({});
        return;
      }

      setIsProcessing(true);
      try {
        const newMerkleMap = new MerkleMap();
        const newWitnesses: Record<string, MerkleMapWitness> = {};

        Array.from(selectedAddresses).forEach(address => {
          const pubKey = PublicKey.fromBase58(address);
          const fieldKey = pubKey.toFields()[0];
          const witness = newMerkleMap.getWitness(fieldKey);
          newWitnesses[address] = witness;
          newMerkleMap.set(fieldKey, Field(1));
        });

        const root = newMerkleMap.getRoot();
        setSignersMapRoot(root.toString());
        setSignersCount(selectedAddresses.size.toString());
        setWitnesses(newWitnesses);
        setErrorMsg('');
        
        console.log('Merkle root computed:', root.toString());
        console.log('Selected signers:', selectedAddresses.size);
        console.log('Witnesses generated:', Object.keys(newWitnesses).length);

      } catch (err) {
        console.error('Merkle computation error:', err);
        setErrorMsg('Failed to compute Merkle root: ' + (err instanceof Error ? err.message : String(err)));
        setSignersMapRoot('');
        setSignersCount('0');
        setWitnesses({});
      } finally {
        setIsProcessing(false);
      }
    };

    updateMerkleRoot();
  }, [selectedAddresses, setSignersMapRoot, setSignersCount, merkleMap]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md relative">
      {isProcessing && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Signer Addresses</h2>
        
        {errorMsg && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {addresses.map((address) => (
            <div 
              key={address} 
              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <code className="text-sm font-mono text-gray-600 truncate">
                {address}
              </code>
              <Button
                onClick={() => handleAddressSelect(address)}
                variant={selectedAddresses.has(address) ? "default" : "outline"}
                className="ml-4"
                disabled={isProcessing}
              >
                {selectedAddresses.has(address) ? 'Selected' : 'Select'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Add Custom Signer</h2>
        <div className="flex gap-3">
          <Input
            type="text"
            placeholder="Enter Mina Address"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isProcessing || addresses.length >= MAX_SIGNERS}
            className="flex-1"
          />
          <Button
            onClick={handleCustomAddressAdd}
            disabled={!customAddress.trim() || isProcessing || addresses.length >= MAX_SIGNERS}
          >
            Add Signer
          </Button>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t">
        <p className="text-sm text-gray-600">
          Selected Signers: <strong>{selectedAddresses.size}</strong> / {MAX_SIGNERS}
        </p>
      </div>
    </div>
  );
}