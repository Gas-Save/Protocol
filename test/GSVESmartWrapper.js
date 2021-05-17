const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const GS_Wrapper  = artifacts.require ("./GSVESmartWrapper.sol");
const GSVE_helper  = artifacts.require ("./test_helpers/GSVE_helper.sol");
const GST1GasToken = artifacts.require("./existing_gas_tokens/GST/GasToken1.sol");
const wrappedToken = artifacts.require("./WrappedGasToken.sol");
const GSVEToken  = artifacts.require ("./GSVEToken.sol");

contract("Wrapper Test", async accounts => {

    var gasToken;
    var token;
    var wrapper;
    var helper;
    var zerox = "0x0000000000000000000000000000000000000000";

    it('should be able to deploy contracts', async () => {

        token = await GSVEToken.new();

        baseGasToken = await GST1GasToken.new() //at("0x88d60255F917e3eb94eaE199d827DAd837fac4cB");
        gasToken = await wrappedToken.new(baseGasToken.address, accounts[0],  "Wrapped GST1 by Gas Save", "wGST1");
        console.log("wGST Address " + gasToken.address);
        
        wrapper = await GS_Wrapper.new();
        console.log("wrapper Address " + wrapper.address);

        helper = await GSVE_helper.new();
      });

      it('should revert when trying change owner using init', async () => {
        expectRevert(wrapper.init(accounts[2]), "This contract is already owned");
      });


    it('burn gas to find baseline cost', async function () {
        var receipt = await helper.burnGas(100000, {from: accounts[0]});
        assert.equal(true, true);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should revert when trying to withdraw balance', async () => {
        expectRevert(wrapper.withdrawBalance({from: accounts[1]}), "Ownable: caller is not the owner");
    });


    it('Should be able to call function by proxy when no gas tokens', async function () {
        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGas(100000).encodeABI();
        
        var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, 0, gasToken.address, 20036, false);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

        assert.equal(true, true);
    });

    it('Should revert when trying to use wrapper and not owner', async function () {
        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGas(100000).encodeABI();
        expectRevert(wrapper.wrapTransaction(burner_callData, helper.address, 0, gasToken.address, 20036, false, {from: accounts[1]}), "Ownable: caller is not the owner");
    });

    it('Should be able to call function by proxy and give invalid burn number and not fail', async function () {
        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGas(100000).encodeABI();
        
        var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, 0, gasToken.address, 0, false);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

        assert.equal(true, true);
    });

    it('Should return when called address is not a contract', async function () {
        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGas(100000).encodeABI();
        
        var receipt = await wrapper.wrapTransaction(burner_callData, accounts[0], 0, gasToken.address, 20036, false);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

        assert.equal(true, true);
    });


    it('Should be able to call function by proxy and not try to burn gas', async function () {
        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGas(100000).encodeABI();
        
        var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, 0, zerox, 0, false);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

        assert.equal(true, true);
    });

    it('should revert when trying to withdraw gastoken balance', async () => {
        expectRevert(wrapper.withdrawTokenBalance(gasToken.address, {from: accounts[1]}), "Ownable: caller is not the owner");
    });

    it('Should be able to call function by proxy, and this should successfully forward a payment, when no gas tokens', async function () {

        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGasAndAcceptPayment(100000).encodeABI();

        await web3.eth.sendTransaction({from:accounts[0], to:wrapper.address, value: web3.utils.toWei("0.15")})
        var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, ether("0.15"), gasToken.address, 20036, false);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

        helper_balance = await web3.eth.getBalance(helper.address);
        wrapper_balance = await web3.eth.getBalance(wrapper.address);

        assert.equal(helper_balance, ether("0.15"));
        assert.equal(wrapper_balance, ether("0"));
    });

    it('Should be able to call function by proxy, and this should successfully forward a payment, without trying to save gas', async function () {

        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGasAndAcceptPayment(100000).encodeABI();

        await web3.eth.sendTransaction({from:accounts[0], to:wrapper.address, value: web3.utils.toWei("0.15")})
        var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, ether("0.15"), zerox, 0, false);
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
        var burner_callData = helper_w3.methods.burnGas(100000).encodeABI();
        
        var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, 0, gasToken.address, 20036, false);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

        assert.equal(true, true);
    });

    it('Should be able to call function by proxy, and this should successfully send a payment, and then burn', async function () {

        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGasAndAcceptPayment(100000).encodeABI();
    
        await baseGasToken.mint(100);
        await baseGasToken.approve(gasToken.address, 97);
        await gasToken.mint(97);
        await gasToken.transfer(wrapper.address, 97)
        
        await web3.eth.sendTransaction({from:accounts[0], to:wrapper.address, value: web3.utils.toWei("0.15")})
        var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, ether("0.15"), gasToken.address, 20036, false);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    
    
        helper_balance = await web3.eth.getBalance(helper.address);
        wrapper_balance = await web3.eth.getBalance(wrapper.address);
    
        assert.equal(helper_balance, ether("0.45"));
        assert.equal(wrapper_balance, ether("0"));
    });
    
    it('Should be able to call function by proxy, and this should successfully forward a payment, and then burn', async function () {
    
      helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
      var burner_callData = helper_w3.methods.burnGasAndAcceptPayment(100000).encodeABI();
    
      await baseGasToken.mint(100);
      await baseGasToken.transfer(wrapper.address, 100);
      
      var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, ether("0.15"), baseGasToken.address, 20036, false, {value:ether("0.15")});
      console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    
    
      helper_balance = await web3.eth.getBalance(helper.address);
      wrapper_balance = await web3.eth.getBalance(wrapper.address);
    
      assert.equal(helper_balance, ether("0.6"));
      assert.equal(wrapper_balance, ether("0"));
    });

    it('Should be able to call function by proxy and burn tokens from sender', async function () {
    
        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGasAndAcceptPayment(100000).encodeABI();
      
        await baseGasToken.mint(100);
        await baseGasToken.approve(wrapper.address, 100);
        
        var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, 0, baseGasToken.address, 20036, true);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
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