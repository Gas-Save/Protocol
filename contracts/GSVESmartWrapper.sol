// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
* @dev interface to allow gas tokens to be burned from the wrapper
*/
interface IFreeUpTo {
    function freeUpTo(uint256 value) external returns (uint256 freed);
}

/**
* @dev The v1 smart wrapper is the core gas saving feature
* it can interact with other smart contracts
* it burns gas to save on the transaction fee
* only the owner/deployer of the smart contract can interact with it
* only the owner can send tokens from the address (smart contract)
* only the owner can withdraw tokens of any type, and this goes directly to the owner.
*/
contract GSVESmartWrapper is Ownable {
    using Address for address;

   
    mapping(address => uint256) private _compatibleGasTokens;
    mapping(address => uint256) private _freeUpValue;

    /**
    * @dev allow the contract to recieve funds. 
    * This will be needed for dApps that check balances before enabling transaction creation.
    */
    receive() external payable{}

    /**
    * @dev function to enable gas tokens.
    * by default the wrapped tokens are added when the wrapper is deployed
    * using efficiency values based on a known token gas rebate that we store on contract.
    * DANGER: adding unvetted gas tokens that aren't supported by the protocol could be bad!
    */
    function addGasToken(address gasToken, uint256 freeUpValue) public onlyOwner{
        _compatibleGasTokens[gasToken] = 1;
        _freeUpValue[gasToken] = freeUpValue;
    }

    /**
    * @dev checks if the gas token is supported
    */
    function compatibleGasToken(address gasToken) public view returns(uint256){
        return _compatibleGasTokens[gasToken];
    }

    /**
    * @dev GSVE moddifier that burns supported gas tokens around a function that uses gas
    * the function calculates the optimal number of tokens to burn, based on the token specified
    */
    modifier discountGas(address gasToken) {
        require(_compatibleGasTokens[gasToken] == 1, "GSVE: incompatible token");
        uint256 gasStart = gasleft();
        _;
        uint256 gasSpent = 21000 + gasStart - gasleft() + 16 * msg.data.length;
        IFreeUpTo(gasToken).freeUpTo((gasSpent + 20000) / _freeUpValue[gasToken]);
    }
    
    /**
    * @dev the wrapTransaction function interacts with other smart contracts on the users behalf
    * this wrapper works for any smart contract
    * as long as the dApp/smart contract the wrapper is interacting with has the correct approvals for balances within this wrapper
    * if the function requires a payment, this is handled too and sent from the wrapper balance.
    */
    function wrapTransaction(bytes calldata data, address contractAddress, uint256 value, address gasToken) public discountGas(gasToken) payable onlyOwner{
        if(!contractAddress.isContract()){
            return;
        }

        if(value > 0){
            contractAddress.functionCallWithValue(data, value, "GS: Error forwarding transaction");
        }
        else{
            contractAddress.functionCall(data, "GS: Error forwarding transaction");
        }
    }

    /**
    * @dev function that the user can trigger to withdraw the entire balance of their wrapper back to themselves.
    */
    function withdrawBalance() public onlyOwner{
        owner().call{value: address(this).balance, gas:gasleft()}("");
    }

    /**
    * @dev function that the user can trigger to withdraw an entire token balance from the wrapper to themselves
    */
    function withdrawTokenBalance(address token) public onlyOwner{
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        tokenContract.transfer(owner(), balance);
    }
}
