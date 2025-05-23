// Script to directly test the AlphaPrecompile without admin utils
const { ethers } = require('ethers');

// AlphaPrecompile address at INDEX 2054
const ALPHA_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000806";

// Define test function signatures manually - all permutations we could try
const TEST_SIGNATURES = [
  // With parameter names
  "function getAlphaPrice(uint16 netuid) view returns (uint256)",
  // Without parameter names
  "function getAlphaPrice(uint16) view returns (uint256)",
  // With uint256 instead of uint16
  "function getAlphaPrice(uint256) view returns (uint256)",
];

async function main() {
  try {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:9944/');
    console.log("Connected to provider, testing network:", await provider.getNetwork());

    // Test manual eth_call to see what's happening at the lower level
    console.log("\nTesting direct eth_call:");
    try {
      // Function selector for getAlphaPrice(uint16)
      const functionSelector = "0x69e38bc3";
      // Param: netuid = 0 (padded to 32 bytes)
      const paddedParam = "0000000000000000000000000000000000000000000000000000000000000000";
      const calldata = functionSelector + paddedParam;

      console.log("Calldata:", calldata);

      const result = await provider.call({
        to: ALPHA_PRECOMPILE_ADDRESS,
        data: calldata
      });

      console.log("Result:", result);
    } catch (error) {
      console.log("Error with direct eth_call:", error.message);
    }

    // Try with different function signatures
    for (const signature of TEST_SIGNATURES) {
      console.log(`\nTesting with signature: ${signature}`);
      try {
        // Create different interface versions
        const iface = new ethers.Interface([signature]);
        const calldata = iface.encodeFunctionData("getAlphaPrice", [0]);

        console.log("Calldata:", calldata);

        // Try to call function
        const result = await provider.call({
          to: ALPHA_PRECOMPILE_ADDRESS,
          data: calldata
        });

        console.log("Result:", result);
        if (result && result !== '0x') {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], result);
          console.log("Decoded:", decoded.toString());
        }
      } catch (error) {
        console.log("Error:", error.message);
      }
    }

    console.log("\nChecking if precompile is registered (should have empty code):");
    const code = await provider.getCode(ALPHA_PRECOMPILE_ADDRESS);
    console.log("Code at address:", code);

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
