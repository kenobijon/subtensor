pragma solidity ^0.8.0;

address constant IALPHA_ADDRESS = 0x0000000000000000000000000000000000000806;

interface IAlpha {
    /// @dev Returns the current alpha price for a subnet.
    /// @param netuid The subnet identifier.
    /// @return The alpha price in RAO per alpha.
    function getAlphaPrice(uint16 netuid) external view returns (uint256);
}
