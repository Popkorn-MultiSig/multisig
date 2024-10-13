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
  
  export class Popkorn2 extends SmartContract {
    @state(Field) signersMapRoot = State<Field>();
    @state(UInt64) signersCount = State<UInt64>();
    @state(UInt64) threshold = State<UInt64>();
    @state(Field) nonce = State<Field>();
    @state(Bool) isInitialized = State<Bool>();
  
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
  
    @method async setupMultisig(
      signersMapRoot: Field,
      signersCount: UInt64,
      threshold: UInt64
    ) {
      const initialized = this.isInitialized.get();
      this.isInitialized.requireEquals(initialized);
      initialized.assertFalse();
  
      threshold.assertGreaterThan(UInt64.from(0));
      threshold.assertLessThanOrEqual(signersCount);
  
      this.signersMapRoot.set(signersMapRoot);
      this.signersCount.set(signersCount);
      this.threshold.set(threshold);
      this.nonce.set(Field(0));
      this.isInitialized.set(Bool(true));
    }
  
    @method async addSigner(signerPubKey: PublicKey, witness: MerkleMapWitness) {

      const initialized = this.isInitialized.get();
      this.isInitialized.requireEquals(initialized);
      initialized.assertTrue();
  
      const currentRoot = this.signersMapRoot.get();
      this.signersMapRoot.requireEquals(currentRoot);
      const currentCount = this.signersCount.get();
      this.signersCount.requireEquals(currentCount);
  
      const signerHash = Poseidon.hash(signerPubKey.toFields());
      const [rootBefore, key] = witness.computeRootAndKey(Field(0));
      rootBefore.assertEquals(currentRoot);
      key.assertEquals(signerHash);
  
      const [rootAfter] = witness.computeRootAndKey(Field(1));
      this.signersMapRoot.set(rootAfter);
      this.signersCount.set(currentCount.add(1));
    }
  
    @method async removeSigner(signerPubKey: PublicKey, witness: MerkleMapWitness) {

      const initialized = this.isInitialized.get();
      this.isInitialized.requireEquals(initialized);
      initialized.assertTrue();

      const currentRoot = this.signersMapRoot.get();
      this.signersMapRoot.requireEquals(currentRoot);
      const currentCount = this.signersCount.get();
      this.signersCount.requireEquals(currentCount);
  
      const signerHash = Poseidon.hash(signerPubKey.toFields());
      const [rootBefore, key] = witness.computeRootAndKey(Field(1));
      rootBefore.assertEquals(currentRoot);
      key.assertEquals(signerHash);
  
      const [rootAfter] = witness.computeRootAndKey(Field(0));
      this.signersMapRoot.set(rootAfter);
      this.signersCount.set(currentCount.sub(1));
  
      this.threshold.requireEquals(this.threshold.get());
      const currentThreshold = this.threshold.get();
      const signerCount = this.signersCount.get();
      currentThreshold.assertLessThanOrEqual(signerCount);
    }
  
    @method async setThreshold(newThreshold: UInt64) {
      const initialized = this.isInitialized.get();
      this.isInitialized.requireEquals(initialized);
      initialized.assertTrue();

      const currentCount = this.signersCount.get();
      this.signersCount.requireEquals(currentCount);
  
      newThreshold.assertLessThanOrEqual(currentCount);
      newThreshold.assertGreaterThan(UInt64.from(0));
  
      this.threshold.set(newThreshold);
    }
  
    @method async interact(
      rootUpdate: AccountUpdateDescr, 
      signature: Signature, 
      signerPubKey: PublicKey
    ) {

      const initialized = this.isInitialized.get();
      this.isInitialized.requireEquals(initialized);
      initialized.assertTrue();

      const currentNonce = this.nonce.get();
      this.nonce.requireEquals(currentNonce);
      
      const currentThreshold = this.threshold.get();
      this.threshold.requireEquals(currentThreshold);


      // TODO: 
      // this.verifySignature(signature, signerPubKey, currentNonce);
      // TODO: mark pubkey as approved
      // TODO: check if threshold is reached
      // TODO: if so, execute the interaction
  
      // this.verifySignatures(signatures, signerPubKeys, currentNonce);
  
      // rootUpdate.apply(this.self);
      
      // this.nonce.set(currentNonce.add(1));
    }
  
    verifySignature(signature: Signature, signerPubKey: PublicKey, nonce: Field) {
      // Verify the signature
      signature.verify(signerPubKey, [nonce]).assertTrue();
      
      // Verify that the signer is in the signers map
      const signerHash = Poseidon.hash(signerPubKey.toFields());
      const witness = new MerkleMap().getWitness(signerHash);
      const [root] = witness.computeRootAndKey(Field(1));
      root.assertEquals(this.signersMapRoot.get());
    }
  }