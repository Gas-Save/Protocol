const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const SG_Helper  = artifacts.require ("./test_helpers/SG_Helper.sol");
const wrappedChiToken  = artifacts.require ("./wrappedChiToken.sol");
const ChiToken  = artifacts.require ("./existing_gas_tokens/ChiToken.sol");

contract("Wrapped ChiToken Token Test", async accounts => {
 
    it("should be able to mint & wrap from contracts", async () => {
        var chiTokenInstance = await ChiToken.new();
        var instance = await wrappedChiToken.new(chiTokenInstance.address);    

        const amountMint = 100;

        await chiTokenInstance.mint(amountMint);
        await chiTokenInstance.approve(instance.address, amountMint);
        var receipt = await instance.mint(amountMint)

        var balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.toNumber(), 100);

        var balance = await chiTokenInstance.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 100);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

/*
    it("should be able to mint tokens", async () => {
        
        const account_one = accounts[0];
        var instance = await SG2Token.new();
        const amountMint = 100;

        var receipt = await instance.mint(amountMint, {from: accounts[1]})
        const balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 99);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it("should be able to get fee of tokens", async () => {
        const account_one = accounts[0];
        var instance = await SG2Token.new();
        const amountMint = 100;

        var receipt = await instance.mint(amountMint, {from: accounts[1]})

        const balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.toNumber(), 1);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    }); 
    it('Should mint', async function () {
        var instance = await SG2Token.new();
        var receipt = await instance.mint(100, {from:accounts[0]});

        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 100);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should fail to free up', async function () {
        var instance = await SG2Token.new();
        expectRevert(instance.free(100, {from: accounts[3]}), 'ERC20: burn amount exceeds balance');
    });

    it('burn gas to find baseline cost', async function () {
        var instance = await SG2Token.new();
        var helper = await SG_Helper.new();

        await instance.mint(100);
        await instance.approve(helper.address, 50, {from: accounts[0]});
        var receipt = await helper.burnGas(5000000, {from: accounts[0]});

        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(true, true);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });


    it('Should burn gas and free from', async function () {
        var instance = await SG2Token.new();
        var helper = await SG_Helper.new();

        await instance.mint(100);
        await instance.approve(helper.address, 50, {from: accounts[0]});
        var receipt = await helper.burnGasAndFreeFrom(instance.address, 5000000, 50, {from: accounts[0]});

        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 50;

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should burn Gas And Free', async function () {
        var instance = await SG2Token.new();
        var helper = await SG_Helper.new();

        await instance.mint(100);
        await instance.transfer(helper.address, 75, {from: accounts[0]});
        var receipt = await helper.burnGasAndFree(instance.address, 5000000, 75, {from: accounts[0]});

        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 25);        

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should burn Gas And Free Up To', async function () {
        var instance = await SG2Token.new();
        var helper = await SG_Helper.new();

        await instance.mint(100);
        await instance.transfer(helper.address, 75, {from: accounts[0]});
        var receipt = await helper.burnGasAndFreeUpTo(instance.address, 5000000, 75, {from: accounts[0]});

        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 25);   
        
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should burn Gas And Free From Up To', async function () {
        var instance = await SG2Token.new();
        var helper = await SG_Helper.new();

        await instance.mint(100);
        await instance.approve(helper.address, 75, {from: accounts[0]});
        var receipt = await helper.burnGasAndFreeFromUpTo(instance.address, 5000000, 70, {from: accounts[0]});
        
        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 30); 
        
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });
        */
});
