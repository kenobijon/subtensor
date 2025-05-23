// Alpha Precompile Test Script using ethers.js
const { ethers } = require('ethers');
require('dotenv').config();

// AlphaPrecompile address and ABI
const ALPHA_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000806";
const ALPHA_ABI = [
  // View functions - with explicit function signatures to match the Rust implementation
  "function getAlphaPrice(uint16) view returns (uint256)",
  "function getMovingAlphaPrice(uint16) view returns (uint256)",
  "function getTaoInPool(uint16) view returns (uint64)",
  "function getAlphaInPool(uint16) view returns (uint64)",
  "function getAlphaOutPool(uint16) view returns (uint64)",
  "function getAlphaIssuance(uint16) view returns (uint64)",
  "function getTaoWeight() view returns (uint256)",
  "function simSwapTaoForAlpha(uint16, uint64) view returns (uint256)",
  "function simSwapAlphaForTao(uint16, uint64) view returns (uint256)",
  "function getSubnetMechanism(uint16) view returns (uint16)",
  "function getMinimumPoolLiquidity() view returns (uint256)",
  "function getRootNetuid() view returns (uint16)",
  "function getEMAPriceHalvingBlocks(uint16) view returns (uint64)",
  "function getSubnetVolume(uint16) view returns (uint256)",
];

async function main() {
  // Connect to your local Bittensor node - use the HTTP endpoint for EVM
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:9944/');

  console.log("Connected to provider:", await provider.getNetwork());

  // Create contract instance
  const alphaContract = new ethers.Contract(
    ALPHA_PRECOMPILE_ADDRESS,
    ALPHA_ABI,
    provider
  );

  // Default subnet to query - root subnet (0)
  const netuid = 0;

  console.log("=== Alpha Precompile Testing ===");

  try {
    // Try a simple call first to see if the precompile is accessible
    console.log("Testing getAlphaPrice for subnet", netuid);
    const alphaPrice = await alphaContract.getAlphaPrice(netuid);
    console.log(`Alpha Price: ${ethers.formatUnits(alphaPrice, 0)}`);

    // If first call succeeds, try more calls
    console.log(`\n=== Subnet ${netuid} Data ===`);

    try {
      const movingAlphaPrice = await alphaContract.getMovingAlphaPrice(netuid);
      console.log(`Moving Alpha Price: ${ethers.formatUnits(movingAlphaPrice, 0)}`);
    } catch (error) {
      console.log("Error getting moving alpha price:", error.shortMessage || error.message);
    }

    try {
      const taoInPool = await alphaContract.getTaoInPool(netuid);
      console.log(`TAO in Pool: ${ethers.formatUnits(taoInPool, 0)}`);
    } catch (error) {
      console.log("Error getting TAO in pool:", error.shortMessage || error.message);
    }

    try {
      const alphaInPool = await alphaContract.getAlphaInPool(netuid);
      console.log(`Alpha in Pool: ${ethers.formatUnits(alphaInPool, 0)}`);
    } catch (error) {
      console.log("Error getting alpha in pool:", error.shortMessage || error.message);
    }

    try {
      const alphaOutPool = await alphaContract.getAlphaOutPool(netuid);
      console.log(`Alpha out Pool: ${ethers.formatUnits(alphaOutPool, 0)}`);
    } catch (error) {
      console.log("Error getting alpha out pool:", error.shortMessage || error.message);
    }

    try {
      const minPoolLiquidity = await alphaContract.getMinimumPoolLiquidity();
      console.log(`Minimum Pool Liquidity: ${ethers.formatUnits(minPoolLiquidity, 0)}`);
    } catch (error) {
      console.log("Error getting minimum pool liquidity:", error.shortMessage || error.message);
    }

    try {
      const rootNetuid = await alphaContract.getRootNetuid();
      console.log(`Root Netuid: ${rootNetuid}`);
    } catch (error) {
      console.log("Error getting root netuid:", error.shortMessage || error.message);
    }

  } catch (error) {
    console.error("Error interacting with Alpha Precompile:", error.shortMessage || error.message);
    console.error("Full error:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
