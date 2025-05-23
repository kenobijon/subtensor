// Script to test function selectors directly on Alpha precompile
const { ethers } = require('ethers');

async function main() {
  try {
    // Connect to the local node
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:9944/');
    console.log("Connected to provider");

    // Define the Alpha precompile address
    const ALPHA_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000806";

    // Define function selectors to test - these are the first 4 bytes of the keccak256 hash of the function signature
    // For reference, you can calculate these using ethers.utils.id("functionName(paramTypes)").slice(0, 10)
    const selectors = {
      // Calculate selectors
      "getAlphaPrice(uint16)": ethers.id("getAlphaPrice(uint16)").slice(0, 10),
      "getMovingAlphaPrice(uint16)": ethers.id("getMovingAlphaPrice(uint16)").slice(0, 10),
      "getTaoInPool(uint16)": ethers.id("getTaoInPool(uint16)").slice(0, 10),
      "getAlphaInPool(uint16)": ethers.id("getAlphaInPool(uint16)").slice(0, 10),
      "getAlphaOutPool(uint16)": ethers.id("getAlphaOutPool(uint16)").slice(0, 10),
      "getTaoWeight()": ethers.id("getTaoWeight()").slice(0, 10),
      "getMinimumPoolLiquidity()": ethers.id("getMinimumPoolLiquidity()").slice(0, 10),
      "getRootNetuid()": ethers.id("getRootNetuid()").slice(0, 10),
    };

    // Log all selectors for reference
    console.log("Function Selectors:");
    Object.entries(selectors).forEach(([name, selector]) => {
      console.log(`${name}: ${selector}`);
    });

    // Test each selector
    console.log("\nTesting selectors:");
    for (const [name, selector] of Object.entries(selectors)) {
      try {
        // For functions with uint16 parameter, add a parameter value (0 for netuid)
        let calldata = selector;
        if (name.includes("uint16")) {
          // Append a uint16 parameter (netuid = 0)
          calldata += "0000000000000000000000000000000000000000000000000000000000000000";
        }

        console.log(`\nTesting ${name} with selector ${selector}`);
        console.log(`Calldata: ${calldata}`);

        // Call the function using eth_call
        const result = await provider.call({
          to: ALPHA_PRECOMPILE_ADDRESS,
          data: calldata
        });

        console.log(`Result: ${result}`);

        // Try to parse the result if successful
        if (result && result !== '0x') {
          // For uint256 results
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], result);
          console.log(`Decoded: ${decoded}`);
        }
      } catch (error) {
        console.log(`Error calling ${name}: ${error.shortMessage || error.message}`);
      }
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
