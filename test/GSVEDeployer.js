const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const GST1GasToken = artifacts.require("./existing_gas_tokens/GST/GasToken1.sol");
const GST2GasToken = artifacts.require("./existing_gas_tokens/GST/GasToken2.sol");
const wrappedToken = artifacts.require("./WrappedGasToken.sol");
const GS_Deployer  = artifacts.require ("./GSVEDeployer.sol");
const byteCodeJson = require("./../build/contracts/GSVEVault.json")
const byteCodeNonOwnedJson = require("./../build/contracts/GasToken1.json")

contract("GSVE Contract Deployer Test", async accounts => {
    var gasToken;
    var deployer;

    it('should be able to deploy contracts', async () => {
      baseGasToken = await GST1GasToken.new() // at("0x88d60255F917e3eb94eaE199d827DAd837fac4cB");;
      baseGasToken2 = await GST2GasToken.new() //at("0x0000000000b3F879cb30FE243b4Dfee438691c04")
      gasToken = await wrappedToken.new(baseGasToken.address, accounts[0], "Wrapped GST1 by Gas Save", "wGST1");
      console.log("wGST Address " + gasToken.address);

      deployer = await GS_Deployer.new(baseGasToken.address, gasToken.address, baseGasToken2.address);
      console.log("deployer Address " + deployer.address);
    });

    it('should be able to add a token to the list of supported tokens', async () => {
      await deployer.addGasToken(gasToken.address, 20046);

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

    it('should be able to deploy a contract that is not a ownable and use no gas tokens', async () => {
      var byteCode = byteCodeNonOwnedJson["bytecode"];
      var receipt = await deployer.GsveDeploy(byteCode, "0x0000000000000000000000000000000000000000", {from: accounts[0]});
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should be able to deploy a contract that is not a ownable', async () => {
      var byteCode = byteCodeNonOwnedJson["bytecode"];
      var receipt = await deployer.GsveDeploy(byteCode, gasToken.address, {from: accounts[0]});
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should be able to deploy a contract even when we have gas tokens', async () => {
      await baseGasToken.mint(100);
      await baseGasToken.approve(gasToken.address, 100);
      await gasToken.mint(100);
      await gasToken.approve(deployer.address, 97)
      var byteCode = byteCodeJson["bytecode"];
      var receipt = await deployer.GsveDeploy(byteCode, gasToken.address);
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should be able to deploy2 a contract even when no gas tokens on hand', async () => {
      var byteCode = byteCodeJson["bytecode"];
      var receipt = await deployer.GsveDeploy2(31337, byteCode, gasToken.address, {from: accounts[2]});
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should be able to deploy2 a contract that is not ownable and save gas', async () => {
      await baseGasToken.mint(100);
      await baseGasToken.approve(gasToken.address, 100);
      await gasToken.mint(100);
      await gasToken.approve(deployer.address, 97)
      var byteCode = byteCodeNonOwnedJson["bytecode"]
      var receipt = await deployer.GsveDeploy2(313373, byteCode, gasToken.address);
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should be able to deploy2 a contract that is not ownable', async () => {
      var byteCode = byteCodeNonOwnedJson["bytecode"];
      var receipt = await deployer.GsveDeploy2(1337, byteCode, gasToken.address);
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

});
