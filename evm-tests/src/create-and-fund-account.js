// Script to create and fund a test account
const { ethers } = require('ethers');
const fs = require('fs');

// This is a test-only private key - never use in production
const TEST_PRIVATE_KEY = "afaaeb4038434440b60cc993215f25144f6f86c82e70fda66d4b6b951cfd9c3c";

async function main() {
  try {
    // Connect to the local node
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:9944/');
    console.log("Connected to provider, testing network:", await provider.getNetwork());

    // Create a wallet with the test private key
    const wallet = new ethers.Wallet(TEST_PRIVATE_KEY, provider);
    console.log("Test wallet address:", wallet.address);

    // Import the account to the node
    try {
      await provider.send('personal_importRawKey', [
        TEST_PRIVATE_KEY,
        'password'
      ]);
      console.log("Account imported successfully");
    } catch (error) {
      // Account might already exist
      console.log("Account import error (might already exist):", error.message);
    }

    // Unlock the account
    try {
      await provider.send('personal_unlockAccount', [
        wallet.address,
        'password',
        null // Unlock indefinitely
      ]);
      console.log("Account unlocked successfully");
    } catch (error) {
      console.log("Account unlock error:", error.message);
    }

    // Check if the account is in the accounts list
    const accounts = await provider.send('eth_accounts', []);
    console.log("Available accounts:", accounts);

    if (accounts.includes(wallet.address.toLowerCase())) {
      console.log("Test account is in the accounts list");
    } else {
      console.log("WARNING: Test account is not in the accounts list");
    }

    // Get the balance
    const balance = await provider.getBalance(wallet.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // If balance is zero, we need to mine some blocks to generate funds
    if (balance === 0n) {
      console.log("Balance is zero, mining some blocks to generate funds...");
      try {
        // Start mining
        await provider.send('evm_mine', [{ blocks: 10 }]);
        console.log("Mined 10 blocks");

        // Check balance again
        const newBalance = await provider.getBalance(wallet.address);
        console.log("New account balance:", ethers.formatEther(newBalance), "ETH");
      } catch (error) {
        console.log("Mining error:", error.message);
        console.log("You may need to manually fund this account");
      }
    }

    // Save the account information to a file
    fs.writeFileSync('test-account.json', JSON.stringify({
      address: wallet.address,
      privateKey: TEST_PRIVATE_KEY
    }, null, 2));

    console.log("Account information saved to test-account.json");
    console.log("Use this account for testing the contracts");

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
