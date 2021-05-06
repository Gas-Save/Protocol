// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./GSVESmartWrapper.sol";

/**
* @dev interface to allow the burning of gas tokens from an address
*/
interface IFreeFromUpTo {
    function freeFromUpTo(address from, uint256 value) external returns (uint256 freed);
}

/**
* @dev the gsve deployer has two purposes
* it deploys gsve smart wrappers, keeping track of the owners
* it allows users to deploy smart contracts using create and create2
*/
contract GSVEDeployer is Ownable{
    mapping(address => uint256) private _compatibleGasTokens;
    mapping(uint256 => address) private _reverseTokenMap;
    mapping(address => address) private _deployedWalletAddressLocation;
    mapping(address => uint256) private _freeUpValue;
    uint256 private _totalSupportedTokens = 0;

    /**
    * @dev add support for trusted gas tokens - those we wrapped
    */
    function addGasToken(address gasToken, uint256 freeUpValue) public onlyOwner{
        _compatibleGasTokens[gasToken] = 1;
        _reverseTokenMap[_totalSupportedTokens] = gasToken;
        _totalSupportedTokens = _totalSupportedTokens + 1;
        _freeUpValue[gasToken] = freeUpValue;
    }

    /**
    * @dev return the location of a users deployed wrapper
    */
    function deployedWalletAddressLocation(address creator) public view returns(address){
        return _deployedWalletAddressLocation[creator];
    }

    /**
    * @dev function to check if a gas token is supported by the deployer
    */
    function compatibleGasToken(address gasToken) public view returns(uint256){
        return _compatibleGasTokens[gasToken];
    }

    /**
    * @dev GSVE moddifier that burns supported gas tokens around a function that uses gas
    * the function calculates the optimal number of tokens to burn, based on the token specified
    */
    modifier discountGas(address gasToken) {
        if(gasToken != address(0)){
            require(_compatibleGasTokens[gasToken] == 1, "GSVE: incompatible token");
            uint256 gasStart = gasleft();
            _;
            uint256 gasSpent = 21000 + gasStart - gasleft() + 16 * msg.data.length;
            IFreeFromUpTo(gasToken).freeFromUpTo(msg.sender,  (gasSpent + 16000) / _freeUpValue[gasToken]);
        }
        else{
            _;
        }
    }

    /**
    * @dev deploys a smart contract using the create function
    * if the contract is ownable, the contract ownership is passed to the message sender
    * the gas token passed in as argument is burned by the moddifier
    */
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

    /**
    * @dev deploys a smart contract using the create2 function and a user provided salt
    * if the contract is ownable, the contract ownership is passed to the message sender
    * the gas token passed in as argument is burned by the moddifier
    */
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
    
    
    /**
    * @dev deploys a gsve smart wrapper for the caller
    * the ownership of the wrapper is transfered to the caller
    * a note is made of where the users wrapper is deployed
    * gas tokens can be burned to save on this deployment operation
    * the gas tokens that the deployer supports are enabled in the wrapper before transfering ownership.
    */
    function GsveWrapperDeploy(address gasToken)  public discountGas(gasToken) returns(address payable contractAddress) {

        bytes memory bytecode = type(GSVESmartWrapper).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(msg.sender));

        assembly {
            contractAddress := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }

        for(uint256 i = 0; i<_totalSupportedTokens; i++){
            address tokenAddress = _reverseTokenMap[i];
            GSVESmartWrapper(contractAddress).addGasToken(tokenAddress, _freeUpValue[tokenAddress]);
        }
        
        Ownable(contractAddress).transferOwnership(msg.sender);
        _deployedWalletAddressLocation[msg.sender] = contractAddress;
        emit ContractDeployed(msg.sender, contractAddress);
    }

    event ContractDeployed(address indexed creator, address deploymentAddress);
}