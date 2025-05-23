// Script to check available precompiles on the node
const { ethers } = require('ethers');

async function main() {
  try {
    // Connect to the local node
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:9944/');
    console.log("Connected to provider");

    // Check chain ID to verify EVM connection
    const chainId = await provider.send('eth_chainId', []);
    console.log("Chain ID:", parseInt(chainId, 16));

    // Check block number to verify node is producing blocks
    const blockNumber = await provider.getBlockNumber();
    console.log("Current Block Number:", blockNumber);

    // Get accounts to see if there's any pre-funded account
    const accounts = await provider.send('eth_accounts', []);
    console.log("Available Accounts:", accounts);

    // Try to call code at the AlphaPrecompile address
    const alphaPrecompileAddress = "0x0000000000000000000000000000000000000806";
    const code = await provider.getCode(alphaPrecompileAddress);
    console.log(`Code at Alpha Precompile Address (${alphaPrecompileAddress}):`, code);

    // Check if it's a precompile by verifying it has an empty bytecode but still exists
    if (code === "0x") {
      console.log("This is likely a precompile (empty bytecode is expected)");

      // Check balance to see if the address exists
      const balance = await provider.getBalance(alphaPrecompileAddress);
      console.log("Precompile Balance:", balance.toString());
    }

    // Try to check all precompiles in Bittensor (common precompiles usually start at 0x01 to 0x09)
    console.log("\nChecking common precompile addresses:");
    for (let i = 1; i <= 10; i++) {
      const address = `0x00000000000000000000000000000000000008${i < 10 ? '0' + i : i}`;
      const precompileCode = await provider.getCode(address);
      console.log(`Address ${address}: ${precompileCode === "0x" ? "Empty bytecode (potential precompile)" : "Has bytecode"}`);
    }

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
