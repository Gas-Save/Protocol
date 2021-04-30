// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import './ERC20WithoutTotalSupply.sol';
import "./IGSVEToken.sol";

contract JetFuel is IERC20, ERC20WithoutTotalSupply, Ownable, IGSVEToken{
    using SafeMath for uint256;

    //SG1 uses a burn mechanic loosely based off of GST1. While using a common interface that the other SG tokens use. Also uses formal Erc20.
    string constant public name = "Jet Fuel by GasSwap.finance";
    string constant public symbol = "jFUEL";
    uint8 constant public decimals = 0;

    uint256 public totalMinted;
    uint256 public totalBurned;

    //Introduce a fee that is taken on mint/burn
    uint256 public SGMintFee = 2;

    //Add address for where fees will be added to. Eventually this can be a contract that GasSwap Holders can redeem siphoned gas from.
    address public feeAddress;

    // We start our storage at this location. The EVM word at this location
    // contains the number of stored words. The stored words follow at
    // locations (STORAGE_LOCATION_ARRAY+1), (STORAGE_LOCATION_ARRAY+2), ...
    uint256 constant STORAGE_LOCATION_ARRAY = 0xDEADBEEF;

    // Set the fee address as the deployer for now. Eventually this will migrate to GasSwap Bank Contract
    constructor () {
        feeAddress = msg.sender;
    }

    function totalSupply() public view override returns(uint256) {
        return totalMinted - totalBurned;
    }

    function _storeGas(uint256 value) internal{
        uint256 storage_location_array = STORAGE_LOCATION_ARRAY;  // can't use constants inside assembly

        // Read supply
        uint256 supply;
        assembly {
            supply := sload(storage_location_array)
        }

        // Set memory locations in interval [l, r]
        uint256 l = storage_location_array + supply + 1;
        uint256 r = storage_location_array + supply + value;
        assert(r >= l);

        for (uint256 i = l; i <= r; i++) {
            assembly {
                sstore(i, 1)
            }
        }

        // Write updated supply & balance
        assembly {
            sstore(storage_location_array, add(supply, value))
        }
    }

    function mint(uint256 value) public override {
        if (value == 0) {
            return;
        }
        uint256 valueAfterFee =  value.sub(SGMintFee, "SG: Minted Value must be larger than base fee");
        _storeGas(value);
        _mint(msg.sender, valueAfterFee);
        _mint(feeAddress, SGMintFee);
        totalMinted = totalMinted + value;
    }

    function discountedMint(uint256 value, uint256 discountedFee, address recipient) public override onlyOwner {
        if (value == 0) {
            return;
        }
        uint256 valueAfterFee =  value.sub(discountedFee, "SG: Minted Value must be larger than discounted fee");
        _storeGas(value);
        _mint(recipient, valueAfterFee);
        if(discountedFee > 0){
            _mint(feeAddress, discountedFee);
        }
        totalMinted = totalMinted + value;
    }
    
    function _burnStorage(uint256 value) internal {
        uint256 storage_location_array = STORAGE_LOCATION_ARRAY;  // can't use constants inside assembly
        // Read supply
        uint256 supply;
        assembly {
            supply := sload(storage_location_array)
        }

        // Clear memory locations in interval [l, r]
        uint256 l = storage_location_array + supply - value + 1;
        uint256 r = storage_location_array + supply;
        for (uint256 i = l; i <= r; i++) {
            assembly {
                sstore(i, 0)
            }
        }

        // Write updated supply
        assembly {
            sstore(storage_location_array, sub(supply, value))
        }

        totalBurned = totalBurned + value;
    }

    function free(uint256 value) public override returns (uint256)  {
        if (value > 0) {
            _burn(msg.sender, value);
            _burnStorage(value);
        }
        return value;
    }

    function freeUpTo(uint256 value) public override returns (uint256) {
        return free(Math.min(value, balanceOf(msg.sender)));
    }

    function freeFrom(address from, uint256 value) public override returns (uint256) {
        if (value > 0) {
            _burnFrom(from, value);
            _burnStorage(value);
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
