const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const GS_WrapperFactory  = artifacts.require ("./GSVESmartWrapperFactory.sol");
const GS_Wrapper  = artifacts.require ("./GSVESmartWrapper.sol");
const GSVE_helper  = artifacts.require ("./test_helpers/GSVE_helper.sol");
const GST1GasToken = artifacts.require("./existing_gas_tokens/GST/GasToken1.sol");
const wrappedToken = artifacts.require("./WrappedGasToken.sol");
const GSVEToken  = artifacts.require ("./GSVEToken.sol");

contract("GSVE Contract Deployer Test", async accounts => {

    var gasToken;
    var wrapperMain;
    var factory;
    var helper;
    var wrapper;
    var token;
    var zerox = "0x0000000000000000000000000000000000000000";

    it('should be able to deploy contracts', async () => {

      token = await GSVEToken.new();

      baseGasToken = await GST1GasToken.at("0x88d60255F917e3eb94eaE199d827DAd837fac4cB");
      gasToken = await wrappedToken.new(baseGasToken.address, "Wrapped GST1 by Gas Save", "wGST1");
      console.log("wGST Address " + gasToken.address);

      wrapperMain = await GS_Wrapper.new(token.address);
      console.log("wrapper Address " + wrapperMain.address);

      factory = await GS_WrapperFactory.new(wrapperMain.address, token.address);
      console.log("factory Address " + factory.address);

      helper = await GSVE_helper.new();
    });

    
    it('should be able to add a token to the list of supported tokens', async () => {
      await factory.addGasToken(gasToken.address, 15000);

      var compatible = await factory.compatibleGasToken(gasToken.address);
      assert.equal(compatible.toNumber(), 1);
    });

    it('should be able to deploy a wrapper contract', async () => {
      var receipt = await factory.deployGSVESmartWrapper("0x0000000000000000000000000000000000000000");
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
      
      var address = await factory.deployedWalletAddressLocation.call(accounts[0])
      var deployed = false;
      if(address != "0x0000000000000000000000000000000000000000"){
        deployed= true;
      }
      
      wrapper = await GS_Wrapper.at(address)

      assert.equal(deployed, true)
      
    });

    it('should be able to deploy a  and save on gascost', async () => {
      await baseGasToken.mint(100, {from: accounts[1]});
      await baseGasToken.approve(gasToken.address, 97, {from: accounts[1]});
      await gasToken.mint(97, {from: accounts[1]});
      await gasToken.approve(factory.address, 97, {from: accounts[1]})
      var receipt = await factory.deployGSVESmartWrapper(gasToken.address, {from: accounts[1]});
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
      
      var address = await factory.deployedWalletAddressLocation.call(accounts[1])
      var deployed = false;
      if(address != "0x0000000000000000000000000000000000000000"){
        deployed= true;
      }
      assert.equal(deployed, true)
      
    });

    it('should revert when trying change owner using init', async () => {
        expectRevert(wrapper.init(accounts[2], token.address), "This contract is already owned");
      });

      
    it('should revert when trying to use a non-supported gas token address', async () => {
        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGas(147000).encodeABI();
        expectRevert(wrapper.wrapTransaction(burner_callData, helper.address, 0, helper.address), "GSVE: incompatible token");
      });

    
      it('should cost gsve to add gas token after deploying', async () => {
        await token.approve(wrapper.address, web3.utils.toWei("5"))
        await wrapper.addGasToken(baseGasToken.address, 15000);
        var compatible = await wrapper.compatibleGasToken(gasToken.address);
        assert.equal(compatible.toNumber(), 1);

        var compatible = await wrapper.compatibleGasToken(gasToken.address);
        assert.equal(compatible.toNumber(), 1);

        account_balance = await token.balanceOf.call(accounts[0])
        assert.equal(web3.utils.toWei("99999995"), account_balance.toString());
      });
    

    it('burn gas to find baseline cost', async function () {
        var receipt = await helper.burnGas(147000, {from: accounts[0]});
        assert.equal(true, true);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should revert when trying to withdraw balance', async () => {
        expectRevert(wrapper.withdrawBalance({from: accounts[1]}), "Ownable: caller is not the owner");
    });


    it('Should be able to call function by proxy when no gas tokens', async function () {
        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGas(147000).encodeABI();
        
        var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, 0, gasToken.address);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

        assert.equal(true, true);
    });

    it('Should be able to call function by proxy and not try to burn gas', async function () {
      helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
      var burner_callData = helper_w3.methods.burnGas(147000).encodeABI();
      
      var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, 0, zerox);
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

      assert.equal(true, true);
  });
  it('should revert when trying to withdraw gastoken balance', async () => {
    expectRevert(wrapper.withdrawTokenBalance(gasToken.address, {from: accounts[1]}), "Ownable: caller is not the owner");
});

it('Should be able to call function by proxy, and this should successfully forward a payment, when no gas tokens', async function () {

    helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
    var burner_callData = helper_w3.methods.burnGasAndAcceptPayment(147000).encodeABI();

    await web3.eth.sendTransaction({from:accounts[0], to:wrapper.address, value: web3.utils.toWei("0.15")})
    var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, ether("0.15"), gasToken.address);
    console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

    helper_balance = await web3.eth.getBalance(helper.address);
    wrapper_balance = await web3.eth.getBalance(wrapper.address);

    assert.equal(helper_balance, ether("0.15"));
    assert.equal(wrapper_balance, ether("0"));
});

it('Should be able to call function by proxy, and this should successfully forward a payment, without trying to save gas', async function () {

    helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
    var burner_callData = helper_w3.methods.burnGasAndAcceptPayment(147000).encodeABI();

    await web3.eth.sendTransaction({from:accounts[0], to:wrapper.address, value: web3.utils.toWei("0.15")})
    var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, ether("0.15"), zerox);
    console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

    helper_balance = await web3.eth.getBalance(helper.address);
    wrapper_balance = await web3.eth.getBalance(wrapper.address);

    assert.equal(helper_balance, ether("0.3"));
    assert.equal(wrapper_balance, ether("0"));
});

it('should be able to send the contract some coins', async () => {
    await web3.eth.sendTransaction({from:accounts[0], to:wrapper.address, value: web3.utils.toWei("0.15")})
    wrapper_balance = await web3.eth.getBalance(wrapper.address);
    assert.equal(wrapper_balance, ether("0.15"));
});

it('should allow the withdrawal of balance', async () => {
    await wrapper.withdrawBalance();
    wrapper_balance = await web3.eth.getBalance(wrapper.address);
    assert.equal(wrapper_balance, ether("0"));
});

it('Should be able to call function by proxy and burn ', async function () {
    await baseGasToken.mint(100);
    await baseGasToken.approve(gasToken.address, 97);
    await gasToken.mint(97);
    await gasToken.transfer(wrapper.address, 97)
    helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
    var burner_callData = helper_w3.methods.burnGas(147000).encodeABI();
    
    var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, 0, gasToken.address);
    console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

    assert.equal(true, true);
});

it('Should be able to call function by proxy, and this should successfully forward a payment, and then burn', async function () {

    helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
    var burner_callData = helper_w3.methods.burnGasAndAcceptPayment(147000).encodeABI();

    await baseGasToken.mint(100);
    await baseGasToken.approve(gasToken.address, 97);
    await gasToken.mint(97);
    await gasToken.transfer(wrapper.address, 97)
    
    await web3.eth.sendTransaction({from:accounts[0], to:wrapper.address, value: web3.utils.toWei("0.15")})
    var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, ether("0.15"), gasToken.address);
    console.log(`GasUsed: ${receipt.receipt.gasUsed}`);


    helper_balance = await web3.eth.getBalance(helper.address);
    wrapper_balance = await web3.eth.getBalance(wrapper.address);

    assert.equal(helper_balance, ether("0.45"));
    assert.equal(wrapper_balance, ether("0"));
});

it('Should be able to call function by proxy, and this should successfully forward a payment, and then burn', async function () {

  helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
  var burner_callData = helper_w3.methods.burnGasAndAcceptPayment(147000).encodeABI();

  await baseGasToken.mint(100);
  await baseGasToken.transfer(wrapper.address, 100);
  
  await web3.eth.sendTransaction({from:accounts[0], to:wrapper.address, value: web3.utils.toWei("0.15")})
  var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, ether("0.15"), baseGasToken.address);
  console.log(`GasUsed: ${receipt.receipt.gasUsed}`);


  helper_balance = await web3.eth.getBalance(helper.address);
  wrapper_balance = await web3.eth.getBalance(wrapper.address);

  assert.equal(helper_balance, ether("0.6"));
  assert.equal(wrapper_balance, ether("0"));
});

it('should fail to upgrade if no gsve tokens approved for burning', async () => {
    expectRevert(wrapper.upgradeProxy(), "ERC20: burn amount exceeds allowance");
});

    it('should be able to upgrade smart wrapper', async () => {
        token.approve(wrapper.address, web3.utils.toWei("10"));
        await wrapper.upgradeProxy();
        account_balance = await token.balanceOf.call(accounts[0])
        assert.equal(web3.utils.toWei("99999985"), account_balance.toString());
    
        var compatible = await wrapper.compatibleGasToken("0x0000000000004946c0e9F43F4Dee607b0eF1fA1c");
        assert.equal(compatible.toNumber(), 1);

        var upgraded = await wrapper.getUpgraded.call();
        assert.equal(true, upgraded)
    });

it('should fail to upgrade if already upgraded', async () => {
    token.approve(wrapper.address, web3.utils.toWei("10"));
    expectRevert(wrapper.upgradeProxy(), "GSVE: Wrapper Already Upgraded.");
}); 
  it('should allow the withdrawal token balance', async () => {
      await baseGasToken.mint(10);
      await baseGasToken.approve(gasToken.address, 10);
      await gasToken.mint(10);
      await gasToken.transfer(wrapper.address, 10)
      await wrapper.withdrawTokenBalance(gasToken.address);
      wrapper_balance = await gasToken.balanceOf.call(wrapper.address)
      account_balance = await gasToken.balanceOf.call(accounts[0])
      assert.equal(0, wrapper_balance.toNumber())
  });


});