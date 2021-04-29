pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IGSVEToken.sol";

interface IFreeFromUpTo {
    function freeFromUpTo(address from, uint256 value) external returns (uint256 freed);
}

contract GSVETransactionWrapper is Ownable {
    using Address for address;
    mapping(address => uint256) private _compatibleGasTokens;

    function addGasToken(address gasToken) public onlyOwner{
        _compatibleGasTokens[gasToken] = 1;
    }

    function compatibleGasToken(address gasToken) public view returns(uint256){
        return _compatibleGasTokens[gasToken];
    }

    modifier discountGas(address gasToken) {
        require(_compatibleGasTokens[gasToken] == 1, "GSVE: incompatible token");
        uint256 gasStart = gasleft();
        _;
        uint256 gasSpent = 21000 + gasStart - gasleft() + 16 * msg.data.length;
        IFreeFromUpTo(gasToken).freeFromUpTo(msg.sender,  (gasSpent + 14154) / 24000);
    }
    
    function wrapTransaction(bytes calldata data, address contractAddress, address gasToken) public discountGas(gasToken) payable onlyOwner{
        if(!contractAddress.isContract()){
            return;
        }

        if(msg.value > 0){
            contractAddress.functionCallWithValue(data, msg.value, "GS: Error forwarding transaction");
        }
        else{
            contractAddress.functionCall(data, "GS: Error forwarding transaction");
        }
    }
}
