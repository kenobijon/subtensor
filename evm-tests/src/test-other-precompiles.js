// Script to test other Bittensor precompiles
const { ethers } = require('ethers');

async function main() {
  try {
    // Connect to the local node
    const provider = new ethers.JsonRpcProvider('https://test.chain.opentensor.ai'); // change this to default testnet endpoint
    console.log("Connected to provider");

    // Define precompile addresses
    const BALANCE_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000801";
    const STAKING_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000802";
    const SUBNET_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000803";
    const ADMIN_UTILS_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000813";

    // Define simple ABIs for testing
    const BALANCE_ABI = [
      "function balanceOf(address account) view returns (uint256)",
      "function transfer(address to, uint256 amount) returns (bool)"
    ];

    const STAKING_ABI = [
      "function getColdkey(address hotkey) view returns (address)",
      "function getHotkeys(address coldkey) view returns (address[])",
      "function getStake(address coldkey, address hotkey) view returns (uint256)"
    ];

    const SUBNET_ABI = [
      "function getNumberOfSubnets() view returns (uint16)",
      "function getSubnetInfo(uint16 netuid) view returns (tuple(uint16 netuid, address owner, string name, bool emission_enabled, bool incentive_enabled))"
    ];

    // Create contract instances
    const balanceContract = new ethers.Contract(
      BALANCE_PRECOMPILE_ADDRESS,
      BALANCE_ABI,
      provider
    );

    const stakingContract = new ethers.Contract(
      STAKING_PRECOMPILE_ADDRESS,
      STAKING_ABI,
      provider
    );

    const subnetContract = new ethers.Contract(
      SUBNET_PRECOMPILE_ADDRESS,
      SUBNET_ABI,
      provider
    );

    // Test wallet - our test account
    const TEST_PRIVATE_KEY = "afaaeb4038434440b60cc993215f25144f6f86c82e70fda66d4b6b951cfd9c3c";
    const wallet = new ethers.Wallet(TEST_PRIVATE_KEY, provider);
    console.log(`Test wallet address: ${wallet.address}`);

    // Test Balance precompile
    console.log("\nTesting Balance precompile:");
    try {
      const balance = await balanceContract.balanceOf(wallet.address);
      console.log(`Balance of ${wallet.address}: ${ethers.formatEther(balance)} TAO`);
    } catch (error) {
      console.log("Error testing Balance precompile:", error.reason || error.message);
    }

    // Test Staking precompile
    console.log("\nTesting Staking precompile:");
    try {
      const coldkey = await stakingContract.getColdkey(wallet.address);
      console.log(`Coldkey for ${wallet.address}: ${coldkey}`);
    } catch (error) {
      console.log("Error testing Staking precompile:", error.reason || error.message);
    }

    // Test Subnet precompile
    console.log("\nTesting Subnet precompile:");
    try {
      const numberOfSubnets = await subnetContract.getNumberOfSubnets();
      console.log(`Number of subnets: ${numberOfSubnets}`);

      if (numberOfSubnets > 0) {
        try {
          const subnetInfo = await subnetContract.getSubnetInfo(0);
          console.log(`Subnet 0 info:`, subnetInfo);
        } catch (error) {
          console.log("Error getting subnet info:", error.reason || error.message);
        }
      }
    } catch (error) {
      console.log("Error testing Subnet precompile:", error.reason || error.message);
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
