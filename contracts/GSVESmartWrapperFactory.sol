// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IGSVESmartWrapper.sol";

contract GSVESmartWrapperFactory is Ownable{
    address payable public smartWrapperLocation;
    mapping(address => uint256) private _compatibleGasTokens;
    mapping(uint256 => address) private _reverseTokenMap;
    mapping(address => address) private _deployedWalletAddressLocation;
    mapping(address => uint256) private _freeUpValue;
    address private GSVEToken;
    uint256 private _totalSupportedTokens = 0;

  constructor (address payable _smartWrapperLocation, address _GSVEToken) public {
    smartWrapperLocation = _smartWrapperLocation;
    GSVEToken = _GSVEToken;
  }

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
    * @dev deploys a gsve smart wrapper for the caller
    * the ownership of the wrapper is transfered to the caller
    * a note is made of where the users wrapper is deployed
    * gas tokens can be burned to save on this deployment operation
    * the gas tokens that the deployer supports are enabled in the wrapper before transfering ownership.
    */
  function deployGSVESmartWrapper() public {
        address contractAddress = Clones.clone(smartWrapperLocation);
        IGSVESmartWrapper(payable(contractAddress)).init(address(this), GSVEToken);

        for(uint256 i = 0; i<_totalSupportedTokens; i++){
            address tokenAddress = _reverseTokenMap[i];
            IGSVESmartWrapper(payable(contractAddress)).addGasToken(tokenAddress, _freeUpValue[tokenAddress]);
        }

        Ownable(contractAddress).transferOwnership(msg.sender);
        _deployedWalletAddressLocation[msg.sender] = contractAddress;
    }

}