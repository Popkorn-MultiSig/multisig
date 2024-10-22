import { useState, useEffect } from 'react';
import { PublicKey, MerkleMap, Field } from 'o1js';

type MerkleRootComponentProps = {
  setSignersMapRoot: (root: string) => void;
  setSignersCount: (count: string) => void;
};

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
  const [customAddress, setCustomAddress] = useState('');
  const [selectedAddresses, setSelectedAddresses] = useState<Set<string>>(new Set());
  const [errorMsg, setErrorMsg] = useState('');
  const [merkleMap, setMerkleMap] = useState<MerkleMap | null>(null);

  // Initialize MerkleMap and handle cleanup
  useEffect(() => {
    const map = new MerkleMap();
    setMerkleMap(map);
    return () => {
      setMerkleMap(null);
    };
  }, []);

  const validateMinaAddress = (address: string): boolean => {
    try {
      PublicKey.fromBase58(address);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddressSelect = (address: string) => {
    if (!validateMinaAddress(address)) {
      setErrorMsg('Invalid Mina address format');
      return;
    }

    setSelectedAddresses(prev => {
      const newAddresses = new Set(prev);
      if (newAddresses.has(address)) {
        setErrorMsg('Address already selected');
        return prev;
      }
      newAddresses.add(address);
      setErrorMsg('');
      return newAddresses;
    });
  };

  const handleCustomAddressAdd = () => {
    if (!customAddress.trim()) {
      setErrorMsg('Please enter an address');
      return;
    }

    if (!validateMinaAddress(customAddress)) {
      setErrorMsg('Invalid Mina address');
      return;
    }

    handleAddressSelect(customAddress);
    setCustomAddress('');
  };

// In the handleComputeRoot function:
const handleComputeRoot = () => {
    if (!merkleMap) {
      setErrorMsg('MerkleMap not initialized');
      return;
    }
  
    if (selectedAddresses.size === 0) {
      setErrorMsg('Please select at least one signer');
      return;
    }
  
    try {
      // Create a new map for fresh computation
      const newMerkleMap = new MerkleMap();
  
      Array.from(selectedAddresses).forEach(address => {
        try {
          const pubKey = PublicKey.fromBase58(address);
          const fieldKey = pubKey.toFields()[0];
          newMerkleMap.set(fieldKey, Field(1));
        } catch (err) {
          throw new Error(`Failed to process address ${address}: ${err}`);
        }
      });
  
      const root = newMerkleMap.getRoot();
      setSignersMapRoot(root.toString());
      setSignersCount(selectedAddresses.size.toString());
      setErrorMsg('');
      
      // Update the merkle map state
      setMerkleMap(newMerkleMap);
    } catch (err) {
      console.error('Computation error:', err);
      setErrorMsg('Failed to compute Merkle root: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomAddressAdd();
    }
  };

  const removeAddress = (addressToRemove: string) => {
    setSelectedAddresses(prev => {
      const newAddresses = new Set(prev);
      newAddresses.delete(addressToRemove);
      return newAddresses;
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Select Predefined Signer Addresses</h2>
        <ul className="space-y-2">
          {predefinedAddresses.map((address) => (
            <li key={address} className="flex justify-between items-center bg-gray-100 p-2 rounded">
              <span className="text-sm font-mono text-gray-600 truncate">
                {address}
              </span>
              <button 
                onClick={() => handleAddressSelect(address)}
                disabled={selectedAddresses.has(address)}
                className={`px-3 py-1 rounded text-white ${
                  selectedAddresses.has(address) 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {selectedAddresses.has(address) ? 'Selected' : 'Select'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Add Custom Signer Address</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter Mina Address"
            value={customAddress}
            onChange={(e) => setCustomAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-4 py-2 border rounded focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={handleCustomAddressAdd}
            disabled={!customAddress.trim()}
            className={`px-4 py-2 rounded text-white ${
              !customAddress.trim() 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            Add
          </button>
        </div>
        {errorMsg && (
          <p className="text-red-500 mt-2 text-sm">{errorMsg}</p>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">
          Selected Signers ({selectedAddresses.size})
        </h2>
        <ul className="space-y-2">
          {Array.from(selectedAddresses).map((address) => (
            <li key={address} className="flex justify-between items-center bg-gray-200 p-2 rounded">
              <span className="text-sm font-mono text-gray-700 truncate">
                {address}
              </span>
              <button
                onClick={() => removeAddress(address)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      <button 
        onClick={handleComputeRoot}
        disabled={selectedAddresses.size === 0}
        className={`w-full px-4 py-2 rounded text-white ${
          selectedAddresses.size === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-purple-500 hover:bg-purple-600'
        }`}
      >
        Compute Signers Map Root
      </button>
    </div>
  );
}