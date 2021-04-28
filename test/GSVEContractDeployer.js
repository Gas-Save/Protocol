const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const GasToken  = artifacts.require ("./JetFuel.sol");
const GS_Deployer  = artifacts.require ("./GSVEContractDeployer.sol");
const timeMachine = require('ganache-time-traveler');
const byteCodeJson = require("build/contracts/GasSwapWrapper.json")

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

      var compatible = await protocol.compatibleGasToken(gasToken.address);
      assert.equal(compatible.toNumber(), 1);
    });
  

    it('should revert when trying to use a non-supported gas token address', async () => {
      var byteCode = byteCodeJson["bytecode"]
      expectRevert(deployer.GsveDeploy(byteCode, deployer.address, {from: accounts[1]}), "GSVE: incompatible token");
    });

    /*
    it('should fail to discount minting as no tokens to burn but approval given', async () => {
      await token.approve(protocol.address, web3.utils.toWei("0.25"), {from: accounts[1]});
      expectRevert(protocol.burnDiscountedMinting(gasToken.address, 100, {from: accounts[1]}), 'ERC20: burn amount exceeds balance.');
    });

    it('should be able to stake gsve', async () => {
      await token.approve(protocol.address, web3.utils.toWei("25000"));
      var receipt = await protocol.stake(web3.utils.toWei('25000'));

      const balanceSent = web3.utils.toWei('25000');
      const balanceAddress = await token.balanceOf(protocol.address);
      const totalStaked = await protocol.totalStaked();
      const userStakeSize = await protocol.userStakeSize(accounts[0]);

      assert.equal(balanceAddress, balanceSent);
      assert.equal(totalStaked, balanceSent);
      assert.equal(userStakeSize, balanceSent);
    });

    it('should be able to mint at a reduced fee due to already having a tier 1 stake', async () => {

      var receipt = await protocol.discountedMinting(gasToken.address, 100);

      const gasTokenBalance = await gasToken.balanceOf.call(accounts[0]);
      assert.equal(gasTokenBalance.toNumber(), 199);

      const feeHolderGasTokenBalance = await gasToken.balanceOf.call(protocol.address);
      assert.equal(feeHolderGasTokenBalance.toNumber(), 1);
    });

    it('should fail to be rewarded if the contract has no rewards to give.', async () => {
      expectRevert(protocol.rewardedMinting(gasToken.address, 100, {from: accounts[3]}), "GSVE: contract has ran out of rewards to give.");
    });

    it('contract should be given some tokens to distribute', async () => {
      await token.transfer(protocol.address, web3.utils.toWei("10000000"));
      const totalRewards = await protocol.totalRewards();
      assert.equal(totalRewards.toString(), web3.utils.toWei("10000000"));
    });

    it('should fail to mint at discount rate as not a tier 1 stake', async () => {
      expectRevert(protocol.discountedMinting(gasToken.address, 100, {from: accounts[1]}), 'GSVE: User has not staked enough to discount.');
    });

    it('should fail to be rewarded for attempting to mint a non-accepted address', async () => {
      expectRevert(protocol.rewardedMinting(token.address, 100, {from: accounts[3]}), "GSVE: Unsupported Token");
    });



    it('should be able to mint tokens and be rewarded with gsve tokens', async () => {
      var receipt = await protocol.rewardedMinting(gasToken.address, 100, {from: accounts[3]});

      const gasTokenBalance = await gasToken.balanceOf(accounts[3]);
      assert.equal(gasTokenBalance.toNumber(), 98);

      const gasTokenProtocolBalance = await gasToken.balanceOf(protocol.address);
      assert.equal(gasTokenProtocolBalance.toNumber(), 3);

      const gsveReward = web3.utils.toWei('0.1');
      const gsveBalance = await token.balanceOf(accounts[3]);
      assert.equal(gsveReward.toString(), gsveBalance.toString());
    });

    it('should be able to claim tokens after x time', async () => {
      await timeMachine.advanceTimeAndBlock(60 * 60 * 13);
      
    });
    */

});
