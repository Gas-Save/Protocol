// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

/**
 * @dev Interface of the Stored Gas Token Type
 */
interface IGSVEProtocolToken {
    /**
     * @dev burns tokens from user.
     */
    function burn(uint256 amount) external ;

    /**
    * @dev burns tokens on behalf of user.
    */
    function burnFrom(address account, uint256 amount) external;

}