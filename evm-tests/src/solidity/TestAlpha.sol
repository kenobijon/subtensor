// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interface for the Alpha precompile
interface IAlpha {
    function getAlphaPrice(uint16 netuid) external view returns (uint256);
    function getMovingAlphaPrice(uint16 netuid) external view returns (uint256);
    function getTaoInPool(uint16 netuid) external view returns (uint64);
    function getAlphaInPool(uint16 netuid) external view returns (uint64);
    function getAlphaOutPool(uint16 netuid) external view returns (uint64);
    function getAlphaIssuance(uint16 netuid) external view returns (uint64);
    function getTaoWeight() external view returns (uint256);
    function simSwapTaoForAlpha(uint16 netuid, uint64 tao) external view returns (uint256);
    function simSwapAlphaForTao(uint16 netuid, uint64 alpha) external view returns (uint256);
    function getSubnetMechanism(uint16 netuid) external view returns (uint16);
    function getMinimumPoolLiquidity() external view returns (uint256);
    function getRootNetuid() external view returns (uint16);
    function getEMAPriceHalvingBlocks(uint16 netuid) external view returns (uint64);
    function getSubnetVolume(uint16 netuid) external view returns (uint256);
}

// Test contract to call the Alpha precompile
contract TestAlpha {
    // Alpha precompile address
    address private constant ALPHA_PRECOMPILE = 0x0000000000000000000000000000000000000806;

    // Test functions that call the Alpha precompile methods directly using low-level calls

    // Test getAlphaPrice with a direct low-level call
    function testGetAlphaPrice(uint16 netuid) external view returns (bool success, bytes memory result) {
        // Function selector for getAlphaPrice(uint16)
        bytes4 selector = bytes4(keccak256("getAlphaPrice(uint16)"));

        // Encode the function call
        bytes memory callData = abi.encodeWithSelector(selector, netuid);

        // Make the call
        (success, result) = ALPHA_PRECOMPILE.staticcall(callData);
    }

    // Test getAlphaPrice through the interface
    function getAlphaPriceInterface(uint16 netuid) external view returns (uint256) {
        return IAlpha(ALPHA_PRECOMPILE).getAlphaPrice(netuid);
    }

    // Alternative test methods with different parameter types

    // Test with uint256 parameter type
    function testGetAlphaPriceUint256(uint256 netuid) external view returns (bool success, bytes memory result) {
        // Function selector for getAlphaPrice(uint256)
        bytes4 selector = bytes4(keccak256("getAlphaPrice(uint256)"));

        // Encode the function call
        bytes memory callData = abi.encodeWithSelector(selector, netuid);

        // Make the call
        (success, result) = ALPHA_PRECOMPILE.staticcall(callData);
    }

    // Test with no parameter name
    function testGetAlphaPriceAlt(uint16 netuid) external view returns (bool success, bytes memory result) {
        // Alternative function selector
        bytes4 selector = 0x69e38bc3; // Manually calculated selector

        // Encode the function call
        bytes memory callData = abi.encodeWithSelector(selector, netuid);

        // Make the call
        (success, result) = ALPHA_PRECOMPILE.staticcall(callData);
    }

    // Print the function selectors for debugging
    function getSelectors() external pure returns (bytes4, bytes4, bytes4) {
        return (
            bytes4(keccak256("getAlphaPrice(uint16)")),
            bytes4(keccak256("getAlphaPrice(uint256)")),
            bytes4(keccak256("getMovingAlphaPrice(uint16)"))
        );
    }
}
