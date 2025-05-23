// Script to test Bittensor precompiles using the correct addresses from precompiles/src/solidity
const { ethers } = require('ethers');

async function main() {
  try {
    // Connect to the local node
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:9944/');
    console.log("Connected to provider:", await provider.getNetwork());

    // Define precompile addresses from the Solidity files
    const ALPHA_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000806";
    const STAKING_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000801";
    const STAKING_V2_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000805";
    const SUBNET_PRECOMPILE_ADDRESS = "0x0000000000000000000000000000000000000803";

    // Define ABIs based on the Solidity interfaces
    const ALPHA_ABI = [
      "function getAlphaPrice(uint16 netuid) view returns (uint256)",
      "function getMovingAlphaPrice(uint16 netuid) view returns (uint256)",
      "function getTaoInPool(uint16 netuid) view returns (uint64)",
      "function getAlphaInPool(uint16 netuid) view returns (uint64)",
      "function getAlphaOutPool(uint16 netuid) view returns (uint64)",
      "function getAlphaIssuance(uint16 netuid) view returns (uint64)",
      "function getTaoWeight() view returns (uint256)",
      "function simSwapTaoForAlpha(uint16 netuid, uint64 tao) view returns (uint256)",
      "function simSwapAlphaForTao(uint16 netuid, uint64 alpha) view returns (uint256)",
      "function getSubnetMechanism(uint16 netuid) view returns (uint16)",
      "function getMinimumPoolLiquidity() view returns (uint256)",
      "function getRootNetuid() view returns (uint16)",
      "function getEMAPriceHalvingBlocks(uint16 netuid) view returns (uint64)",
      "function getSubnetVolume(uint16 netuid) view returns (uint256)"
    ];

    const STAKING_ABI = [
      "function addStake(bytes32 hotkey, uint256 netuid) payable",
      "function removeStake(bytes32 hotkey, uint256 amount, uint256 netuid)",
      "function getTotalColdkeyStake(bytes32 coldkey) view returns (uint256)",
      "function getTotalHotkeyStake(bytes32 hotkey) view returns (uint256)",
      "function addProxy(bytes32 delegate)",
      "function removeProxy(bytes32 delegate)",
      "function getStake(bytes32 hotkey, bytes32 coldkey, uint256 netuid) view returns (uint256)"
    ];

    const STAKING_V2_ABI = [
      "function addStake(bytes32 hotkey, uint256 amount, uint256 netuid) payable",
      "function removeStake(bytes32 hotkey, uint256 amount, uint256 netuid)",
      "function moveStake(bytes32 origin_hotkey, bytes32 destination_hotkey, uint256 origin_netuid, uint256 destination_netuid, uint256 amount)",
      "function transferStake(bytes32 destination_coldkey, bytes32 hotkey, uint256 origin_netuid, uint256 destination_netuid, uint256 amount)",
      "function getTotalColdkeyStake(bytes32 coldkey) view returns (uint256)",
      "function getTotalHotkeyStake(bytes32 hotkey) view returns (uint256)",
      "function getStake(bytes32 hotkey, bytes32 coldkey, uint256 netuid) view returns (uint256)",
      "function addProxy(bytes32 delegate)",
      "function removeProxy(bytes32 delegate)",
      "function getAlphaStakedValidators(bytes32 hotkey, uint256 netuid) view returns (uint256[])",
      "function getTotalAlphaStaked(bytes32 hotkey, uint256 netuid) view returns (uint256)"
    ];

    const SUBNET_ABI = [
      "function registerNetwork(bytes32 hotkey) payable",
      "function getServingRateLimit(uint16 netuid) view returns (uint64)",
      "function getMinDifficulty(uint16 netuid) view returns (uint64)",
      "function getMaxDifficulty(uint16 netuid) view returns (uint64)",
      "function getWeightsVersionKey(uint16 netuid) view returns (uint64)",
      "function getWeightsSetRateLimit(uint16 netuid) view returns (uint64)",
      "function getAdjustmentAlpha(uint16 netuid) view returns (uint64)",
      "function getMaxWeightLimit(uint16 netuid) view returns (uint16)",
      "function getImmunityPeriod(uint16) view returns (uint16)",
      "function getMinAllowedWeights(uint16 netuid) view returns (uint16)",
      "function getKappa(uint16) view returns (uint16)",
      "function getRho(uint16) view returns (uint16)",
      "function getActivityCutoff(uint16 netuid) view returns (uint16)",
      "function getNetworkRegistrationAllowed(uint16 netuid) view returns (bool)",
      "function getNetworkPowRegistrationAllowed(uint16 netuid) view returns (bool)",
      "function getMinBurn(uint16 netuid) view returns (uint64)",
      "function getMaxBurn(uint16 netuid) view returns (uint64)",
      "function getDifficulty(uint16 netuid) view returns (uint64)",
      "function getBondsMovingAverage(uint16 netuid) view returns (uint64)",
      "function getCommitRevealWeightsEnabled(uint16 netuid) view returns (bool)",
      "function getLiquidAlphaEnabled(uint16 netuid) view returns (bool)",
      "function getAlphaValues(uint16 netuid) view returns (uint16, uint16)",
      "function getCommitRevealWeightsInterval(uint16 netuid) view returns (uint64)"
    ];

    // Create contract instances
    const alphaContract = new ethers.Contract(
      ALPHA_PRECOMPILE_ADDRESS,
      ALPHA_ABI,
      provider
    );

    const stakingContract = new ethers.Contract(
      STAKING_PRECOMPILE_ADDRESS,
      STAKING_ABI,
      provider
    );

    const stakingV2Contract = new ethers.Contract(
      STAKING_V2_PRECOMPILE_ADDRESS,
      STAKING_V2_ABI,
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

    // Test Alpha precompile
    console.log("\nTesting Alpha precompile:");
    try {
      const alphaPrice = await alphaContract.getAlphaPrice(0);
      console.log(`Alpha Price for subnet 0: ${alphaPrice}`);
    } catch (error) {
      console.log("Error testing Alpha precompile getAlphaPrice:", error.reason || error.message);
    }

    try {
      const rootNetuid = await alphaContract.getRootNetuid();
      console.log(`Root Netuid: ${rootNetuid}`);
    } catch (error) {
      console.log("Error testing Alpha precompile getRootNetuid:", error.reason || error.message);
    }

    // Test Staking precompile
    console.log("\nTesting Staking precompile:");
    try {
      const hotkey = ethers.zeroPadValue("0x1234", 32);
      const coldkey = ethers.zeroPadValue(wallet.address, 32);
      const stake = await stakingContract.getStake(hotkey, coldkey, 0);
      console.log(`Stake for hotkey: ${stake}`);
    } catch (error) {
      console.log("Error testing Staking precompile getStake:", error.reason || error.message);
    }

    // Test StakingV2 precompile
    console.log("\nTesting StakingV2 precompile:");
    try {
      const hotkey = ethers.zeroPadValue("0x1234", 32);
      const totalStake = await stakingV2Contract.getTotalHotkeyStake(hotkey);
      console.log(`Total hotkey stake: ${totalStake}`);
    } catch (error) {
      console.log("Error testing StakingV2 precompile getTotalHotkeyStake:", error.reason || error.message);
    }

    // Test Subnet precompile
    console.log("\nTesting Subnet precompile:");
    try {
      const servingRateLimit = await subnetContract.getServingRateLimit(0);
      console.log(`Serving rate limit for subnet 0: ${servingRateLimit}`);
    } catch (error) {
      console.log("Error testing Subnet precompile getServingRateLimit:", error.reason || error.message);
    }

    try {
      const liquidAlphaEnabled = await subnetContract.getLiquidAlphaEnabled(0);
      console.log(`Liquid Alpha enabled for subnet 0: ${liquidAlphaEnabled}`);
    } catch (error) {
      console.log("Error testing Subnet precompile getLiquidAlphaEnabled:", error.reason || error.message);
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
