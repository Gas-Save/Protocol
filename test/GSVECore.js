const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const GSVEToken  = artifacts.require ("./GSVEToken.sol");
const GSVEProtocolCore = artifacts.require ("./GSVECore.sol");
const GST1GasToken = artifacts.require("./existing_gas_tokens/GST/GasToken1.sol");
const wrappedToken = artifacts.require("./WrappedGasToken.sol");
const GS_Deployer  = artifacts.require ("./GSVEDeployer.sol");
const GS_Wrapper  = artifacts.require ("./GSVESmartWrapper.sol");
const GSVEVault = artifacts.require ("./GSVEVault.sol");
const timeMachine = require('ganache-time-traveler');

contract("GSVE Core Test", async accounts => {
    
    var baseGasToken
    var token;
    var gasToken;
    var protocol;
    var wrapper;
    var vault;

    it('should be able to deploy protocol contracts', async () => {
      token = await GSVEToken.new();
      console.log("GSVE Address " + token.address);
      
      baseGasToken = await GST1GasToken.new();
      gasToken = await wrappedToken.new(baseGasToken.address, "Wrapped GST1 by Gas Save", "wGST1");
      console.log("wGST Address " + gasToken.address);

      vault = await GSVEVault.new();
      console.log("Vault Address " + vault.address);

      protocol = await GSVEProtocolCore.new(token.address, vault.address);
      console.log("Core Address " + protocol.address);

      deployer = await GS_Deployer.new();
      console.log("deployer Address " + deployer.address);

      wrapper = await GS_Wrapper.new(token.address);
      console.log("wrapper Address " + wrapper.address);

    });

    it('should be able to add a token to the list of deployer supported tokens', async () => {
      await deployer.addGasToken(gasToken.address, 25130);

      var compatible = await deployer.compatibleGasToken(gasToken.address);
      assert.equal(compatible.toNumber(), 1);
    });

    it('should be able to add a token to the list of wrapper supported tokens', async () => {
      await wrapper.addGasToken(gasToken.address, 15000);
      var compatible = await wrapper.compatibleGasToken(gasToken.address);
      assert.equal(compatible.toNumber(), 1);
    });

    it("should be able to update the fee address of the gas token to the vault", async () => {
      await gasToken.updateFeeAddress(vault.address);
      var owner = await gasToken.feeAddress()
      assert.equal(owner, vault.address);
    });

    it("should be able to transfer ownership of a gas token to the protocol", async () => {
      await gasToken.transferOwnership(protocol.address);
      var owner = await gasToken.owner()
      assert.equal(owner, protocol.address);
    });

    it("should be able to transfer ownership of the vaul to the protocol", async () => {
      await vault.transferOwnership(protocol.address);
      var owner = await vault.owner()
      assert.equal(owner, protocol.address);
    });


    it('should be able to add a token to the list of supported tokens', async () => {

      await protocol.addGasToken(gasToken.address, 2, 1);

      var claimable = await protocol.claimable(gasToken.address);
      var mintType = await protocol.mintingType(gasToken.address);
      assert.equal(claimable.toNumber(), 1);
      assert.equal(mintType.toNumber(), 2);
    });
  
    it('should be able to burn gsve to save on protocol minting fee', async () => {
      await token.approve(protocol.address, web3.utils.toWei("0.25"));
      await baseGasToken.mint(100);
      await baseGasToken.approve(gasToken.address, 100)
      var receipt = await protocol.burnDiscountedMinting(gasToken.address, 100);

      const gasTokenBalance = await gasToken.balanceOf.call(accounts[0]);
      assert.equal(gasTokenBalance, 100);

      const feeHolderGasTokenBalance = await gasToken.balanceOf.call(protocol.address);
      assert.equal(feeHolderGasTokenBalance, 0);

      const New_SUPPLY = web3.utils.toWei('99999999.75');
      const totalSupplyGSVE = await token.totalSupply();
      const balanceAdmin = await token.balanceOf(accounts[0]);
      assert.equal(totalSupplyGSVE.toString(), New_SUPPLY);
      assert.equal(balanceAdmin.toString(), New_SUPPLY);
    });

    it('should fail to discount minting as no tokens to burn', async () => {
      await baseGasToken.mint(100);
      await baseGasToken.approve(gasToken.address, 100)
      expectRevert(protocol.burnDiscountedMinting(gasToken.address, 100, {from: accounts[1]}), 'ERC20: burn amount exceeds balance.');
    });

    it('should fail to discount minting as no tokens to burn but approval given', async () => {
      await baseGasToken.mint(100);
      await baseGasToken.approve(gasToken.address, 100)
      await token.approve(protocol.address, web3.utils.toWei("2"), {from: accounts[1]});
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
      await baseGasToken.mint(100);
      await baseGasToken.approve(gasToken.address, 100)
      var receipt = await protocol.discountedMinting(gasToken.address, 100);

      const gasTokenBalance = await gasToken.balanceOf.call(accounts[0]);
      assert.equal(gasTokenBalance.toNumber(), 198);

      const feeHolderGasTokenBalance = await gasToken.balanceOf.call(vault.address);
      assert.equal(feeHolderGasTokenBalance.toNumber(), 2);
    });

    it('should fail to be rewarded if the contract has no rewards to give.', async () => {
      await baseGasToken.mint(100, {from: accounts[2]});
      await baseGasToken.approve(gasToken.address, 100, {from: accounts[2]})
      expectRevert(protocol.rewardedMinting(gasToken.address, 100, {from: accounts[2]}), "GSVE: contract has ran out of rewards to give");
    });

    it('contract should be given some tokens to distribute', async () => {
      await token.transfer(vault.address, web3.utils.toWei("10000000"));
      const totalRewards = await protocol.totalRewards();
      assert.equal(totalRewards.toString(), web3.utils.toWei("10000000"));
    });

    it('should fail to mint at discount rate as not a tier 1 stake', async () => {
      await baseGasToken.mint(100, {from: accounts[1]});
      await baseGasToken.approve(gasToken.address, 100, {from: accounts[1]})
      expectRevert(protocol.discountedMinting(gasToken.address, 100, {from: accounts[1]}), 'GSVE: User has not staked enough to discount.');
    });

    it('should fail to be rewarded for attempting to mint a non-accepted address', async () => {
      await baseGasToken.mint(100, {from: accounts[2]});
      await baseGasToken.approve(gasToken.address, 100, {from: accounts[2]})
      expectRevert(protocol.rewardedMinting(token.address, 100, {from: accounts[2]}), "GSVE: Unsupported Token");
    });

    it('should fail to claim reward if rewards are not enabled', async () => {
      await baseGasToken.mint(100);
      await baseGasToken.approve(gasToken.address, 100)
      expectRevert(protocol.rewardedMinting(gasToken.address, 100), 'GSVE: Rewards are not enabled');
    });

    it('forwarding time by 6 hours', async () => {
      await timeMachine.advanceTimeAndBlock(60 * 60 * 6);
    });

    it('user should have no rewards', async () => {
      var rewards = await protocol.calculateStakeReward.call(accounts[0])
      assert.equal("0", rewards.toString());
    });

    it('user should be able to enable rewards', async () => {
      await protocol.enableRewards()
      var enabled = await protocol.getRewardEnabled()
      assert.equal(true, enabled.toBool());
    });

    it('should be able to mint tokens and be rewarded with gsve tokens', async () => {
      await baseGasToken.mint(100);
      await baseGasToken.approve(gasToken.address, 100, {from: accounts[2]})
      var receipt = await protocol.rewardedMinting(gasToken.address, 100, {from: accounts[2]});

      const gasTokenBalance = await gasToken.balanceOf(accounts[2]);
      assert.equal(gasTokenBalance.toNumber(), 97);

      const gasTokenProtocolBalance = await gasToken.balanceOf(vault.address);
      assert.equal(gasTokenProtocolBalance.toNumber(), 5);

      const gsveReward = web3.utils.toWei('0.5');
      const gsveBalance = await token.balanceOf(accounts[2]);
      assert.equal(gsveReward.toString(), gsveBalance.toString());
    });


});
