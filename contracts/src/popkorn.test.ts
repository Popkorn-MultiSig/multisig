import { AccountUpdate, Field, Mina, PrivateKey, PublicKey, UInt64, MerkleTree } from 'o1js';
import { Popkorn, MerkleWitness8 } from './popkorn';

let proofsEnabled = false;

describe('Popkorn', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Popkorn;

  beforeAll(async () => {
    if (proofsEnabled) await Popkorn.compile();
  });

  beforeEach(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    [deployerAccount, senderAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Popkorn(zkAppAddress);
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await txn.prove();
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('initializes the contract correctly', async () => {
    await localDeploy();
    
    // initialize contract
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.initializeContract();
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const merkleRoot = zkApp.merkleRoot.get();
    const signersCount = zkApp.signersCount.get();
    const threshold = zkApp.threshold.get();

    expect(merkleRoot).toEqual(new MerkleTree(8).getRoot());
    expect(signersCount).toEqual(UInt64.from(0));
    expect(threshold).toEqual(UInt64.from(0));
  });

  it('adds a signer and updates the Merkle root', async () => {
    await localDeploy();
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.initializeContract();
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // provide a valid witness for a tree of height 8 (8 siblings)
    const emptyLeaf = Field(0);
    const witness = new MerkleWitness8(Array.from({ length: 8 }, () => ({ isLeft: true, sibling: emptyLeaf })));

    const newSigner = PrivateKey.random().toPublicKey();
    
    // add a new signer
    const txn2 = await Mina.transaction(senderAccount, async () => {
      await zkApp.addSigner(newSigner, witness);
    });
    await txn2.prove();
    await txn2.sign([senderKey]).send();

    const newMerkleRoot = zkApp.merkleRoot.get();
    const newSignersCount = zkApp.signersCount.get();

    expect(newSignersCount).toEqual(UInt64.from(1));
    expect(newMerkleRoot).not.toEqual(emptyLeaf);
  });

  it('sets a threshold correctly after adding a signer', async () => {
    await localDeploy();
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.initializeContract();
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // add a signer
    const emptyLeaf = Field(0);
    const witness = new MerkleWitness8(Array.from({ length: 8 }, () => ({ isLeft: true, sibling: emptyLeaf })));

    const newSigner = PrivateKey.random().toPublicKey();
    const txn2 = await Mina.transaction(senderAccount, async () => {
      await zkApp.addSigner(newSigner, witness);
    });
    await txn2.prove();
    await txn2.sign([senderKey]).send();

    // set the threshold
    const txn3 = await Mina.transaction(senderAccount, async () => {
      await zkApp.setThreshold(UInt64.from(1));
    });
    await txn3.prove();
    await txn3.sign([senderKey]).send();

    const threshold = zkApp.threshold.get();
    expect(threshold).toEqual(UInt64.from(1));
  });
});