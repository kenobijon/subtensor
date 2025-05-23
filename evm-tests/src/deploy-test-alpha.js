// Script to deploy and test the TestAlpha.sol contract
const { ethers } = require('ethers');
const fs = require('fs');
const solc = require('solc');

async function main() {
  try {
    // Connect to the local node
    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:9944/');
    console.log("Connected to provider, testing network:", await provider.getNetwork());

    // Check if we have any accounts
    const accounts = await provider.send('eth_accounts', []);
    console.log("Available accounts:", accounts);

    if (accounts.length === 0) {
      console.log("No accounts found, creating a wallet...");
      // Create a random wallet
      const wallet = ethers.Wallet.createRandom().connect(provider);
      console.log("Created wallet with address:", wallet.address);
      console.log("This wallet needs to be funded with TAO before proceeding");
      console.log("Please fund this wallet and then run this script again");
      return;
    }

    // Use the first account
    console.log("Using account:", accounts[0]);
    const signer = await provider.getSigner(accounts[0]);

    // Compile the Solidity contract
    console.log("Compiling TestAlpha.sol...");
    const sourceCode = fs.readFileSync('src/solidity/TestAlpha.sol', 'utf8');

    const input = {
      language: 'Solidity',
      sources: {
        'TestAlpha.sol': {
          content: sourceCode
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode']
          }
        }
      }
    };

    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    // Check for compilation errors
    if (output.errors) {
      output.errors.forEach(error => {
        console.error(error.formattedMessage);
      });

      // Only return if there are actual errors
      if (output.errors.some(error => error.severity === 'error')) {
        console.error("Compilation failed");
        return;
      }
    }

    // Get the compiled contract
    const contract = output.contracts['TestAlpha.sol']['TestAlpha'];

    // Get the ABI and bytecode
    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;

    // Deploy the contract
    console.log("Deploying TestAlpha contract...");
    const contractFactory = new ethers.ContractFactory(abi, bytecode, signer);
    const deployedContract = await contractFactory.deploy();

    console.log("Contract deployed to:", deployedContract.target);

    // Wait for the contract to be deployed
    await deployedContract.waitForDeployment();
    console.log("Contract deployment confirmed");

    // Get the function selectors for debugging
    console.log("Getting function selectors...");
    const selectors = await deployedContract.getSelectors();
    console.log("Selector for getAlphaPrice(uint16):", selectors[0]);
    console.log("Selector for getAlphaPrice(uint256):", selectors[1]);
    console.log("Selector for getMovingAlphaPrice(uint16):", selectors[2]);

    // Test the contract methods
    console.log("\nTesting contract methods...");

    // Test testGetAlphaPrice (direct method)
    try {
      console.log("\nTesting direct method testGetAlphaPrice...");
      const result = await deployedContract.testGetAlphaPrice(0);
      console.log("Success:", result[0]);
      console.log("Result:", result[1]);

      // If successful, try to decode the result
      if (result[0]) {
        const decodedResult = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], result[1]);
        console.log("Decoded result:", decodedResult.toString());
      }
    } catch (error) {
      console.log("Error testing testGetAlphaPrice:", error.reason || error.message);
    }

    // Test testGetAlphaPriceAlt (alternative selector)
    try {
      console.log("\nTesting alternative selector method testGetAlphaPriceAlt...");
      const result = await deployedContract.testGetAlphaPriceAlt(0);
      console.log("Success:", result[0]);
      console.log("Result:", result[1]);

      // If successful, try to decode the result
      if (result[0]) {
        const decodedResult = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], result[1]);
        console.log("Decoded result:", decodedResult.toString());
      }
    } catch (error) {
      console.log("Error testing testGetAlphaPriceAlt:", error.reason || error.message);
    }

    // Test testGetAlphaPriceUint256 (uint256 parameter)
    try {
      console.log("\nTesting uint256 parameter method testGetAlphaPriceUint256...");
      const result = await deployedContract.testGetAlphaPriceUint256(0);
      console.log("Success:", result[0]);
      console.log("Result:", result[1]);

      // If successful, try to decode the result
      if (result[0]) {
        const decodedResult = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], result[1]);
        console.log("Decoded result:", decodedResult.toString());
      }
    } catch (error) {
      console.log("Error testing testGetAlphaPriceUint256:", error.reason || error.message);
    }

    // Finally, try to directly call the precompile
    try {
      console.log("\nTesting direct interface call through getAlphaPriceInterface...");
      const result = await deployedContract.getAlphaPriceInterface(0);
      console.log("Result:", result.toString());
    } catch (error) {
      console.log("Error testing getAlphaPriceInterface:", error.reason || error.message);
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
