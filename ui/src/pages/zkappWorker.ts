import { Mina, PublicKey, fetchAccount, Field, UInt64 } from 'o1js';

import * as Comlink from "comlink";
import type { Popkorn } from '../../../contracts/build/src/Popkorn';

type Transaction = Awaited<ReturnType<typeof Mina.transaction>>;

const state = {
  PopkornInstance: null as null | typeof Popkorn,
  zkappInstance: null as null | Popkorn,
  transaction: null as null | Transaction,
};

export const api = {
  async setActiveInstanceToDevnet() {
    const Network = Mina.Network('https://api.minascan.io/node/devnet/v1/graphql');
    console.log('Devnet network instance configured');
    Mina.setActiveInstance(Network);
  },

  async loadContract() {
    const { Popkorn } = await import('../../../contracts/build/src/Popkorn.js');
    state.PopkornInstance = Popkorn;
  },

  async compileContract() {
    await state.PopkornInstance!.compile();
  },

  async fetchAccount(publicKey58: string) {
    const publicKey = PublicKey.fromBase58(publicKey58);
    return await fetchAccount({ publicKey });
  },

  async initZkappInstance(publicKey58: string) {
    try {
      const publicKey = PublicKey.fromBase58(publicKey58);
      
      if (!state.PopkornInstance) {
        throw new Error('Contract not loaded. Call loadContract first.');
      }

      // Fetch the account before initializing
      const response = await this.fetchAccount(publicKey58);
      console.log('Account fetch response:', response);

      // Create and init the zkapp instance
      state.zkappInstance = new state.PopkornInstance(publicKey);
      await state.zkappInstance.init();
      
      return true;
    } catch (error) {
      console.error('Error initializing zkapp instance:', error);
      throw error;
    }
  },

  async setupMultisig(
    signerMapRoot: Field, 
    signersCount: UInt64, 
    threshold: UInt64
  ) {
    if (!state.zkappInstance) {
      throw new Error('ZkApp instance not initialized');
    }

    try {

      console.log('trying avh');
      const transaction = await Mina.transaction(async () => {
        await state.zkappInstance!.setupMultisig(
          signerMapRoot,
          signersCount,
          threshold
        );
      });

      console.log('transaction', transaction);

      state.transaction = transaction;
      await transaction.prove();

      console.log('transaction', transaction);
      
      // Send the transaction
      const result = await transaction.send(); // todo signature?
      
      return {
        hash: result,
        isSuccess: true
      };
    } catch (error) {
      console.error('Error in setupMultisig:', error);
      throw error;
    }
  },


  async getContractState() {
    if (!state.zkappInstance) {
      throw new Error('ZkApp instance not initialized');
    }
    
    try {
      // Fetch the account again to ensure we have the latest state
      const publicKey = state.zkappInstance.address;
      await fetchAccount({ publicKey });

      return {
        isInitialized: await state.zkappInstance.isInitialized.get(),
        signersMapRoot: await state.zkappInstance.signersMapRoot.get(),
        signersCount: await state.zkappInstance.signersCount.get(),
        threshold: await state.zkappInstance.threshold.get(),
      };
    } catch (error) {
      console.error('Error getting contract state:', error);
      throw error;
    }
  },

  async proveUpdateTransaction() {
    await state.transaction!.prove();
  },
  async getTransactionJSON() {
    return state.transaction!.toJSON();
  },
};

// Expose the API to be used by the main thread
Comlink.expose(api);
