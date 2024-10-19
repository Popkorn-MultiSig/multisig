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
  
  export class Popkorn3 extends SmartContract {
    @state(Field) signersMapRoot = State<Field>();
    @state(UInt64) signersCount = State<UInt64>();
    @state(UInt64) signedAmount = State<UInt64>();
    @state(UInt64) threshold = State<UInt64>();
    @state(Field) nonce = State<Field>();
    @state(Bool) isInitialized = State<Bool>();
    @state(Field) pendingTransactionHash = State<Field>();
  
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
      const initialized = await this.isInitialized.get();
      this.isInitialized.requireEquals(initialized);
      initialized.assertFalse();
  
      threshold.assertGreaterThan(UInt64.from(0));
      threshold.assertLessThanOrEqual(signersCount);
  
      await this.signersMapRoot.set(signersMapRoot);
      await this.signersCount.set(signersCount);
      await this.threshold.set(threshold);
      await this.nonce.set(Field(0));
      await this.signedAmount.set(UInt64.from(0));
      await this.isInitialized.set(Bool(true));
    }
  
    @method async addSigner(signerPubKey: PublicKey, witness: MerkleMapWitness) {
      const initialized = await this.isInitialized.get();
      this.isInitialized.requireEquals(initialized);
      initialized.assertTrue();
  
      const currentRoot = await this.signersMapRoot.get();
      this.signersMapRoot.requireEquals(currentRoot);
      const currentCount = await this.signersCount.get();
      this.signersCount.requireEquals(currentCount);
  
      const signerHash = Poseidon.hash(signerPubKey.toFields());
      const [rootBefore, key] = witness.computeRootAndKeyV2(Field(0));
      rootBefore.assertEquals(currentRoot);
      key.assertEquals(signerHash);
  
      const [rootAfter] = witness.computeRootAndKeyV2(Field(1));
      await this.signersMapRoot.set(rootAfter);
      await this.signersCount.set(currentCount.add(1));
    }
  
    @method async removeSigner(signerPubKey: PublicKey, witness: MerkleMapWitness) {
      const initialized = await this.isInitialized.get();
      this.isInitialized.requireEquals(initialized);
      initialized.assertTrue();
  
      const currentRoot = await this.signersMapRoot.get();
      this.signersMapRoot.requireEquals(currentRoot);
      const currentCount = await this.signersCount.get();
      this.signersCount.requireEquals(currentCount);
  
      const signerHash = Poseidon.hash(signerPubKey.toFields());
      const [rootBefore, key] = witness.computeRootAndKeyV2(Field(1));
      rootBefore.assertEquals(currentRoot);
      key.assertEquals(signerHash);
  
      const [rootAfter] = witness.computeRootAndKeyV2(Field(0));
      await this.signersMapRoot.set(rootAfter);
      await this.signersCount.set(currentCount.sub(1));
  
      const currentThreshold = await this.threshold.get();
      this.threshold.requireEquals(currentThreshold);
      currentThreshold.assertLessThanOrEqual(currentCount);
    }
  
    @method async setThreshold(newThreshold: UInt64) {
      const initialized = await this.isInitialized.get();
      this.isInitialized.requireEquals(initialized);
      initialized.assertTrue();
  
      const currentCount = await this.signersCount.get();
      this.signersCount.requireEquals(currentCount);
  
      newThreshold.assertLessThanOrEqual(currentCount);
      newThreshold.assertGreaterThan(UInt64.from(0));
  
      const currentThreshold = await this.threshold.get();
      this.threshold.requireEquals(currentThreshold);
  
      await this.threshold.set(newThreshold);
    }
  
    @method async sign(
      rootUpdate: AccountUpdateDescr,
      signature: Signature,
      signerPubKey: PublicKey,
      witness: MerkleMapWitness
    ) {
      const initialized = await this.isInitialized.get();
      this.isInitialized.requireEquals(initialized);
      initialized.assertTrue();
  
      const currentNonce = await this.nonce.get();
      this.nonce.requireEquals(currentNonce);
      
      const threshold = await this.threshold.get();
      this.threshold.requireEquals(threshold);
  
      const signedAmount = await this.signedAmount.get();
      this.signedAmount.requireEquals(signedAmount);
  
      await this.verifySignerIsInMap(signerPubKey, witness);
  
      signature.verify(signerPubKey, [currentNonce, ...rootUpdate.balanceChange.toFields()]).assertTrue();
  
      await this.signedAmount.set(signedAmount.add(1));
      await this.nonce.set(currentNonce.add(1));
  
      const transactionHash = Poseidon.hash(rootUpdate.balanceChange.toFields());
      await this.pendingTransactionHash.set(transactionHash);
    }
  
    @method async executeTransaction(rootUpdate: AccountUpdateDescr) {
      const initialized = await this.isInitialized.get();
      this.isInitialized.requireEquals(initialized);
      initialized.assertTrue();
  
      const threshold = await this.threshold.get();
      this.threshold.requireEquals(threshold);
  
      const signedAmount = await this.signedAmount.get();
      this.signedAmount.requireEquals(signedAmount);
  
      signedAmount.assertGreaterThanOrEqual(threshold);
  
      const pendingTransactionHash = await this.pendingTransactionHash.get();
      this.pendingTransactionHash.requireEquals(pendingTransactionHash);
  
      const calculatedHash = Poseidon.hash(rootUpdate.balanceChange.toFields());
      calculatedHash.assertEquals(pendingTransactionHash);
  
      rootUpdate.apply(this.self);
  
      // Reset state after execution
      await this.signedAmount.set(UInt64.from(0));
      await this.pendingTransactionHash.set(Field(0));
    }
  
    @method async verifySignerIsInMap(signerPubKey: PublicKey, witness: MerkleMapWitness) {
      const currentRoot = await this.signersMapRoot.get();
      this.signersMapRoot.requireEquals(currentRoot);
  
      const signerHash = Poseidon.hash(signerPubKey.toFields());
      const [rootBefore, key] = witness.computeRootAndKeyV2(Field(1));
      rootBefore.assertEquals(currentRoot);
      key.assertEquals(signerHash);
    }
  }
  