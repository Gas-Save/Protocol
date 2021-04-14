pragma solidity ^0.8.0;

import "./openzepplin/Math.sol";
import "./openzepplin/SafeMath.sol";
import "./openzepplin/IERC20.sol";
import "./openzepplin/Ownable.sol";
import './ERC20WithoutTotalSupply.sol';
import "./IChiToken.sol";
import "./ISGToken.sol";

contract SG2Token is IERC20, ERC20WithoutTotalSupply, Ownable, ISGToken{
    using SafeMath for uint256;

    //This is an erc-20 compliant wrapper for CHI. We use this to mint wChi from Chi, and pay during the process.
    string constant public name = "Wrapped Chi by GasSwap.finance";
    string constant public symbol = "wChi";
    uint8 constant public decimals = 0;
    
    uint256 public totalMinted;
    uint256 public totalBurned;

    //Introduce a fee that is taken on mint/burn
    uint256 public SGMintFee = 1;

    //Add address for where fees will be added to. Eventually this can be a contract that GasSwap Holders can redeem siphoned gas from.
    address public feeAddress;

    address public wrappedTokenAddress;

    // Set the fee address as the deployer for now. Eventually this will migrate to GasSwap Bank Contract
    constructor(address _tokenAddress) {
        feeAddress = msg.sender;
        wrappedTokenAddress = _tokenAddress;
    }

    function totalSupply() public view override returns(uint256) {
        return totalMinted - totalBurned;
    }

    function mint(uint256 value) public override {

        IERC20(wrappedTokenAddress).transferFrom(msg.sender, address(this), value);
        uint256 valueAfterFee =  value.sub(SGMintFee, "SG: Minted Value must be larger than base fee");
        _mint(msg.sender, valueAfterFee);
        _mint(feeAddress, SGMintFee);
        totalMinted = totalMinted + value;
    }

    function free(uint256 value) public override returns (uint256)  {
        if (value > 0) {
            _burn(msg.sender, value);
            IChiToken(wrappedTokenAddress).free(value);
        }
        return value;
    }

    function freeUpTo(uint256 value) public override returns (uint256) {
        return free(Math.min(value, balanceOf(msg.sender)));
    }

    function freeFrom(address from, uint256 value) public override returns (uint256) {
        if (value > 0) {
            _burnFrom(from, value);
            IChiToken(wrappedTokenAddress).freeFrom(from, value);
        }
        return value;
    }

    function freeFromUpTo(address from, uint256 value) public override returns (uint256) {
        return freeFrom(from, Math.min(Math.min(value, balanceOf(from)), allowance(from, msg.sender)));
    }

    //Add function for Gas Swap that proposers can use to adjust mint fee.
    function updateMintFee(uint256 newMintFee) public override onlyOwner {
        SGMintFee = newMintFee;
    }

    //Add function that will allow eventual transfer to Gas Swap after initial setup phase
    function updateFeeAddress(address newFeeAddress) public override onlyOwner {
        feeAddress = newFeeAddress;
    }
    
}
