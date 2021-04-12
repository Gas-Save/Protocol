const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const SG1Token  = artifacts.require ("./SG1Token.sol");
const GS_Wrapper  = artifacts.require ("./GasSwapWrapper.sol");
const SG_Helper  = artifacts.require ("./test_helpers/SG_Helper.sol");

contract("SG2 Token Test", async accounts => {

    it('burn gas to find baseline cost', async function () {
        var helper = await SG_Helper.new();
        var receipt = await helper.burnGas(5000000, {from: accounts[0]});
        assert.equal(true, true);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });


    it('Should be able to call function by proxy', async function () {
        var helper = await SG_Helper.new();
        var wrapper = await GS_Wrapper.new();


        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGas(5000000).encodeABI();

        var receipt = await wrapper.proxyCaller(burner_callData, helper.address);
        
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
        assert.equal(true, true);
    });

    it('Should be able to call function by proxy and burn SG1', async function () {
        var instance = await SG1Token.new();
        var helper = await SG_Helper.new();
        var wrapper = await GS_Wrapper.new();

        await instance.mint(100);
        helper_w3 = new web3.eth.Contract(helper.abi, helper.address);
        var burner_callData = helper_w3.methods.burnGas(5000000).encodeABI();

        var receipt = await wrapper.gasSwapCaller(burner_callData, helper.address, instance.address, 80);
        
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
        assert.equal(true, true);
    });
    
});
