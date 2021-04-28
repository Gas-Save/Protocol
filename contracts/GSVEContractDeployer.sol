pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IFreeFromUpTo {
    function freeFromUpTo(address from, uint256 value) external returns (uint256 freed);
}

contract GSVEContractDeployer is Ownable{
    mapping(address => uint256) private _compatibleGasTokens;
    uint256 private _salt = 0;

    function addGasToken(address gasToken) public onlyOwner{
        _compatibleGasTokens[gasToken] = 1;
    }

    function compatibleGasToken(address gasToken) public view returns(uint256){
        return _compatibleGasTokens[gasToken];
    }

    function salt() public view returns(uint256){
        return _salt;
    }

    modifier discountGas(address gasToken) {
        require(_compatibleGasTokens[gasToken] == 1, "GSVE: incompatible token");
        uint256 gasStart = gasleft();
        _;
        uint256 gasSpent = 21000 + gasStart - gasleft() + 16 * msg.data.length;
        IFreeFromUpTo(gasToken).freeFromUpTo(msg.sender,  (gasSpent + 14154) / 41130);
    }

    function GsveDeploy(bytes memory data, address gasToken) public discountGas(gasToken) returns(address contractAddress) {
        assembly {
            contractAddress := create(0, add(data, 32), mload(data))
        }
        try Ownable(contractAddress).transferOwnership(msg.sender){
            emit ContractDeployed(contractAddress);
        }
        catch{
            emit ContractDeployed(contractAddress);
        }
    }

    function GsveDeploy2(bytes memory data, address gasToken) public discountGas(gasToken) returns(address contractAddress) {
        uint256 currentSalt = _salt;
        assembly {
            contractAddress := create2(0, add(data, 32), mload(data), currentSalt)
        }

        _salt = _salt + 1;

        try Ownable(contractAddress).transferOwnership(msg.sender){
            emit ContractDeployed(contractAddress);
        }
        catch{
            emit ContractDeployed(contractAddress);
        }
    }

    event ContractDeployed(address indexed deploymentAddress);
}