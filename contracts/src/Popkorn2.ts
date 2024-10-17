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
    @state(UInt64) signedAmount = State<UInt64>();
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
      this.signedAmount.set(UInt64.from(0));
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
  
    // Signs a transaction and updates the signed amount
    @method async sign(
      rootUpdate: AccountUpdateDescr, 
      signature: Signature, 
      signerPubKey: PublicKey
    ) {

      const initialized = this.isInitialized.get();
      this.isInitialized.requireEquals(initialized);
      initialized.assertTrue();

      const currentNonce = this.nonce.get();
      this.nonce.requireEquals(currentNonce);
      const threshold = this.threshold.get();
      this.threshold.requireEquals(threshold);
      const signedAmount = this.signedAmount.get();
      this.signedAmount.requireEquals(signedAmount);

      this.verifySignerIsInMap(signerPubKey);
      signature.verify(signerPubKey, [currentNonce]).assertTrue();

      this.signedAmount.set(signedAmount.add(1));
    }

    // Checks if the threshold is reached and executes the transaction
    executeTransaction() {
      const threshold = this.threshold.get();
      this.threshold.requireEquals(threshold);
      const signedAmount = this.signedAmount.get();
      this.signedAmount.requireEquals(signedAmount);
      this.signedAmount.requireEquals(threshold);

      // TODO: execute transaction
          
    }
  
    verifySignerIsInMap(signerPubKey: PublicKey) {
      const signerHash = Poseidon.hash(signerPubKey.toFields());
      const map = new MerkleMap();
      // const witness = map.getWitness(signerHash);
      // const [root] = witness.computeRootAndKey(Field(1));
      // root.assertEquals(this.signersMapRoot.get());
    }
  }