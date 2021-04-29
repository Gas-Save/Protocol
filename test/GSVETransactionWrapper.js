const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const GasToken  = artifacts.require ("./JetFuel.sol");
const GS_Wrapper  = artifacts.require ("./GSVETransactionWrapper.sol");
const GSVE_helper  = artifacts.require ("./test_helpers/GSVE_helper.sol");

contract("Wrapper Test", async accounts => {

    var gasToken;
    var wrapper;
    var helper;

    it('should be able to deploy contracts', async () => {
        gasToken = await GasToken.new();
        console.log("JetFuel Address " + gasToken.address);
  
        wrapper = await GS_Wrapper.new();
        console.log("wrapper Address " + wrapper.address);

        helper = await GSVE_helper.new();
      });

      
    it('should revert when trying to use a non-supported gas token address', async () => {
        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGas(147000).encodeABI();
        expectRevert(wrapper.wrapTransaction(burner_callData, helper.address, gasToken.address), "GSVE: incompatible token");
      });

    
    it('should be able to add a token to the list of supported tokens', async () => {
        await wrapper.addGasToken(gasToken.address);
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
        
        var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, gasToken.address);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

        assert.equal(true, true);
    });

    it('should revert when trying to withdraw gastoken balance', async () => {
        expectRevert(wrapper.withdrawTokenBalance(gasToken.address, {from: accounts[1]}), "Ownable: caller is not the owner");
    });

    it('Should be able to call function by proxy, and this should successfully forward a payment, when no gas tokens', async function () {

        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGasAndAcceptPayment(147000).encodeABI();
        var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, gasToken.address, {value: ether("0.01")});
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);


        helper_balance = await web3.eth.getBalance(helper.address);
        wrapper_balance = await web3.eth.getBalance(wrapper.address);

        assert.equal(helper_balance, ether("0.01"));
        assert.equal(wrapper_balance, ether("0"));
    });

    it('Should be able to call function by proxy and burn SG1', async function () {
        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGas(147000).encodeABI();

        await gasToken.mint(100);
        await gasToken.approve(wrapper.address, 100, {from: accounts[0]})
        
        var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, gasToken.address);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

        assert.equal(true, true);
    });

    it('Should be able to call function by proxy, and this should successfully forward a payment, and then burn SG1', async function () {

        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGasAndAcceptPayment(147000).encodeABI();

        await gasToken.mint(100);
        await gasToken.approve(wrapper.address, 100, {from: accounts[0]})
        var receipt = await wrapper.wrapTransaction(burner_callData, helper.address, gasToken.address, {value: ether("0.01")});
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);


        helper_balance = await web3.eth.getBalance(helper.address);
        wrapper_balance = await web3.eth.getBalance(wrapper.address);

        assert.equal(helper_balance, ether("0.02"));
        assert.equal(wrapper_balance, ether("0"));
    });

    it('should allow the withdrawal token balance', async () => {
        await gasToken.mint(100);
        await gasToken.transfer(wrapper.address, 10)
        await wrapper.withdrawTokenBalance(gasToken.address);
        wrapper_balance = await gasToken.balanceOf.call(wrapper.address)
        account_balance = await gasToken.balanceOf.call(accounts[0])
        assert.equal(0, wrapper_balance.toNumber())
    });

    it('should allow the withdrawal of balance', async () => {
        await wrapper.withdrawBalance();
        wrapper_balance = await web3.eth.getBalance(wrapper.address);
        assert.equal(wrapper_balance, ether("0"));
    });
});
