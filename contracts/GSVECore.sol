pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./IGSVEProtocolToken.sol";
import "./IGSVEToken.sol";


contract GSVECore is Ownable {
    using SafeMath for uint256;
    
    //address of our protocol utility token
    address private GSVEToken;

    //supported gas tokens
    uint256 private totalSupportedGasTokens = 0;

    //mapping(uint256 => address) private supportedGasTokens;
    mapping(address => uint256) private _mintingType;
    mapping(address => uint256) private _claimable;

    //fee stake threshholds;
    uint256 private tierOneThreshold = 25000 * (10**18);
    uint256 private tierTwoThreshold = 100000 * (10**18);

    //staking  
    mapping(address => uint256) private userStakes;
    mapping(address => uint256) private userStakeTimes;
    mapping(address => uint256) private userTotalRewards;

    mapping(address => mapping(address => uint256)) private userClaimTimes;

    constructor(address _tokenAddress) {
        GSVEToken = _tokenAddress;
    }

    //Staking Functions - TODO Testing and Verification
    function stake(uint256 value) public {
        require(calculateStakeReward(msg.sender) == 0, "GSVE: User has stake rewards they must claim before updating stake.");

        if (value == 0){
            return;
        }
        require(IERC20(GSVEToken).transferFrom(msg.sender, address(this), value));
        userStakes[msg.sender] = userStakes[msg.sender].add(value);
        userStakeTimes[msg.sender] = block.timestamp;

        emit Staked(msg.sender, value);
    }
    
    function unstakeAmount(uint256 value) public {
        require(calculateStakeReward(msg.sender) == 0, "GSVE: User has stake rewards they must claim before updating stake.");
        uint256 stakeSize = userStakes[msg.sender];
        if (stakeSize == 0){
            return;
        }

        uint256 stakeWithdrawn = Math.min(value, stakeSize);
        userStakes[msg.sender] = stakeSize.sub(stakeWithdrawn);
        
        if(userStakes[msg.sender] == 0){
            userStakeTimes[msg.sender] = block.timestamp;
        }

        require(IERC20(GSVEToken).transfer(msg.sender, stakeWithdrawn));
        emit Unstaked(msg.sender, stakeWithdrawn);
    }

    function unstake() public {
        require(calculateStakeReward(msg.sender) == 0, "GSVE: User has stake rewards they must claim before updating stake.");
        uint256 stakeSize = userStakes[msg.sender];
        if (stakeSize == 0){
            return;
        }

        userStakes[msg.sender] = 0;
        userStakeTimes[msg.sender] = 0;

        require(IERC20(GSVEToken).transfer(msg.sender, stakeSize));
        emit Unstaked(msg.sender, stakeSize);
    }

    //calculate the users current unclaimed rewards. This is 1/2000th the users stake every 12 hours.
    function calculateStakeReward(address rewardedAddress) public view returns(uint256){
        if(userStakeTimes[rewardedAddress] == 0){
            return 0;
        }

        uint256 timeDifference = block.timestamp.sub(userStakeTimes[rewardedAddress]);
        uint256 rewardPeriod = timeDifference.div((60*60*12));
        uint256 rewardPerPeriod = userStakes[rewardedAddress].div(2000);
        uint256 reward = rewardPeriod.mul(rewardPerPeriod);

        return reward;
    }

    function collectReward() public {
        uint256 reward = calculateStakeReward(msg.sender);
        if(reward == 0){
            return;
        }
        userStakeTimes[msg.sender] = block.timestamp;
        userTotalRewards[msg.sender] = userTotalRewards[msg.sender] + reward;
        require(IERC20(GSVEToken).transfer(msg.sender, reward), "GSVE: token transfer failed");
        emit Reward(msg.sender, reward);
    }

    //remove fees when the user burns 0.25 GSVE
    function burnDiscountedMinting(address mintTokenAddress, uint256 tokensToMint) public {
        uint256 mintType = _mintingType[mintTokenAddress];
        require(mintType != 0, "GSVE: Unsupported Token");
        IGSVEProtocolToken(GSVEToken).burnFrom(msg.sender, 25 * 10**16);
        IGSVEToken(mintTokenAddress).discountedMint(tokensToMint, 0, msg.sender);
    }

    //discounted minting for tier one stakers
    function discountedMinting(address mintTokenAddress, uint256 tokensToMint) public{
        uint256 mintType = _mintingType[mintTokenAddress];
        require(mintType != 0, "GSVE: Unsupported Token");
        require(userStakes[msg.sender] >= tierOneThreshold , "GSVE: User has not staked enough to discount");

        if(mintType == 1){
            IGSVEToken(mintTokenAddress).discountedMint(tokensToMint, 1, msg.sender);
        }
        else if (mintType == 2){
            IGSVEToken(mintTokenAddress).discountedMint(tokensToMint, 2, msg.sender);
        }
        else{
            return;
        }
    }

    //Reward a user 0.25 GSVE tokens for minting 
    function rewardedMinting(address mintTokenAddress, uint256 tokensToMint) public{
        uint256 mintType = _mintingType[mintTokenAddress];
        require(mintType != 0, "GSVE: Unsupported Token");
        if(mintType == 1){
            IGSVEToken(mintTokenAddress).discountedMint(tokensToMint, 2, msg.sender);
        }
        else if (mintType == 2){
            IGSVEToken(mintTokenAddress).discountedMint(tokensToMint, 3, msg.sender);
        }
        else{
            return;
        }

        IERC20(GSVEToken).transfer(msg.sender, 10 * 10**16);
    }

    //Allow a tier 2 staker to burn tokens and claim from the pool of a specific token. 
    //Claimed at a rate of 0.1 GSVE per token claimed.
    function claimToken(address claimGasTokenAddress, uint256 tokensClaimed) public {

        uint256 isClaimable = _claimable[claimGasTokenAddress];
        require(isClaimable == 0, "GSVE: Token not claimable");
        require(userStakes[msg.sender] >= tierTwoThreshold , "GSVE: User has not staked enough to claim from the pool");
        
        if(userClaimTimes[msg.sender][claimGasTokenAddress] != 0){
            require(block.timestamp.sub(userClaimTimes[msg.sender][claimGasTokenAddress]) > 60 * 60 * 12, "GSVE: User cannot claim the same gas token twice in 12 hours");
        }

        uint256 tokensGiven = tokensClaimed;

        //user can withdraw up to 5 tokens from the pool
        uint256 tokensAvailableToClaim = IERC20(GSVEToken).balanceOf(address(this));
        tokensGiven = Math.min(Math.min(5, tokensAvailableToClaim), tokensGiven);

        if(tokensGiven == 0){
            return;
        }

        IGSVEProtocolToken(GSVEToken).burnFrom(msg.sender, tokensGiven * 1 * 10 ** 17);
        IERC20(claimGasTokenAddress).transfer(msg.sender, tokensGiven);
        userClaimTimes[msg.sender][claimGasTokenAddress] = block.timestamp;
        emit Claimed(msg.sender, claimGasTokenAddress, tokensGiven);
    }

    function addGasToken(address gasToken, uint256 mintType, uint256 isClaimable) public onlyOwner{
        _mintingType[gasToken] = mintType;
        _claimable[gasToken] = isClaimable;
    }

    function claimable(address gasToken) public view returns (uint256){
        return _claimable[gasToken];
    }

    function mintingType(address gasToken) public view returns (uint256){
        return _mintingType[gasToken];
    }

    event Claimed(address indexed _from, address indexed _token, uint _value);

    event Reward(address indexed _from, uint _value);

    event Staked(address indexed _from, uint _value);

    event Unstaked(address indexed _from, uint _value);
}
