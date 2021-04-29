const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const GasToken  = artifacts.require ("./JetFuel.sol");
const GS_Deployer  = artifacts.require ("./GSVEContractDeployer.sol");
const byteCodeJson = require("./../build/contracts/GasSwapWrapper.json")
const byteCodeNonOwnedJson = require("./../build/contracts/GasToken1.json")

contract("GSVE Contract Deployer Test", async accounts => {
    var gasToken;
    var deployer;

    it('should be able to deploy contracts', async () => {
      gasToken = await GasToken.new();
      console.log("JetFuel Address " + gasToken.address);

      deployer = await GS_Deployer.new();
      console.log("deployer Address " + deployer.address);
    });

    it('should be able to add a token to the list of supported tokens', async () => {
      await deployer.addGasToken(gasToken.address);

      var compatible = await deployer.compatibleGasToken(gasToken.address);
      assert.equal(compatible.toNumber(), 1);
    });
  

    it('should revert when trying to use a non-supported gas token address', async () => {
      var byteCode = byteCodeJson["bytecode"];
      expectRevert(deployer.GsveDeploy(byteCode, deployer.address, {from: accounts[1]}), "GSVE: incompatible token");
    });

    it('should be able to deploy a contract even when no gas tokens on hand', async () => {
      var byteCode = byteCodeJson["bytecode"];
      var receipt = await deployer.GsveDeploy(byteCode, gasToken.address, {from: accounts[0]});
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should be able to deploy a contract that is not a ownable', async () => {
      var byteCode = byteCodeNonOwnedJson["bytecode"];
      var receipt = await deployer.GsveDeploy(byteCode, gasToken.address, {from: accounts[0]});
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should be able to deploy a contract even when we have gas tokens', async () => {
      await gasToken.mint(140);
      await gasToken.approve(deployer.address, 138);
      var byteCode = byteCodeJson["bytecode"];
      var receipt = await deployer.GsveDeploy(byteCode, gasToken.address, {from: accounts[0]});
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should be able to deploy2 a contract even when no gas tokens on hand', async () => {
      var byteCode = byteCodeJson["bytecode"];
      var receipt = await deployer.GsveDeploy2(31337, byteCode, gasToken.address, {from: accounts[1]});
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should be able to deploy2 a contract that is not ownable', async () => {
      var byteCode = byteCodeNonOwnedJson["bytecode"];
      var receipt = await deployer.GsveDeploy2(31337, byteCode, gasToken.address, {from: accounts[1]});
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should be able to deploy2 a contract that is not ownable and save gas', async () => {
      await gasToken.mint(140, {from: accounts[1]});
      await gasToken.approve(deployer.address, 138, {from: accounts[1]});
      var byteCode = byteCodeNonOwnedJson["bytecode"]
      var receipt = await deployer.GsveDeploy2(313373, byteCode, gasToken.address, {from: accounts[1]});
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should be able to deploy a wrapper contract', async () => {
      var receipt = await deployer.GsveWrapperDeploy({from: accounts[0]});
      var address = await deployer.deployedWalletAddressLocation.call(accounts[0])
      var deployed = false;
      if(address != "0x0000000000000000000000000000000000000000"){
        deployed= true;
      }

      assert.equal(deployed, true)
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });
});
