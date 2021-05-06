// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IWrappedGasToken {

    function totalSupply() external view returns(uint256);

    function calculateFee(uint256 value, uint256 feeValue) external pure returns(uint256);

    function mint(uint256 value) external; 

    function discountedMint(uint256 value, uint256 discountedFee, address recipient) external; 

    function unwrap(uint256 value) external;

    function free(uint256 value) external returns (uint256);

    function freeUpTo(uint256 value) external returns (uint256);

    function freeFrom(address from, uint256 value) external returns (uint256); 

    function freeFromUpTo(address from, uint256 value) external returns (uint256); 

    function updateFeeAddress(address newFeeAddress) external;
}
