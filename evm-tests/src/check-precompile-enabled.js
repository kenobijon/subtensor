// Script to check if the Alpha precompile is enabled in storage
const { ethers } = require('ethers');
const { ApiPromise, WsProvider } = require('@polkadot/api');
const { TypeRegistry } = require('@polkadot/types');

// PrecompileEnum values from pallets/admin-utils/src/lib.rs
// BalanceTransfer = 0, Staking = 1, Subnet = 2, Metagraph = 3, Neuron = 4, Alpha = 5
const PrecompileEnum = {
  BalanceTransfer: 0,
  Staking: 1,
  Subnet: 2,
  Metagraph: 3,
  Neuron: 4,
  Alpha: 5
};

async function main() {
  try {
    // Connect to the node using Polkadot.js
    console.log("Connecting to Substrate node...");
    const wsProvider = new WsProvider('ws://127.0.0.1:9944');
    const api = await ApiPromise.create({ provider: wsProvider });

    // Check if the api is connected
    console.log(`Connected to chain: ${(await api.rpc.system.chain()).toString()}`);
    console.log(`Node name: ${(await api.rpc.system.name()).toString()}`);
    console.log(`Node version: ${(await api.rpc.system.version()).toString()}`);

    // Check the storage for all precompile enabled statuses
    console.log("\nChecking PrecompileEnable storage...");

    // Create registry and types
    const registry = new TypeRegistry();
    registry.register({
      PrecompileEnum: {
        _enum: ['BalanceTransfer', 'Staking', 'Subnet', 'Metagraph', 'Neuron', 'Alpha']
      }
    });

    // Check each precompile
    for (const [name, value] of Object.entries(PrecompileEnum)) {
      try {
        // Create the enum value
        const enumValue = registry.createType('PrecompileEnum', value);

        // Query the storage
        const enabled = await api.query.adminUtils.precompileEnable(enumValue);
        console.log(`${name} precompile enabled: ${enabled.toString()}`);
      } catch (error) {
        console.log(`Error checking ${name} precompile: ${error.message}`);
      }
    }

    // Disconnect from the node
    await api.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
