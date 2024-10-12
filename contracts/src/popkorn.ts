import {
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  UInt64,
  Struct,
  Field,
  Permissions,
  Int64,
  AccountUpdate,
  AccountUpdateTree,
  MerkleMap,
  MerkleMapWitness,
  Poseidon,
  Signature,
  Bool,
} from 'o1js';

class AccountUpdateDescr extends Struct({
  balanceChange: Int64,
}) {
  apply(accountUpdate: AccountUpdate) {
    accountUpdate.balanceChange = this.balanceChange;
  }
}

export class PopkornMultisig extends SmartContract {
  @state(Field) signersMapRoot = State<Field>();
  @state(UInt64) signersCount = State<UInt64>();
  @state(UInt64) threshold = State<UInt64>();
  @state(Field) nonce = State<Field>();
  @state(Bool) isInitialized = State<Bool>();

  events = {
    'wallet-created': Field,
    'signer-added': PublicKey,
    'signer-removed': PublicKey,
    'threshold-changed': UInt64,
    'transaction-executed': Field,
  };

  init() {
    super.init();
    this.account.permissions.set({
      ...Permissions.default(),
      editState: Permissions.proofOrSignature(),
      send: Permissions.proofOrSignature(),
      receive: Permissions.none(),
    });
    this.isInitialized.set(Bool(false));
  }

  @method async setupMultisig(signers: PublicKey[], threshold: UInt64): Promise<void> {
    // Ensure the contract hasn't been initialized yet
    const initialized = this.isInitialized.get();
    this.isInitialized.requireEquals(initialized);
    initialized.assertEquals(Bool(false));

    // Validate inputs
    threshold.assertGreaterThan(UInt64.from(0));
    threshold.assertLessThanOrEqual(UInt64.from(signers.length));

    // Setup the signers map
    let signersMap = new MerkleMap();
    for (let i = 0; i < signers.length; i++) {
      const signerHash = Poseidon.hash(signers[i].toFields());
      signersMap.set(signerHash, Field(1));
    }

    // Set contract state
    this.signersMapRoot.set(signersMap.getRoot());
    this.signersCount.set(UInt64.from(signers.length));
    this.threshold.set(threshold);
    this.nonce.set(Field(0));
    this.isInitialized.set(Bool(true));

    this.emitEvent('wallet-created', this.address);
    for (let signer of signers) {
      this.emitEvent('signer-added', signer);
    }
  }

  @method async addSigner(signerPubKey: PublicKey, witness: MerkleMapWitness): Promise<void> {
    // Ensure the contract is initialized
    this.isInitialized.requireEquals(Bool(true));

    const currentRoot = this.signersMapRoot.get();
    this.signersMapRoot.requireEquals(currentRoot);
    const currentCount = this.signersCount.get();
    this.signersCount.requireEquals(currentCount);

    const signerHash = Poseidon.hash(signerPubKey.toFields());
    const [rootBefore, key] = witness.computeRootAndKeyV2(Field(0));
    rootBefore.assertEquals(currentRoot);
    key.assertEquals(signerHash);

    const [rootAfter] = witness.computeRootAndKeyV2(Field(1));
    this.signersMapRoot.set(rootAfter);
    this.signersCount.set(currentCount.add(1));

    this.emitEvent('signer-added', signerPubKey);
  }

  @method async removeSigner(signerPubKey: PublicKey, witness: MerkleMapWitness): Promise<void> {
    // Ensure the contract is initialized
    this.isInitialized.requireEquals(Bool(true));

    const currentRoot = this.signersMapRoot.get();
    this.signersMapRoot.requireEquals(currentRoot);
    const currentCount = this.signersCount.get();
    this.signersCount.requireEquals(currentCount);

    const signerHash = Poseidon.hash(signerPubKey.toFields());
    const [rootBefore, key] = witness.computeRootAndKeyV2(Field(1));
    rootBefore.assertEquals(currentRoot);
    key.assertEquals(signerHash);

    const [rootAfter] = witness.computeRootAndKey(Field(0));
    this.signersMapRoot.set(rootAfter);
    this.signersCount.set(currentCount.sub(1));

    const currentThreshold = this.threshold.get();
    currentThreshold.assertLessThanOrEqual(this.signersCount.get());

    this.emitEvent('signer-removed', signerPubKey);
  }

  @method async setThreshold(newThreshold: UInt64): Promise<void> {
    this.isInitialized.requireEquals(Bool(true));

    const currentCount = this.signersCount.get();
    this.signersCount.requireEquals(currentCount);

    newThreshold.assertLessThanOrEqual(currentCount);
    newThreshold.assertGreaterThan(UInt64.from(0));

    this.threshold.set(newThreshold);

    this.emitEvent('threshold-changed', newThreshold);
  }

  @method async interact(rootUpdate: AccountUpdateDescr, subtree: AccountUpdateTree, signatures: Signature[], signerPubKeys: PublicKey[]): Promise<void> {

    this.isInitialized.requireEquals(Bool(true));

    const currentNonce = this.nonce.get();
    this.nonce.requireEquals(currentNonce);
    
    const currentThreshold = this.threshold.get();
    this.threshold.requireEquals(currentThreshold);

    this.verifySignatures(signatures, signerPubKeys, currentNonce);

    rootUpdate.apply(this.self);
    this.approve(subtree);
    
    this.nonce.set(currentNonce.add(1));

    this.emitEvent('transaction-executed', currentNonce);
  }

  verifySignatures(signatures: Signature[], signerPubKeys: PublicKey[], nonce: Field): void {
    const signaturesLength = signatures.length;
    const pubKeysLength = signerPubKeys.length;
    
    Bool(signaturesLength === pubKeysLength).assertTrue();
    Bool(signaturesLength >= this.threshold.get().toBigInt()).assertTrue();

    for (let i = 0; i < signaturesLength; i++) {
      const signature = signatures[i];
      const publicKey = signerPubKeys[i];
      
      signature.verify(publicKey, [nonce]).assertTrue();
      
      // verify the signer is in the Merkle tree
      const signerHash = Poseidon.hash(publicKey.toFields());
      const witness = new MerkleMap().getWitness(signerHash);
      const [root, ] = witness.computeRootAndKeyV2(Field(1));
      root.assertEquals(this.signersMapRoot.get());
    }
  }
}