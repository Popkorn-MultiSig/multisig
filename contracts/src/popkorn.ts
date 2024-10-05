import {
  SmartContract,
  state,
  State,
  method,
  PublicKey,
  UInt64,
  Struct,
  MerkleTree,
  Field,
  MerkleWitness,
  AccountUpdate,
  AccountUpdateTree,
  Bool,
  Permissions,
  Provable,
  Int64,
} from 'o1js';

const treeHeight = 8; 
export class MerkleWitness8 extends MerkleWitness(treeHeight) {}

type Option<T> = { isSome: Bool; value: T };

function Option<T>(Value: Provable<T>): Provable<Option<T>> {
  return class Option extends Struct({
    isSome: Bool,
    value: Value,
  }) {};
}

function readOption<T>(Value: Provable<T>, option: Option<T>, defaultValue: T): T {
  return Provable.if(option.isSome, Value, option.value, defaultValue);
}

class AccountUpdateDescr extends Struct({
  balanceChange: Option(Int64),
}) {
  apply(accountUpdate: AccountUpdate) {
    accountUpdate.balanceChange = readOption(Int64, this.balanceChange, accountUpdate.balanceChange);
  }
}

export class Popkorn extends SmartContract {
  @state(Field) merkleRoot = State<Field>();
  @state(UInt64) signersCount = State<UInt64>();
  @state(UInt64) threshold = State<UInt64>();

  init() {
    super.init();
    this.account.permissions.set({
      editState: Permissions.proof(),
      send: Permissions.proof(),
      receive: Permissions.none(),
      setDelegate: Permissions.proof(),
      setPermissions: Permissions.proof(),
      setVerificationKey: Permissions.VerificationKey.proofDuringCurrentVersion(),
      setZkappUri: Permissions.proof(),
      editActionState: Permissions.proof(),
      setTokenSymbol: Permissions.proof(),
      incrementNonce: Permissions.proof(),
      setVotingFor: Permissions.proof(),
      setTiming: Permissions.proof(),
      access: Permissions.none(),
    });
  }

  @method initializeContract(): Promise<void> {
    const emptyTree = new MerkleTree(treeHeight);
    this.merkleRoot.set(emptyTree.getRoot());
    this.signersCount.set(UInt64.from(0));
    this.threshold.set(UInt64.from(0));
    return Promise.resolve();
  }

  @method addSigner(publicKey: PublicKey, path: MerkleWitness8): Promise<void> {
    const currentRoot = this.merkleRoot.get();
    this.merkleRoot.requireEquals(currentRoot);

    const currentCount = this.signersCount.get();
    this.signersCount.requireEquals(currentCount);

    const emptyLeaf = Field(0);
    path.calculateRoot(emptyLeaf).assertEquals(currentRoot);

    const newRoot = path.calculateRoot(publicKey.toFields()[0]);
    this.merkleRoot.set(newRoot);
    this.signersCount.set(currentCount.add(1));
    return Promise.resolve();
  }

  @method setThreshold(newThreshold: UInt64): Promise<void> {
    const currentCount = this.signersCount.get();
    this.signersCount.requireEquals(currentCount);

    newThreshold.assertLessThanOrEqual(currentCount);
    newThreshold.assertGreaterThan(UInt64.from(0));

    this.threshold.set(newThreshold);
    return Promise.resolve();
  }

  @method interact(rootUpdate: AccountUpdateDescr, subtree: AccountUpdateTree): Promise<void> {
    rootUpdate.apply(this.self);
    this.approve(subtree);
    return Promise.resolve();
  }

  //@method proposeTransaction(transactionHash: Field) 
    // store the proposed transaction hash?
    // emit an event with the transaction details

  //@method approveTransaction
    // transactionHash: Field, 
    // signerPubKey: PublicKey, 
    // signature: Signature,
    // merkleWitness: MerkleWitness8
    // verify the signer is in the Merkle tree
    // verify the signature and record the approval
    // if approvals reach threshold, execute the transaction

  //@method executeTransaction(transactionHash: Field)
    // check if transaction has enough approvals
    // execute the transaction and update state

  // proper signature verification in the approveTransaction method
  
}