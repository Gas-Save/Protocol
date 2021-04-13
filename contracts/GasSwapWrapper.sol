pragma solidity ^0.8.0;

import "./openzepplin/Address.sol";
import "./openzepplin/IERC20.sol";
import "./openzepplin/Ownable.sol";
import "./ISGToken.sol";

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
        ISGToken(gas_token).freeFromUpTo(msg.sender, tokensToBurn);
    }
}
