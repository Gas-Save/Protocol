// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GSVETransactionWrapper.sol";

interface IFreeFromUpTo {
    function freeFromUpTo(address from, uint256 value) external returns (uint256 freed);
}

contract GSVEContractDeployer is Ownable{
    mapping(address => uint256) private _compatibleGasTokens;
    mapping(uint256 => address) private _reverseTokenMap;
    mapping(address => address) private _deployedWalletAddressLocation;
    uint256 private _totalSupportedTokens = 0;


    function addGasToken(address gasToken) public onlyOwner{
        _compatibleGasTokens[gasToken] = 1;
        _reverseTokenMap[_totalSupportedTokens] = gasToken;
        _totalSupportedTokens = _totalSupportedTokens + 1;
    }

    function deployedWalletAddressLocation(address creator) public view returns(address){
        return _deployedWalletAddressLocation[creator];
    }

    function compatibleGasToken(address gasToken) public view returns(uint256){
        return _compatibleGasTokens[gasToken];
    }

    modifier discountGas(address gasToken) {
        require(_compatibleGasTokens[gasToken] == 1, "GSVE: incompatible token");
        uint256 gasStart = gasleft();
        _;
        uint256 gasSpent = 21000 + gasStart - gasleft() + 16 * msg.data.length;
        IFreeFromUpTo(gasToken).freeFromUpTo(msg.sender,  (gasSpent + 14154) / 41130);
    }

    function GsveDeploy(bytes memory data, address gasToken) public discountGas(gasToken) returns(address contractAddress) {
        assembly {
            contractAddress := create(0, add(data, 32), mload(data))
        }
        try Ownable(contractAddress).transferOwnership(msg.sender){
            emit ContractDeployed(msg.sender, contractAddress);
        }
        catch{
            emit ContractDeployed(msg.sender, contractAddress);
        }
    }

    function GsveDeploy2(uint256 salt, bytes memory data, address gasToken) public discountGas(gasToken) returns(address contractAddress) {
        assembly {
            contractAddress := create2(0, add(data, 32), mload(data), salt)
        }

        try Ownable(contractAddress).transferOwnership(msg.sender){
            emit ContractDeployed(msg.sender, contractAddress);
        }
        catch{
            emit ContractDeployed(msg.sender, contractAddress);
        }
    }
    
    function GsveWrapperDeploy() public returns(address payable contractAddress) {

        bytes memory bytecode = type(GSVETransactionWrapper).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(msg.sender));

        assembly {
            contractAddress := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        for(uint256 i = 0; i<_totalSupportedTokens; i++){
            GSVETransactionWrapper(contractAddress).addGasToken(_reverseTokenMap[i]);
        }
        
        Ownable(contractAddress).transferOwnership(msg.sender);
        _deployedWalletAddressLocation[msg.sender] = contractAddress;
        emit ContractDeployed(msg.sender, contractAddress);
    }

    event ContractDeployed(address indexed creator, address deploymentAddress);
}