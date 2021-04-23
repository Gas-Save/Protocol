pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IGSVEToken.sol";

contract GasSwapWrapper is Ownable {
    using Address for address;

    // To avoid abuse, only the transaction sender can use approved values for gas saving.
    function gasSwapCall(bytes calldata data, address contractAddress, address gas_token, uint256 tokensToBurn) public payable onlyOwner{
        if(!contractAddress.isContract()){
            return;
        }

        if(msg.value > 0){
            contractAddress.functionCallWithValue(data, msg.value, "GS: Error forwarding transaction");
        }
        else{
            contractAddress.functionCall(data, "GS: Error forwarding transaction");
        }
        IGSVEToken(gas_token).freeFromUpTo(msg.sender, tokensToBurn);
    }
}
