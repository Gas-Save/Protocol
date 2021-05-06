// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGasToken {

    /**
    * @dev calculate token total supply
    */
    function totalSupply() external view returns(uint256);

    /**
     * @dev mints new tokens.
     */
    function mint(uint256 value) external; 

    /**
    * @dev mints new tokens at a fee discount.
    */
    function discountedMint(uint256 value, uint256 discountedFee, address recipient) external; 

    /**
    * @dev unwraps gas tokens.
    */
    function unwrap(uint256 value) external;

    /**
     * @dev return number of tokens freed up.
     */
    function free(uint256 value) external returns (uint256);

    /**
     * @dev return number of tokens freed up.
     */
    function freeUpTo(uint256 value) external returns (uint256);

    /**
     * @dev return number of tokens freed up.
     */
    function freeFrom(address from, uint256 value) external returns (uint256); 

    /**
     * @dev return number of tokens freed up.
     */
    function freeFromUpTo(address from, uint256 value) external returns (uint256); 
    
}
