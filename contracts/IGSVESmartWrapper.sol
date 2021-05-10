// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
* @dev interface for v1 gsve smart wrapper
*/
interface  IGSVESmartWrapper{


    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     * also sets the GSVE token reference
     */
    function init (address initialOwner, address _GSVEToken) external;

    /**
    * @dev allow the contract to recieve funds. 
    * This will be needed for dApps that check balances before enabling transaction creation.
    */
    receive() external payable;

    /**
    * @dev sets the contract as inited
    */
    function setInited() external;
    /**
    * @dev function to enable gas tokens.
    * by default the wrapped tokens are added when the wrapper is deployed
    * using efficiency values based on a known token gas rebate that we store on contract.
    * DANGER: adding unvetted gas tokens that aren't supported by the protocol could be bad!
    * costs 5 gsve to add custom gas tokens if done after the wallet is inited
    */
    function addGasToken(address gasToken, uint256 freeUpValue) external;

    /**
    * @dev function to 'upgrade the proxy' by enabling unwrapped gas token support
    * the user must burn 10 GSVE to upgrade the proxy.
    */
    function upgradeProxy() external;
    /**
    * @dev checks if the gas token is supported
    */
    function compatibleGasToken(address gasToken) external view returns(uint256);

    
    /**
    * @dev the wrapTransaction function interacts with other smart contracts on the users behalf
    * this wrapper works for any smart contract
    * as long as the dApp/smart contract the wrapper is interacting with has the correct approvals for balances within this wrapper
    * if the function requires a payment, this is handled too and sent from the wrapper balance.
    */
    function wrapTransaction(bytes calldata data, address contractAddress, uint256 value, address gasToken) external;

    /**
    * @dev function that the user can trigger to withdraw the entire balance of their wrapper back to themselves.
    */
    function withdrawBalance() external;

    /**
    * @dev function that the user can trigger to withdraw an entire token balance from the wrapper to themselves
    */
    function withdrawTokenBalance(address token) external;

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() external view returns (address);

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) external;
    
    /**
     * @dev Returns the upgrade status of the wrapper
     */
    function getUpgraded() external view returns (bool);
    
}
