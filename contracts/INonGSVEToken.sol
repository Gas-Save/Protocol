// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface INonGSVEToken {

    function totalSupply() external view  returns(uint256);

    function mint(uint256 value) external;

    function computeAddress2(uint256 salt) external pure returns (address child); 

    function free(uint256 value) external returns (uint256);  

    function freeUpTo(uint256 value) external returns (uint256); 

    function freeFrom(address from, uint256 value) external returns (uint256); 

    function freeFromUpTo(address from, uint256 value) external returns (uint256); 

}
