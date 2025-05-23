// Script to test different function selectors with the Alpha precompile
const { ethers } = require('ethers');

async function main() {
  try {
    // Connect to the local node
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:9944/');
    console.log("Connected to provider:", await provider.getNetwork());

    // Alpha precompile address from the Solidity file
    const ALPHA_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000806";

    // Calculate function selectors manually
    const selectors = {
      // Calculate selectors using standard Solidity function signature hashing
      "getAlphaPrice(uint16)": ethers.id("getAlphaPrice(uint16)").slice(0, 10),
      "getMovingAlphaPrice(uint16)": ethers.id("getMovingAlphaPrice(uint16)").slice(0, 10),
      "getTaoInPool(uint16)": ethers.id("getTaoInPool(uint16)").slice(0, 10),
      "getAlphaInPool(uint16)": ethers.id("getAlphaInPool(uint16)").slice(0, 10),
      "getAlphaOutPool(uint16)": ethers.id("getAlphaOutPool(uint16)").slice(0, 10),
      "getAlphaIssuance(uint16)": ethers.id("getAlphaIssuance(uint16)").slice(0, 10),
      "getTaoWeight()": ethers.id("getTaoWeight()").slice(0, 10),
      "getRootNetuid()": ethers.id("getRootNetuid()").slice(0, 10),

      // Try with different parameter types
      "getAlphaPrice(uint256)": ethers.id("getAlphaPrice(uint256)").slice(0, 10),
      "getAlphaPrice(uint32)": ethers.id("getAlphaPrice(uint32)").slice(0, 10),
      "getAlphaPrice(uint8)": ethers.id("getAlphaPrice(uint8)").slice(0, 10),
    };

    console.log("Function Selectors:");
    Object.entries(selectors).forEach(([name, selector]) => {
      console.log(`${name}: ${selector}`);
    });

    // Test each selector directly using eth_call
    console.log("\nTesting direct eth_call with selectors:");
    for (const [name, selector] of Object.entries(selectors)) {
      try {
        console.log(`\nTesting ${name} with selector ${selector}`);

        // Create calldata
        let calldata = selector;

        // For functions with parameters, append a netuid=0 parameter (padded to 32 bytes)
        if (name.includes("(uint")) {
          calldata += "0000000000000000000000000000000000000000000000000000000000000000";
        }

        console.log(`Calldata: ${calldata}`);

        // Make the direct eth_call
        const result = await provider.call({
          to: ALPHA_PRECOMPILE_ADDRESS,
          data: calldata
        });

        console.log(`Result: ${result}`);

        // If successful, try to decode the result
        if (result && result !== '0x') {
          // For uint256 returns
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], result);
          console.log(`Decoded: ${decoded.toString()}`);
        }
      } catch (error) {
        console.log(`Error with ${name}: ${error.reason || error.message}`);
      }
    }

    // Create a minimal ABI for testing
    const testAbi = [
      "function getAlphaPrice(uint16 netuid) view returns (uint256)",
      "function getRootNetuid() view returns (uint16)"
    ];

    const alphaContract = new ethers.Contract(
      ALPHA_PRECOMPILE_ADDRESS,
      testAbi,
      provider
    );

    // Test contract calls as well
    console.log("\nTesting contract interface calls:");
    try {
      const alphaPrice = await alphaContract.getAlphaPrice(0);
      console.log(`getAlphaPrice(0): ${alphaPrice}`);
    } catch (error) {
      console.log(`Error with getAlphaPrice: ${error.reason || error.message}`);
    }

    try {
      const rootNetuid = await alphaContract.getRootNetuid();
      console.log(`getRootNetuid(): ${rootNetuid}`);
    } catch (error) {
      console.log(`Error with getRootNetuid: ${error.reason || error.message}`);
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
