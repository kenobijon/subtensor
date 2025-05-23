// Script to enable the Alpha precompile using sudo
const { ethers } = require('ethers');

// This is a test-only private key - never use in production
const TEST_PRIVATE_KEY = "afaaeb4038434440b60cc993215f25144f6f86c82e70fda66d4b6b951cfd9c3c";

// AdminUtils precompile address
const ADMIN_UTILS_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000813"; // 2051 hex

// Define AdminUtils precompile ABI
const ADMIN_UTILS_ABI = [
  "function sudoToggleEvmPrecompile(uint8 precompileId, bool enabled) payable returns ()"
];

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

    // Enable the Alpha precompile with higher gas
    console.log("Enabling Alpha precompile...");
    const tx = await adminUtils.sudoToggleEvmPrecompile(
      PrecompileEnum.Alpha,
      true,
      {
        gasLimit: 1000000,
        gasPrice: ethers.parseUnits("20", "gwei")
      }
    );
    console.log("Transaction sent:", tx.hash);

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction confirmed:", receipt);

    console.log("Alpha precompile is now enabled!");

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
