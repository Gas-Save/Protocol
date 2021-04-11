// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Interface of the Stored Gas Token Type
 */
interface ISGToken {

    /**
     * @dev mints new tokens.
     */
    function mint(uint256 value) external;

    /**
     * @dev return number of tokens freed up.
     */
    function free(uint256 value) external returns (uint256);

    /**
     * @dev return number of tokens freed up.
     */
    function freeUpTo(uint256 value) external returns (uint256) ;

    /**
     * @dev return number of tokens freed up.
     */
    function freeFrom(address from, uint256 value) external returns (uint256);

    /**
     * @dev return number of tokens freed up.
     */
    function freeFromUpTo(address from, uint256 value) external returns (uint256);

    /**
     * @dev updates number of burned tokens siphoned to Gas Swap holders.
     */
    function updateBurnFee(uint256 newBurnFee) external; 
 
    /**
     * @dev updates number of minted tokens siphoned to Gas Swap holders.
     */
    function updateMintFee(uint256 newMintFee) external;

    /**
     * @dev updates fee address of this contract.
     */
    function updateFeeAddress(address newFeeAddress) external;
}
