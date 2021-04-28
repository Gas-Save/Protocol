"SPDX-License-Identifier: UNLICENSED";
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IFreeFromUpTo {
    function freeFromUpTo(address from, uint256 value) external returns (uint256 freed);
}

contract Deployer is ownable{
    mapping(address => uint256) private _compatibleGasTokens;

    function addGasToken(address gasToken) public onlyOwner{
        _compatibleGasTokens[gasToken] = 1;
    }

    modifier DiscountGas(address gasToken) {
        require(compatibleGasTokens[gasToken] == 1, "GSVE: incompatible token");
        uint256 gasStart = gasleft();
        _;
        uint256 gasSpent = 21000 + gasStart - gasleft() + 16 * msg.data.length;
        IFreeFromUpTo(gasToken).freeFromUpTo(msg.sender,  (gasSpent + 14154) / 41130);
    }

    function GsveDeploy(bytes memory data, address gasToken) public DiscountGas(gasToken) returns(address contractAddress) {
        assembly {
            contractAddress := create(0, add(data, 32), mload(data))
        }
    }

    function GsveDeploy2(uint256 salt, bytes memory data, address gasToken) public DiscountGas(gasToken) returns(address contractAddress) {
        assembly {
            contractAddress := create2(0, add(data, 32), mload(data), salt)
        }

        emit ContractDeployed(address);
    }

    event ContractDeployed(address indexed deploymentAddress);
}