const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const GSVEToken  = artifacts.require ("./GSVEToken.sol");
const GSVEProtocol = artifacts.require ("./GSVECore.sol");
const GasToken  = artifacts.require ("./JetFuel.sol");
const GS_Wrapper  = artifacts.require ("./GasSwapWrapper.sol");
const GSVE_helper  = artifacts.require ("./test_helpers/GSVE_helper.sol");

contract("GSVE Core Test", async accounts => {
    var token;
    var gasToken;
    var protocol;
    const TOTAL_SUPPLY = web3.utils.toWei('100000000');

    it('should be able to deploy protocol contracts', async () => {
      token = await GSVEToken.new();
      gasToken = await GasToken.new();
      protocol = await GSVEProtocol.new(token.address);
    });

    it("should be able to update the fee address of the gas token to the protocol", async () => {
      await gasToken.updateFeeAddress(protocol.address);
      var owner = await gasToken.feeAddress()
      assert.equal(owner, protocol.address);
    });

    it("should be able to transfer ownership of a gas token to the protocol", async () => {
      await gasToken.transferOwnership(protocol.address);
      var owner = await gasToken.owner()
      assert.equal(owner, protocol.address);
    });

    it('should be able to add a token to the list of supported tokens', async () => {

      await protocol.addGasToken(gasToken.address, 1, 1);

      var claimable = await protocol.claimable(gasToken.address);
      var mintType = await protocol.mintingType(gasToken.address);
      assert.equal(claimable.toNumber(), 1);
      assert.equal(mintType.toNumber(), 1);
    });
  
    it('should be able to burn gsve to save on protocol minting fee', async () => {
      await token.approve(protocol.address, web3.utils.toWei("0.25"));
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
      expectRevert(protocol.burnDiscountedMinting(gasToken.address, 100, {from: accounts[1]}), 'ERC20: burn amount exceeds balance.');
    });

    it('should fail to discount minting as no tokens to burn but approval given', async () => {
      await token.approve(protocol.address, web3.utils.toWei("0.25"), {from: accounts[1]});
      expectRevert(protocol.burnDiscountedMinting(gasToken.address, 100, {from: accounts[1]}), 'ERC20: burn amount exceeds balance.');
    });

    it('should be able to stake gsve', async () => {
      await token.approve(protocol.address, web3.utils.toWei("25000"));
      var receipt = await protocol.stake(web3.utils.toWei('25000'));

      const balanceSent = web3.utils.toWei('25000');
      const balanceAddress = await token.balanceOf(protocol.address);
      assert.equal(balanceAddress, balanceSent);

    });

    it('should be able to mint at a reduced fee due to already having a tier 1 stake', async () => {

      var receipt = await protocol.discountedMinting(gasToken.address, 100);

      const gasTokenBalance = await gasToken.balanceOf.call(accounts[0]);
      assert.equal(gasTokenBalance.toNumber(), 199);

      const feeHolderGasTokenBalance = await gasToken.balanceOf.call(protocol.address);
      assert.equal(feeHolderGasTokenBalance.toNumber(), 1);
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


});
