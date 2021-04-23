pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IGSVEToken.sol";

contract GSVEProtocol is Ownable {
    using SafeMath for uint256;
    
    //address of our protocol utility token
    address public GSVEToken;

    //supported gas tokens
    uint256 totalSupportedGasTokens = 0;
    mapping(uint256 => address) public supportedGasTokens;

    //fee schedule when using the 
    uint256 discountedFromBurn = 0; 
    uint256 discountedMint = 1;
    uint256 discountedWrap = 2;
    
    //staking  
    mapping(address => uint256) public userStakes;
    mapping(address => uint256) public userStakeTimes;
    mapping(address => uint256) public userTotalRewards;

    constructor(address _tokenAddress) {
        GSVEToken = _tokenAddress;
    }

}
