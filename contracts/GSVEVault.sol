// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GSVEVault is Ownable{
    using SafeMath for uint256;

    function transferToken(address token, address recipient, uint256 amount) public onlyOwner{
        IERC20(token).transfer(recipient, amount);
    }
}
