const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const GSVEToken  = artifacts.require ("./GSVEToken.sol");
const GSVEProtocolCore = artifacts.require ("./GSVECore.sol");
const GST1GasToken = artifacts.require("./existing_gas_tokens/GST/GasToken1.sol");
const GST2GasToken = artifacts.require("./existing_gas_tokens/GST/GasToken2.sol");
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

      baseGasToken = await GST1GasToken.new() // at("0x88d60255F917e3eb94eaE199d827DAd837fac4cB");;
      baseGasToken2 = await GST2GasToken.new() //at("0x0000000000b3F879cb30FE243b4Dfee438691c04")
      gasToken = await wrappedToken.new(baseGasToken.address, accounts[0], "Wrapped GST1 by Gas Save", "wGST1");
      console.log("wGST Address " + gasToken.address);

      vault = await GSVEVault.new();
      console.log("Vault Address " + vault.address);

      protocol = await GSVEProtocolCore.new(token.address, vault.address, baseGasToken.address, gasToken.address, baseGasToken2.address);
      console.log("Core Address " + protocol.address);


      console.log("wGST Address " + gasToken.address);

      deployer = await GS_Deployer.new(baseGasToken.address, gasToken.address, baseGasToken2.address);
      console.log("deployer Address " + deployer.address);

      wrapper = await GS_Wrapper.new();
      console.log("wrapper Address " + wrapper.address);

    });

    it('should be able to add a token to the list of deployer supported tokens', async () => {
      await deployer.addGasToken(gasToken.address, 25130);

      var compatible = await deployer.compatibleGasToken(gasToken.address);
      assert.equal(compatible.toNumber(), 1);
    });


    it('should be able to add a minted token to the list of supported tokens', async () => {

      await protocol.addGasToken(baseGasToken.address, 1, true);

      var claimable = await protocol.claimable(baseGasToken.address);
      var mintType = await protocol.mintingType(baseGasToken.address);
      assert.equal(claimable, true);
      assert.equal(mintType.toNumber(), 1);
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
  
    it('should be able to burn gsve to save on protocol wrapping fee', async () => {
      await token.approve(protocol.address, web3.utils.toWei("0.25"));
      await baseGasToken.mint(100);
      await baseGasToken.approve(gasToken.address, 100)
      var receipt = await protocol.burnDiscountedMinting(gasToken.address, 100);

      const gasTokenBalance = await gasToken.balanceOf.call(accounts[0]);
      assert.equal(gasTokenBalance, 100);

      const feeHolderGasTokenBalance = await gasToken.balanceOf.call(vault.address);
      assert.equal(feeHolderGasTokenBalance, 0);

      const New_SUPPLY = web3.utils.toWei('99999999.75');
      const totalSupplyGSVE = await token.totalSupply();
      const balanceAdmin = await token.balanceOf(accounts[0]);
      assert.equal(totalSupplyGSVE.toString(), New_SUPPLY);
      assert.equal(balanceAdmin.toString(), New_SUPPLY);
    });

    it('should be able to burn gsve to save on protocol minting fee', async () => {
      await token.approve(protocol.address, web3.utils.toWei("0.25"));
      var receipt = await protocol.burnDiscountedMinting(baseGasToken.address, 100);

      const gasTokenBalance = await baseGasToken.balanceOf.call(accounts[0]);
      assert.equal(gasTokenBalance, 100);

      const feeHolderGasTokenBalance = await baseGasToken.balanceOf.call(vault.address);
      assert.equal(feeHolderGasTokenBalance, 0);

      const New_SUPPLY = web3.utils.toWei('99999999.5');
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
      await token.approve(protocol.address, web3.utils.toWei("2"), {from: accounts[1]});
      expectRevert(protocol.burnDiscountedMinting(gasToken.address, 100, {from: accounts[1]}), 'ERC20: burn amount exceeds balance.');
    });

    it('should be able to try to stake 0 gsve without error', async () => {
      await token.approve(protocol.address, web3.utils.toWei("0"));
      var receipt = await protocol.stake(web3.utils.toWei('0'));

      const balanceSent = web3.utils.toWei('0');
      const balanceAddress = await token.balanceOf(protocol.address);
      const totalStaked = await protocol.totalStaked();
      const userStakeSize = await protocol.userStakeSize(accounts[0]);

      assert.equal(balanceAddress, balanceSent);
      assert.equal(totalStaked, balanceSent);
      assert.equal(userStakeSize, balanceSent);
    });

    it('should be able to stake gsve', async () => {
      await token.approve(protocol.address, web3.utils.toWei("250"));
      var receipt = await protocol.stake(web3.utils.toWei('250'));

      const balanceSent = web3.utils.toWei('250');
      const balanceAddress = await token.balanceOf(protocol.address);
      const totalStaked = await protocol.totalStaked();
      const userStakeSize = await protocol.userStakeSize(accounts[0]);

      assert.equal(balanceAddress, balanceSent);
      assert.equal(totalStaked, balanceSent);
      assert.equal(userStakeSize, balanceSent);
    });


    it('should be able to wrap at a reduced fee due to already having a tier 1 stake', async () => {
      await baseGasToken.mint(100);
      await baseGasToken.approve(gasToken.address, 100)
      var receipt = await protocol.discountedMinting(gasToken.address, 100);

      const gasTokenBalance = await gasToken.balanceOf.call(accounts[0]);
      assert.equal(gasTokenBalance.toNumber(), 198);

      const feeHolderGasTokenBalance = await gasToken.balanceOf.call(vault.address);
      assert.equal(feeHolderGasTokenBalance.toNumber(), 2);
    });

    
    it('should be able to mint at a reduced fee due to already having a tier 1 stake', async () => {
      var receipt = await protocol.discountedMinting(baseGasToken.address, 100);

      const gasTokenBalance = await baseGasToken.balanceOf.call(accounts[0]);
      assert.equal(gasTokenBalance.toNumber(), 299);

      const feeHolderGasTokenBalance = await baseGasToken.balanceOf.call(vault.address);
      assert.equal(feeHolderGasTokenBalance.toNumber(), 1);
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

    it('should be able to unstake', async () => {
      var receipt = await protocol.unstake();

      const totalStaked = await protocol.totalStaked();
      const userStakeSize = await protocol.userStakeSize(accounts[0]);
      assert.equal(totalStaked, 0);
      assert.equal(userStakeSize, 0);
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
      var enableTime = await protocol.getRewardEnableTime()
      assert.equal(true, enabled);
      assert.equal(true, (enableTime.toNumber() > 0))
    });

    it('user should be able to disable rewards', async () => {
      await protocol.disableRewards()
      var enabled = await protocol.getRewardEnabled()
      var enableTime = await protocol.getRewardEnableTime()
      assert.equal(false, enabled);
      assert.equal(false, (enableTime.toNumber() > 0))
    });

    it('should fail to update reward enable if already enabled', async () => {
      expectRevert(protocol.disableRewards(), "GSVE: Rewards not already enabled");
    });

    it('user should be able to enable rewards', async () => {
      await protocol.enableRewards()
      var enabled = await protocol.getRewardEnabled()
      assert.equal(true, enabled);
    });

    it('should fail to update reward enable if already enabled', async () => {
      expectRevert(protocol.enableRewards(), "GSVE: Rewards already enabled");
    });

    it('should be able to wrap tokens and be rewarded with gsve tokens', async () => {
      await baseGasToken.mint(100, {from: accounts[2]});
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

    it('should be able to mint tokens and be rewarded with gsve tokens', async () => {
      var receipt = await protocol.rewardedMinting(baseGasToken.address, 100, {from: accounts[2]});

      const gasTokenBalance = await baseGasToken.balanceOf.call(accounts[2]);
      assert.equal(gasTokenBalance.toNumber(), 298);

      const gasTokenProtocolBalance = await baseGasToken.balanceOf.call(vault.address);
      assert.equal(gasTokenProtocolBalance.toNumber(), 3);

      const gsveReward = web3.utils.toWei('1');
      const gsveBalance = await token.balanceOf(accounts[2]);
      assert.equal(gsveReward.toString(), gsveBalance.toString());
    });

    it('staking and forwarding time by 24 hours', async () => {
      await token.approve(protocol.address, web3.utils.toWei("100000"));
      var receipt = await protocol.stake(web3.utils.toWei('100000'));

      const balanceSent = web3.utils.toWei('100000');
      const balanceAddress = await token.balanceOf(protocol.address);
      const totalStaked = await protocol.totalStaked();
      const userStakeSize = await protocol.userStakeSize(accounts[0]);

      assert.equal(balanceAddress, balanceSent);
      assert.equal(totalStaked, balanceSent);
      assert.equal(userStakeSize, balanceSent);
      await timeMachine.advanceTimeAndBlock(60 * 60 * 24);
    });

    
  it("should revert if trying to claim GSVE tokens", async () => {
    await token.approve(protocol.address, web3.utils.toWei("0.3"))
    expectRevert(protocol.claimToken(token.address, 3) , "GSVE: Token not claimable");
  });

    it('user should have rewards', async () => {
      var rewards = await protocol.calculateStakeReward.call(accounts[0])
      assert.equal(web3.utils.toWei("100"), rewards.toString());
    });

    it('user should be able to claim rewards', async () => {
        await protocol.collectReward()

        var rewards = await protocol.calculateStakeReward.call(accounts[0])
        assert.equal("0", rewards.toString());

        var rewards = await protocol.totalRewardUser.call(accounts[0])
        assert.equal(web3.utils.toWei("100"), rewards.toString());
    });

    it('user should be able to try to claim rewards but get nothing', async () => {
      await protocol.collectReward()

      var rewards = await protocol.calculateStakeReward.call(accounts[0])
      assert.equal("0", rewards.toString());

      var rewards = await protocol.totalRewardUser.call(accounts[0])
      assert.equal(web3.utils.toWei("100"), rewards.toString());
  });

  it("should revert if not the right tier", async () => {
    await token.approve(protocol.address, web3.utils.toWei("0.3"), {from: accounts[1]})
    expectRevert(protocol.claimToken(gasToken.address, 3, {from: accounts[1]}) , "GSVE: User has not staked enough to claim from the pool");
  });


  it('user should be able to claim gas tokens', async () => {
    await token.approve(protocol.address, web3.utils.toWei("0.3"))
    await protocol.claimToken(gasToken.address, 3)

    const gasTokenProtocolBalance = await gasToken.balanceOf(vault.address);
    assert.equal(gasTokenProtocolBalance.toNumber(), 2);
  }); 

  it("should fail to claim tokens if already claimed in last 6 hours", async () => {
    await token.approve(protocol.address, web3.utils.toWei("0.3"))
    expectRevert(protocol.claimToken(gasToken.address, 3) , "GSVE: User cannot claim the gas tokens twice in 6 hours");
  });

  it('forwarding time by 6 hours and then try to claim more than the vaults balance of a token', async () => {

    await token.transfer(accounts[1], web3.utils.toWei("1000"))
    await timeMachine.advanceTimeAndBlock(60 * 60 * 7);

    await token.approve(protocol.address, web3.utils.toWei("1000"), {from:accounts[1]})
    await protocol.stake(web3.utils.toWei("1000"), {from:accounts[1]})

    await token.approve(protocol.address, web3.utils.toWei("0.5"), {from:accounts[1]})
    await protocol.claimToken(baseGasToken.address, 5)

    var gasTokenProtocolBalance = await baseGasToken.balanceOf.call(vault.address);
    assert.equal(gasTokenProtocolBalance.toNumber(), 0);
    
    const tokenbalance = await baseGasToken.balanceOf.call(accounts[1]);
    assert.equal(tokenbalance.toNumber(), 100);
  });

  it('user should be able to change minting rewards', async () => {
    var reward = await protocol.getMintingReward()
    assert.equal(web3.utils.toWei("0.5"), reward);

    await protocol.updateMintingReward(web3.utils.toWei("0.6"))

    reward = await protocol.getMintingReward()
    assert.equal(web3.utils.toWei("0.6"), reward);
  });

  it('user should be able to change updateBurnClaimFee rewards', async () => {
    var reward = await protocol.getBurnToClaimGasTokens()
    assert.equal(web3.utils.toWei("0.1"), reward);

    await protocol.updateBurnClaimFee(web3.utils.toWei("1"))

    reward = await protocol.getBurnToClaimGasTokens()
    assert.equal(web3.utils.toWei("1"), reward);
  });

  
  it('user should be able to updateBurnSaveFee', async () => {
    var reward = await protocol.getBurnToSaveFee()
    assert.equal(web3.utils.toWei("0.25"), reward);

    await protocol.updateBurnSaveFee(web3.utils.toWei("1"))

    reward = await protocol.getBurnToSaveFee()
    assert.equal(web3.utils.toWei("1"), reward);
  });

  it('should be able to add a wrapped token to the list of supported tokens', async () => {

    await protocol.addGasToken(gasToken.address, 2, true);

    var claimable = await protocol.claimable(gasToken.address);
    var mintType = await protocol.mintingType(gasToken.address);
    assert.equal(claimable, true);
    assert.equal(mintType.toNumber(), 2);
  });

  it('user should be able to update tiers', async () => {
    var threshold = await protocol.getTierThreshold.call(1)
    assert.equal(web3.utils.toWei("250"), threshold);

    threshold = await protocol.getTierThreshold.call(2)
    assert.equal(web3.utils.toWei("1000"), threshold);

    await protocol.updateTier(1, web3.utils.toWei("10"))
    await protocol.updateTier(2, web3.utils.toWei("200"))

    threshold = await protocol.getTierThreshold.call(1)
    assert.equal(web3.utils.toWei("10"), threshold);

    threshold = await protocol.getTierThreshold.call(2)
    assert.equal(web3.utils.toWei("200"), threshold);
  });

  it("should fail to transfer ownership if not owner", async () => {
    expectRevert(protocol.transferOwnershipOfSubcontract(gasToken.address, accounts[0], {from: accounts[1]}), "Ownable: caller is not the owner");
  });

  it("should be able to transfer ownership of an owned contract away from the protocol", async () => {
    await protocol.transferOwnershipOfSubcontract(gasToken.address, accounts[0]);
    var owner = await gasToken.owner()
    assert.equal(owner, accounts[0]);
  });

  it('should be able to mint using the convenience function', async () => {
    var receipt = await protocol.mintGasToken(baseGasToken.address, 50, {from:accounts[3]});

    const gasTokenBalance = await baseGasToken.balanceOf.call(accounts[3]);
    assert.equal(gasTokenBalance, 48);
  });

    it('should be able to get the user stake time', async () => {
    var times = await protocol.getStakeTimes.call(accounts[0]);
    var t = false
    if(times.toString() !== "0"){
      t = true
    }
    assert.equal(true, t);
  });

    it('should be able to get the user claim time', async () => {
    var times = await protocol.getClaimTimes.call(accounts[0]);
    var t = false
    if(times.toString() !== "0"){
      t = true
    }
    assert.equal(true, t);
    });

});
