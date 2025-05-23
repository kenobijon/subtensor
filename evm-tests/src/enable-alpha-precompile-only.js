// Script to enable only the Alpha precompile
const { ethers } = require('ethers');

// This is a test-only private key - never use in production
const TEST_PRIVATE_KEY = "afaaeb4038434440b60cc993215f25144f6f86c82e70fda66d4b6b951cfd9c3c";

// AdminUtils precompile address
const ADMIN_UTILS_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000813";

// Define AdminUtils precompile ABI
const ADMIN_UTILS_ABI = [
  "function sudoToggleEvmPrecompile(uint8 precompileId, bool enabled) payable returns ()"
];

// Alpha precompile ID = 5
const ALPHA_PRECOMPILE_ID = 5;

async function main() {
  try {
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:9944/');
    console.log("Connected to provider");

    // Use our test account
    console.log("Using test account with private key");
    const wallet = new ethers.Wallet(TEST_PRIVATE_KEY, provider);
    console.log(`Test wallet address: ${wallet.address}`);

    // Check the wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`Wallet balance: ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n) {
      console.log("Wallet has no balance. Please fund it before continuing.");
      return;
    }

    // Create a contract instance connected to the wallet
    const adminUtils = new ethers.Contract(
      ADMIN_UTILS_PRECOMPILE_ADDRESS,
      ADMIN_UTILS_ABI,
      wallet
    );

    // Test AdminUtils precompile first
    console.log("Testing direct call to AdminUtils precompile...");
    try {
      // Try to call the precompile directly with callStatic to check if it's accessible
      const result = await adminUtils.callStatic.sudoToggleEvmPrecompile(
        ALPHA_PRECOMPILE_ID,
        true,
        {
          gasLimit: 1000000
        }
      );
      console.log("AdminUtils precompile is accessible!");
    } catch (error) {
      console.log("Error calling AdminUtils precompile:", error.reason || error.message);
    }

    // Enable Alpha precompile
    console.log(`Enabling Alpha precompile (ID: ${ALPHA_PRECOMPILE_ID})...`);
    try {
      // Send with higher gas settings
      const tx = await adminUtils.sudoToggleEvmPrecompile(
        ALPHA_PRECOMPILE_ID,
        true,
        {
          gasLimit: 1000000,
          gasPrice: ethers.parseUnits("20", "gwei")
        }
      );
      console.log(`Transaction sent: ${tx.hash}`);

      // Wait for the transaction to be mined
      const receipt = await tx.wait();
      console.log(`Transaction confirmed: ${receipt.hash}`);
      console.log(`Alpha precompile is now enabled!`);
    } catch (error) {
      console.error(`Error enabling Alpha precompile:`, error.message);
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
