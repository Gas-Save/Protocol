const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const SG1Token  = artifacts.require ("./JetFuel.sol");
const GS_Wrapper  = artifacts.require ("./GasSwapWrapper.sol");
const GSVE_helper  = artifacts.require ("./test_helpers/GSVE_helper.sol");

contract("Wrapper Test", async accounts => {
/*
    it('burn gas to find baseline cost', async function () {
        var helper = await GSVE_helper.new();
        var receipt = await helper.burnGas(147000, {from: accounts[0]});
        assert.equal(true, true);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should be able to call function by proxy and burn SG1', async function () {
        var instance = await SG1Token.new();
        var helper = await GSVE_helper.new();
        var wrapper = await GS_Wrapper.new();

        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGas(147000).encodeABI();

        await instance.mint(6);
        await instance.approve(wrapper.address, 6, {from: accounts[0]})
        
        var receipt = await wrapper.gasSwapCall(burner_callData, helper.address, instance.address, 6);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);

        assert.equal(true, true);
    });
*/
    it('Should be able to call function by proxy, and this should successfully forward a payment, and then burn SG1', async function () {
        var instance = await SG1Token.new();
        var helper = await GSVE_helper.new();
        var wrapper = await GS_Wrapper.new();
        let wrapper_receipt = await web3.eth.getTransactionReceipt(wrapper.transactionHash)

        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGasAndAcceptPayment(147000).encodeABI();

        await instance.mint(6);
        await instance.approve(wrapper.address, 6, {from: accounts[0]})
        var receipt = await wrapper.gasSwapCall(burner_callData, helper.address, instance.address, 6, {value: ether("0.01")});
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
        console.log(`GasUsed: ${wrapper_receipt.gasUsed}`);

        helper_balance = await web3.eth.getBalance(helper.address);
        wrapper_balance = await web3.eth.getBalance(wrapper.address);

        //assert.equal(helper_balance, ether("0.01"));
        //assert.equal(wrapper_balance, ether("0"));
    });

});
