pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GSVEToken is ERC20{    
    constructor() public ERC20("Gas Save Token by Gas Save Protocol", "GSVE") {
        _mint(msg.sender, 100000000*(10**18));
    }
}