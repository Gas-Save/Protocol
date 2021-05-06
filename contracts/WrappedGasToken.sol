// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import './ERC20WithoutTotalSupply.sol';
import "./IGasToken.sol";

contract WrappedGasToken is IERC20, ERC20WithoutTotalSupply, Ownable{
    using SafeMath for uint256;

    string public name;
    string public symbol;
    uint8 constant public decimals = 0;
    address public wrappedTokenAddress;

    uint256 public totalMinted;
    uint256 public totalBurned;

    uint256 constant public protocolFee = 2;

    address public feeAddress;

    constructor(address _tokenAddress, string memory _name, string memory _symbol) {
        feeAddress = msg.sender;
        wrappedTokenAddress = _tokenAddress;
        name = _name;
        symbol = _symbol;
    }

    function totalSupply() public view override returns(uint256) {
        return totalMinted - totalBurned;
    }

    function calculateFee(uint256 value, uint256 feeValue) public pure returns(uint256){
        uint256 fee = 1;
        fee = fee.add(value.div(100).mul(feeValue));
        return fee;
    }

    function mint(uint256 value) public {
        IERC20(wrappedTokenAddress).transferFrom(msg.sender, address(this), value);
        uint256 fee = calculateFee(value, protocolFee);
        uint256 valueAfterFee =  value.sub(fee, "SG: Minted Value must be larger than base fee");
        _mint(msg.sender, valueAfterFee);
        _mint(feeAddress, fee);
        totalMinted = totalMinted + value;
    }


    function discountedMint(uint256 value, uint256 discountedFee, address recipient) public onlyOwner {
        IERC20(wrappedTokenAddress).transferFrom(msg.sender, address(this), value);
        uint256 fee = 0;
        if(discountedFee>0){
            fee = calculateFee(value, discountedFee);
        }
        uint256 valueAfterFee =  value.sub(fee, "SG: Minted Value must be larger than base fee");
        _mint(recipient, valueAfterFee);

        if(fee>0){
            _mint(feeAddress, fee);
        }
        
        totalMinted = totalMinted + value;
    }

    function unwrap(uint256 value) public {
        if(value > 0){
            _burnFrom(msg.sender, value);
            IERC20(wrappedTokenAddress).transferFrom(address(this), msg.sender, value);
            totalMinted = totalMinted + value;
        }
    }

    function free(uint256 value) public returns (uint256)  {
        if (value > 0) {
            _burn(msg.sender, value);
            IGasToken(wrappedTokenAddress).free(value);
            totalBurned = totalBurned + value;
        }
        return value;
    }

    function freeUpTo(uint256 value) public returns (uint256) {
        return free(Math.min(value, balanceOf(msg.sender)));
    }

    function freeFrom(address from, uint256 value) public returns (uint256) {
        if (value > 0) {
            _burnFrom(from, value);
            IGasToken(wrappedTokenAddress).free(value);
            totalBurned = totalBurned + value;
        }
        return value;
    }

    function freeFromUpTo(address from, uint256 value) public returns (uint256) {
        return freeFrom(from, Math.min(Math.min(value, balanceOf(from)), allowance(from, msg.sender)));
    }

    function updateFeeAddress(address newFeeAddress) public onlyOwner {
        feeAddress = newFeeAddress;
    }
    
}
