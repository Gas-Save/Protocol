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

        baseGasToken = await GST1GasToken.new();
        gasToken = await wrappedToken.new(baseGasToken.address, "Wrapped GST1 by Gas Save", "wGST1");
        console.log("wGST Address " + gasToken.address);
        
        wrapper = await GS_Wrapper.new(token.address);
        console.log("wrapper Address " + wrapper.address);

        helper = await GSVE_helper.new();
      });

      
    it('should revert when trying to use a non-supported gas token address', async () => {
        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGas(147000).encodeABI();
        expectRevert(wrapper.wrapTransaction(burner_callData, helper.address, 0, gasToken.address), "GSVE: incompatible token");
      });

    
    it('should be able to add a token to the list of supported tokens', async () => {
        await wrapper.addGasToken(gasToken.address, 15000);
        var compatible = await wrapper.compatibleGasToken(gasToken.address);
        assert.equal(compatible.toNumber(), 1);

        var compatible = await wrapper.compatibleGasToken(gasToken.address);
        assert.equal(compatible.toNumber(), 1);
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

    it('Should be able to call function by proxy, and this should successfully forward a payment, and then burn SG1', async function () {

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

    it('should fail to upgrade if no gsve tokens approved for burning', async () => {
        expectRevert(wrapper.upgradeProxy(), "ERC20: burn amount exceeds allowance");
    });
    
    it('should be able to upgrade smart wrapper', async () => {
        token.approve(wrapper.address, web3.utils.toWei("100"));
        await wrapper.upgradeProxy();
        account_balance = await token.balanceOf.call(accounts[0])
        assert.equal(web3.utils.toWei("99999900"), account_balance.toString());
    
        var compatible = await wrapper.compatibleGasToken("0x0000000000004946c0e9F43F4Dee607b0eF1fA1c");
        assert.equal(compatible.toNumber(), 1);
    });
    
    it('should fail to upgrade if already upgraded', async () => {
        token.approve(wrapper.address, web3.utils.toWei("100"));
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