pragma solidity ^0.8.0;

import "./openzepplin/Address.sol";
import "./openzepplin/IERC20.sol";
import "./ISGToken.sol";

contract GasSwapWrapper {
    using Address for address;

    function gasSwapCaller(bytes calldata data, address contractAddress, address gas_token, uint256 tokensToBurn) public payable{

        //check that the address we have is actually a contract that we can call
        if(!contractAddress.isContract()){
            return;
        }

        if(msg.value > 0){
            contractAddress.functionCallWithValue(data, msg.value, "GS: Error forwarding transaction");
        }
        else{
            contractAddress.functionCall(data, "GS: Error forwarding transaction");
        }

        ISGToken(gas_token).freeFrom(msg.sender, tokensToBurn);
    }

    function proxyCaller(bytes memory data, address contractAddress) public payable{

        //check that the address we have is actually a contract that we can call
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
    
    event Interaction(address indexed owner, bytes data);
    
}
