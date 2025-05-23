// Script to list all available precompiles in the Bittensor EVM
const { ethers } = require('ethers');

// Standard Ethereum precompiles
const STANDARD_PRECOMPILES = [
  { address: "0x0000000000000000000000000000000000000001", name: "ecRecover" },
  { address: "0x0000000000000000000000000000000000000002", name: "sha256" },
  { address: "0x0000000000000000000000000000000000000003", name: "ripemd160" },
  { address: "0x0000000000000000000000000000000000000004", name: "identity" },
  { address: "0x0000000000000000000000000000000000000005", name: "modexp" },
  { address: "0x0000000000000000000000000000000000000006", name: "ecAdd" },
  { address: "0x0000000000000000000000000000000000000007", name: "ecMul" },
  { address: "0x0000000000000000000000000000000000000008", name: "ecPairing" },
  { address: "0x0000000000000000000000000000000000000009", name: "blake2f" }
];

// Bittensor specific precompiles based on the code
const BITTENSOR_PRECOMPILES = [
  // Common precompiles from subtensor
  { address: "0x0000000000000000000000000000000000000400", name: "Ed25519Verify", index: 1024 },
  { address: "0x0000000000000000000000000000000000000401", name: "Unknown1025", index: 1025 },

  // Bittensor precompiles
  { address: "0x0000000000000000000000000000000000000801", name: "BalanceTransfer", index: 2049 },
  { address: "0x0000000000000000000000000000000000000802", name: "Staking", index: 2050 },
  { address: "0x0000000000000000000000000000000000000803", name: "Subnet", index: 2051 },
  { address: "0x0000000000000000000000000000000000000804", name: "Metagraph", index: 2052 },
  { address: "0x0000000000000000000000000000000000000805", name: "Neuron", index: 2053 },
  { address: "0x0000000000000000000000000000000000000806", name: "Alpha", index: 2054 },
  { address: "0x0000000000000000000000000000000000008013", name: "AdminUtils", index: "Unknown" }
];

async function testPrecompile(provider, precompile) {
  console.log(`\nTesting precompile ${precompile.name} at ${precompile.address}`);

  // Check if there's bytecode (should be empty for precompiles)
  const code = await provider.getCode(precompile.address);
  console.log(`Code at address: ${code === '0x' ? 'Empty (expected for precompiles)' : code}`);

  // Try some test calls based on precompile type
  try {
    let result;

    if (precompile.name === "sha256") {
      // Test the SHA256 precompile with a simple input
      const data = "0x0000000000000000000000000000000000000000000000000000000000000020" + // Offset
                  "0000000000000000000000000000000000000000000000000000000000000003" +  // Length (3 bytes)
                  "616263" + // "abc" in hex
                  "0000000000000000000000000000000000000000000000000000000000000000";   // Padding

      result = await provider.call({
        to: precompile.address,
        data: data
      });

      console.log(`  SHA256 Test Call Result: ${result}`);
    }
    else if (precompile.name === "Alpha") {
      // Try different function selectors for Alpha precompile
      for (const selector of ["0x69e38bc3", "0xa86b1037", "0x2d9bfc71"]) {
        try {
          const param = "0000000000000000000000000000000000000000000000000000000000000000"; // netuid = 0
          const calldata = selector + param;

          result = await provider.call({
            to: precompile.address,
            data: calldata
          });

          console.log(`  Selector ${selector} Result: ${result}`);
        } catch (error) {
          console.log(`  Selector ${selector} Error: ${error.shortMessage || error.message}`);
        }
      }
    }
    else if (precompile.name === "BalanceTransfer") {
      // Just check it exists, no call
      console.log("  Balance Transfer precompile found");
    }
    else {
      console.log("  No test implemented for this precompile");
    }
  } catch (error) {
    console.log(`  Error testing precompile: ${error.shortMessage || error.message}`);
  }
}

async function main() {
  try {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:9944/');
    console.log("Connected to provider, testing network:", await provider.getNetwork());

    // Network metadata
    const chainId = await provider.send('eth_chainId', []);
    console.log("Chain ID:", parseInt(chainId, 16));

    // Get latest block info
    const blockNumber = await provider.getBlockNumber();
    console.log("Current Block Number:", blockNumber);

    // Test all standard precompiles
    console.log("\n=== Testing Standard Ethereum Precompiles ===");
    for (const precompile of STANDARD_PRECOMPILES) {
      await testPrecompile(provider, precompile);
    }

    // Test Bittensor precompiles
    console.log("\n=== Testing Bittensor Precompiles ===");
    for (const precompile of BITTENSOR_PRECOMPILES) {
      await testPrecompile(provider, precompile);
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
