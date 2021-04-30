// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract GSVEToken is ERC20{    
    using SafeMath for uint256;

    constructor() public ERC20("Gas Save Utility Token by Gas Save", "GSVE") {
        _mint(msg.sender, 100000000*(10**18));
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    function burnFrom(address account, uint256 amount) external {
        _burn(account, amount);
        uint256 allowed = allowance(account, msg.sender);
        if ((allowed >> 255) == 0) {
            _approve(account, msg.sender, allowed.sub(amount, "ERC20: burn amount exceeds allowance"));
        }
    }
}