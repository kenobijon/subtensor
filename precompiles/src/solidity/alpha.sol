pragma solidity ^0.8.0;

address constant IALPHA_ADDRESS = 0x0000000000000000000000000000000000000806;

interface IAlpha {
    /// @dev Returns the current alpha price for a subnet.
    /// @param netuid The subnet identifier.
    /// @return The alpha price in RAO per alpha.
    function getAlphaPrice(uint16 netuid) external view returns (uint256);

    /// @dev Returns the moving (EMA) alpha price for a subnet.
    /// @param netuid The subnet identifier.
    /// @return The moving alpha price in RAO per alpha.
    function getMovingAlphaPrice(uint16 netuid) external view returns (uint256);

    /// @dev Returns the amount of TAO in the pool for a subnet.
    /// @param netuid The subnet identifier.
    /// @return The TAO amount in the pool.
    function getTaoInPool(uint16 netuid) external view returns (uint64);

    /// @dev Returns the amount of alpha in the pool for a subnet.
    /// @param netuid The subnet identifier.
    /// @return The alpha amount in the pool.
    function getAlphaInPool(uint16 netuid) external view returns (uint64);

    /// @dev Returns the amount of alpha outside the pool for a subnet.
    /// @param netuid The subnet identifier.
    /// @return The alpha amount outside the pool.
    function getAlphaOutPool(uint16 netuid) external view returns (uint64);

    /// @dev Returns the total alpha issuance for a subnet.
    /// @param netuid The subnet identifier.
    /// @return The total alpha issuance.
    function getAlphaIssuance(uint16 netuid) external view returns (uint64);

    /// @dev Returns the global TAO weight.
    /// @return The TAO weight value.
    function getTaoWeight() external view returns (uint256);

    /// @dev Simulates swapping TAO for alpha.
    /// @param netuid The subnet identifier.
    /// @param tao The amount of TAO to swap.
    /// @return The amount of alpha that would be received.
    function simSwapTaoForAlpha(uint16 netuid, uint64 tao) external view returns (uint256);

    /// @dev Simulates swapping alpha for TAO.
    /// @param netuid The subnet identifier.
    /// @param alpha The amount of alpha to swap.
    /// @return The amount of TAO that would be received.
    function simSwapAlphaForTao(uint16 netuid, uint64 alpha) external view returns (uint256);

    /// @dev Returns the mechanism type for a subnet (0 for Stable, 1 for Dynamic).
    /// @param netuid The subnet identifier.
    /// @return The subnet mechanism type.
    function getSubnetMechanism(uint16 netuid) external view returns (uint16);

    /// @dev Returns the minimum liquidity required for pool operations.
    /// @return The minimum pool liquidity value.
    function getMinimumPoolLiquidity() external view returns (uint256);

    /// @dev Returns the root subnet unique identifier.
    /// @return The root subnet ID.
    function getRootNetuid() external view returns (uint16);

    /// @dev Returns the EMA price halving blocks parameter for a subnet.
    /// @param netuid The subnet identifier.
    /// @return The number of blocks for EMA price halving.
    function getEMAPriceHalvingBlocks(uint16 netuid) external view returns (uint64);

    /// @dev Returns the transaction volume for a subnet.
    /// @param netuid The subnet identifier.
    /// @return The subnet volume.
    function getSubnetVolume(uint16 netuid) external view returns (uint256);
}