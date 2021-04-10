pragma solidity ^0.6.0;

import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import 'ERC20WithoutTotalSupply.sol'

contract SG3Token is IERC20, ERC20WithoutTotalSupply, Ownable{
    using SafeMath for uint256;

    //SG3 is based on CHI token. Difference is inbuilt fee on minting.
    string constant public name = "Stored Gas v3 by GasSwap.finance";
    string constant public symbol = "SG3";
    uint8 constant public decimals = 0;

    uint256 public totalMinted;
    uint256 public totalBurned;

    //Introduce a fee that is taken on mint/burn
    uint8 public SGMintFee = 1;
    uint8 public SGBurnFee = 1;

    //Add address for where fees will be added to. Eventually this can be a contract that GasSwap Holders can redeem siphoned gas from.
    public address feeAddress;

    // Set the fee address as the deployer for now. Eventually this will migrate to GasSwap Bank Contract
    constructor(bytes32 _name) public {
        feeAddress = msg.sender;
    }

    function totalSupply() public view override returns(uint256) {
        return totalMinted - totalBurned;
    }

    function mint(uint256 value) public {
        uint256 offset = totalMinted;
        assembly {
            mstore(0, 0x746d4946c0e9F43F4Dee607b0eF1fA1c3318585733ff6000526015600bf30000)

            for {let i := div(value, 32)} i {i := sub(i, 1)} {
                pop(create2(0, 0, 30, add(offset, 0))) pop(create2(0, 0, 30, add(offset, 1)))
                pop(create2(0, 0, 30, add(offset, 2))) pop(create2(0, 0, 30, add(offset, 3)))
                pop(create2(0, 0, 30, add(offset, 4))) pop(create2(0, 0, 30, add(offset, 5)))
                pop(create2(0, 0, 30, add(offset, 6))) pop(create2(0, 0, 30, add(offset, 7)))
                pop(create2(0, 0, 30, add(offset, 8))) pop(create2(0, 0, 30, add(offset, 9)))
                pop(create2(0, 0, 30, add(offset, 10))) pop(create2(0, 0, 30, add(offset, 11)))
                pop(create2(0, 0, 30, add(offset, 12))) pop(create2(0, 0, 30, add(offset, 13)))
                pop(create2(0, 0, 30, add(offset, 14))) pop(create2(0, 0, 30, add(offset, 15)))
                pop(create2(0, 0, 30, add(offset, 16))) pop(create2(0, 0, 30, add(offset, 17)))
                pop(create2(0, 0, 30, add(offset, 18))) pop(create2(0, 0, 30, add(offset, 19)))
                pop(create2(0, 0, 30, add(offset, 20))) pop(create2(0, 0, 30, add(offset, 21)))
                pop(create2(0, 0, 30, add(offset, 22))) pop(create2(0, 0, 30, add(offset, 23)))
                pop(create2(0, 0, 30, add(offset, 24))) pop(create2(0, 0, 30, add(offset, 25)))
                pop(create2(0, 0, 30, add(offset, 26))) pop(create2(0, 0, 30, add(offset, 27)))
                pop(create2(0, 0, 30, add(offset, 28))) pop(create2(0, 0, 30, add(offset, 29)))
                pop(create2(0, 0, 30, add(offset, 30))) pop(create2(0, 0, 30, add(offset, 31)))
                offset := add(offset, 32)
            }

            for {let i := and(value, 0x1F)} i {i := sub(i, 1)} {
                pop(create2(0, 0, 30, offset))
                offset := add(offset, 1)
            }
        }

        uint256 valueAfterFee =  value.sub(SGMintFee, "SG: Minted Value must be larger than base fee");
        _mint(msg.sender, valueAfterFee);
        _mint(feeAddress, SGMintFee);
        totalMinted = offset;
    }

    function computeAddress2(uint256 salt) public pure returns (address child) {
        assembly {
            let data := mload(0x40)
            mstore(data, 0xff0000000000004946c0e9F43F4Dee607b0eF1fA1c0000000000000000000000)
            mstore(add(data, 21), salt)
            mstore(add(data, 53), 0x3c1644c68e5d6cb380c36d1bf847fdbc0c7ac28030025a2fc5e63cce23c16348)
            child := and(keccak256(data, 85), 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
        }
    }

    function _destroyChildren(uint256 value) internal {
        assembly {
            let i := sload(totalBurned_slot)
            let end := add(i, value)
            sstore(totalBurned_slot, end)

            let data := mload(0x40)
            mstore(data, 0xff0000000000004946c0e9F43F4Dee607b0eF1fA1c0000000000000000000000)
            mstore(add(data, 53), 0x3c1644c68e5d6cb380c36d1bf847fdbc0c7ac28030025a2fc5e63cce23c16348)
            let ptr := add(data, 21)
            for { } lt(i, end) { i := add(i, 1) } {
                mstore(ptr, i)
                pop(call(gas(), keccak256(data, 85), 0, 0, 0, 0, 0))
            }
        }
    }

    function free(uint256 value) public returns (uint256)  {
        uint256 valueAfterFee =  value.sub(SGBurnFee, "SG: burn amount does not cover fee");
        if (value > 0) {
            _burn(msg.sender, valueAfterFee);
            _destroyChildren(value);
            _transfer(feeAddress, SGBurnFee);
        }
        return value;
    }

    function freeUpTo(uint256 value) public returns (uint256) {
        return free(Math.min(value, balanceOf(msg.sender)));
    }

    function freeFrom(address from, uint256 value) public returns (uint256) {
        uint256 valueAfterFee = value.sub(SGBurnFee, "SG: burn amount does not cover fee");
        if (value > 0) {
            _burnFrom(from, valueAfterFee);
            _destroyChildren(valueAfterFee);
            _transferFrom(from, feeAddress, SGBurnFee);
        }
        return value;
    }

    function freeFromUpTo(address from, uint256 value) public returns (uint256) {
        return freeFrom(from, Math.min(Math.min(value, balanceOf(from)), allowance(from, msg.sender)));
    }

    //Add function for Gas Swap that proposers can use to adjust burn fee.
    function updateBurnFee(uint256 newBurnFee) public onlyOwner {
        SGBurnFee = newBurnFee;
    }

    //Add function for Gas Swap that proposers can use to adjust mint fee.
    function updateMintFee(uint256 newMintFee) public onlyOwner {
        SGMintFee = newMintFee;
    }

    //Add function that will allow eventual transfer to Gas Swap after initial setup phase
    function updateFeeAddress(address newFeeAddress) public onlyOwner {
        feeAddress = newFeeAddress;
    }

}
