// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "./IGasToken.sol";
import "./IWrappedGasToken.sol";

/**
* @dev Interface for interacting with protocol token
*/
interface IGSVEProtocolToken {
    function burn(uint256 amount) external ;
    function burnFrom(address account, uint256 amount) external;
}

/**
* @dev Interface for interacting with the gas vault
*/
interface IGSVEVault {
    function transferToken(address token, address recipient, uint256 amount) external;
}

contract GSVEStakeCore is Ownable, ReentrancyGuard{
    using SafeMath for uint256;
    
    //address of our protocol utility token
    address private GSVEToken;

    address private GSVEVault;

    //supported gas tokens
    uint256 private totalSupportedGasTokens = 0;

    //system is in place to prevent reentrancy from untrusted tokens
    mapping(address => uint256) private _mintingType;
    mapping(address => uint256) private _claimable;

    //fee stake threshholds;
    uint256 private tierOneThreshold = 25000 * (10**18);
    uint256 private tierTwoThreshold = 100000 * (10**18);

    uint256 private _totalStaked = 0;

    //staking  
    mapping(address => uint256) private userStakes;
    mapping(address => uint256) private userStakeTimes;
    mapping(address => uint256) private userTotalRewards;

    mapping(address => uint256) private userClaimTimes;

    /**
     * @dev the constructor allows us to set the gsve token
     * as the token we are using for staking and other protocol features
     * also lets us set the vault address.
     */
    constructor(address _tokenAddress, address _vaultAddress) {
        GSVEToken = _tokenAddress;
        GSVEVault = _vaultAddress;
    }


    /**
     * @dev A function that allows a user to stake tokens. 
     * If they have a rewards from a stake already, they must claim this first.
     */
    function stake(uint256 value) public nonReentrant() {
        require(calculateStakeReward(msg.sender) == 0, "GSVE: User has stake rewards they must claim before updating stake.");

        if (value == 0){
            return;
        }
        require(IERC20(GSVEToken).transferFrom(msg.sender, address(this), value));
        userStakes[msg.sender] = userStakes[msg.sender].add(value);
        userStakeTimes[msg.sender] = block.timestamp;
        _totalStaked = _totalStaked.add(value);
        emit Staked(msg.sender, value);
    }

    /**
     * @dev A function that allows a user to fully unstake.
     */
    function unstake() public nonReentrant() {
        uint256 stakeSize = userStakes[msg.sender];
        if (stakeSize == 0){
            return;
        }
        userStakes[msg.sender] = 0;
        userStakeTimes[msg.sender] = 0;
        _totalStaked = _totalStaked.sub(stakeSize);
        require(IERC20(GSVEToken).transfer(msg.sender, stakeSize));
        emit Unstaked(msg.sender, stakeSize);
    }

    /**
     * @dev A function that allows us to calculate the total rewards a user has not claimed yet.
     */
    function calculateStakeReward(address rewardedAddress) public view returns(uint256){
        if(userStakeTimes[rewardedAddress] == 0){
            return 0;
        }

        uint256 timeDifference = block.timestamp.sub(userStakeTimes[rewardedAddress]);
        uint256 rewardPeriod = timeDifference.div((60*60*1));
        uint256 rewardPerPeriod = userStakes[rewardedAddress].div(24000);
        uint256 reward = rewardPeriod.mul(rewardPerPeriod);

        return reward;
    }

    /**
     * @dev A function that allows a user to collect the stake reward entitled to them
     * in the situation where the rewards pool does not have enough tokens
     * then the user is given as much as they can be given.
     */
    function collectReward() public nonReentrant() {
        uint256 remainingRewards = totalRewards();
        require(remainingRewards > 0, "GSVE: contract has ran out of rewards to give");

        uint256 reward = calculateStakeReward(msg.sender);
        if(reward == 0){
            return;
        }

        reward = Math.min(remainingRewards, reward);
        userStakeTimes[msg.sender] = block.timestamp;
        userTotalRewards[msg.sender] = userTotalRewards[msg.sender] + reward;
        IGSVEVault(GSVEVault).transferToken(GSVEToken, msg.sender, reward);
        emit Reward(msg.sender, reward);
    }

    /**
     * @dev A function that allows a user to burn some GSVE to avoid paying the protocol mint/wrap fee.
     */
    function burnDiscountedMinting(address gasTokenAddress, uint256 value) public nonReentrant() {
        uint256 mintType = _mintingType[gasTokenAddress];
        require(mintType != 0, "GSVE: Unsupported Token");
        IGSVEProtocolToken(GSVEToken).burnFrom(msg.sender, 1*10**18);
        IWrappedGasToken(gasTokenAddress).discountedMint(value, 0, msg.sender);
        if(mintType == 1){
            convenientMinting(gasTokenAddress, value, 0);
        }
        else if (mintType == 2){
            IWrappedGasToken(gasTokenAddress).discountedMint(value, 0, msg.sender);
        }
        else{
            return;
        }
    }

    /**
     * @dev A function that allows a user to benefit from a lower protocol fee, based on the stake that they have.
     */
    function discountedMinting(address gasTokenAddress, uint256 value) public nonReentrant(){
        uint256 mintType = _mintingType[gasTokenAddress];
        require(mintType != 0, "GSVE: Unsupported Token");
        require(userStakes[msg.sender] >= tierOneThreshold , "GSVE: User has not staked enough to discount");

        if(mintType == 1){
            convenientMinting(gasTokenAddress, value, 1);
        }
        else if (mintType == 2){
            IWrappedGasToken(gasTokenAddress).discountedMint(value, 2, msg.sender);
        }
        else{
            return;
        }
    }
    /**
     * @dev A function that allows a user to be rewarded tokens by minting or wrapping
     * they pay full fees for this operation.
     */
    function rewardedMinting(address gasTokenAddress, uint256 value) public nonReentrant(){
        uint256 mintType = _mintingType[gasTokenAddress];
        require(mintType != 0, "GSVE: Unsupported Token");
        require(totalRewards() > 0, "GSVE: contract has ran out of rewards to give");
        if(mintType == 1){
            convenientMinting(gasTokenAddress, value, 2);
        }
        else if (mintType == 2){
            IWrappedGasToken(gasTokenAddress).discountedMint(value, 2, msg.sender);
        }
        else{
            return;
        }

        IGSVEVault(GSVEVault).transferToken(GSVEToken, msg.sender, 1*10**18);
    }

    /**
     * @dev A function that allows us to mint non-wrapped tokens from the convenience of this smart contract.
     * taking a portion of portion of the minted tokens as payment for this convenience.
     */
    function convenientMinting(address gasTokenAddress, uint256 value, uint256 fee) internal {
        uint256 mintType = _mintingType[gasTokenAddress];
        require(mintType == 1, "GSVE: Unsupported Token");

        uint256 userTokens = value.sub(fee);
        require(userTokens > 0, "GSVE: User attempted to mint too little");
        IGasToken(gasTokenAddress).mint(value);
        IERC20(gasTokenAddress).transfer(msg.sender, userTokens);
    }

    /**
     * @dev A function that allows a user to claim tokens from the pool
     * The user burns 1 GSVE for each token they take.
     * They are limited to one claim action every 6 hours, and can claim up to 5 tokens per claim.
     */
    function claimToken(address gasTokenAddress, uint256 value) public nonReentrant() {

        uint256 isClaimable = _claimable[gasTokenAddress];
        require(isClaimable == 1, "GSVE: Token not claimable");
        require(userStakes[msg.sender] >= tierTwoThreshold , "GSVE: User has not staked enough to claim from the pool");
        
        if(userClaimTimes[msg.sender] != 0){
            require(block.timestamp.sub(userClaimTimes[msg.sender]) > 60 * 60 * 6, "GSVE: User cannot claim the gas tokens twice in 6 hours");
        }
        else{
            require(block.timestamp.sub(userStakeTimes[msg.sender]) > 60 * 60 * 6, "GSVE: User cannot claim within 6 hours of staking");
        }

        uint256 tokensGiven = value;

        uint256 tokensAvailableToClaim = IERC20(gasTokenAddress).balanceOf(GSVEVault);
        tokensGiven = Math.min(Math.min(5, tokensAvailableToClaim), tokensGiven);

        if(tokensGiven == 0){
            return;
        }

        IGSVEProtocolToken(GSVEToken).burnFrom(msg.sender, tokensGiven * 1 * 10 ** 18);
        IGSVEVault(GSVEVault).transferToken(gasTokenAddress, msg.sender, tokensGiven);
        userClaimTimes[msg.sender] = block.timestamp;
        emit Claimed(msg.sender, gasTokenAddress, tokensGiven);
    }

    /**
     * @dev A function that allows us to enable gas tokens for use with this contract.
     */
    function addGasToken(address gasToken, uint256 mintType, uint256 isClaimable) public onlyOwner{
        _mintingType[gasToken] = mintType;
        _claimable[gasToken] = isClaimable;
    }

    /**
     * @dev A function that allows us to easily check claim type of the token.
     */
    function claimable(address gasToken) public view returns (uint256){
        return _claimable[gasToken];
    }

    /**
     * @dev A function that allows us to check the mint type of the token.
     */
    function mintingType(address gasToken) public view returns (uint256){
        return _mintingType[gasToken];
    }

    /**
     * @dev A function that allows us to see the total stake of everyone in the protocol.
     */
    function totalStaked() public view returns (uint256){
        return _totalStaked;
    }

    /**
     * @dev A function that allows us to see the stake size of a specific staker.
     */
    function userStakeSize(address user)  public view returns (uint256){
        return userStakes[user]; 
    }

    /**
     * @dev A function that allows us to see how much rewards the vault has available right now.
     */    
     function totalRewards()  public view returns (uint256){
        return IERC20(GSVEToken).balanceOf(GSVEVault); 
    }

    /**
     * @dev A function that allows us to see how much rewards a user has claimed
     */
    function totalRewardUser(address user)  public view returns (uint256){
        return userTotalRewards[user]; 
    }

    /**
     * @dev A function that allows us to reassign ownership of the contracts that this contract owns. 
     /* Enabling future smartcontract upgrades without the complexity of proxy/proxy upgrades.
     */
    function transferOwnershipOfSubcontract(address ownedContract, address newOwner) public onlyOwner{
        Ownable(ownedContract).transferOwnership(newOwner);
    }

    event Claimed(address indexed _from, address indexed _token, uint _value);

    event Reward(address indexed _from, uint _value);

    event Staked(address indexed _from, uint _value);

    event Unstaked(address indexed _from, uint _value);
}
