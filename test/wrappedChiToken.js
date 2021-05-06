const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const GSVE_helper  = artifacts.require ("./test_helpers/GSVE_helper.sol");
const wrappedToken  = artifacts.require ("./WrappedGasToken.sol");
const GasToken  = artifacts.require ("./existing_gas_tokens/ChiToken.sol");

var instance;
var baseGasToken;
var helper;
const amountMint = 100;

contract("Wrapped ChiToken Token Test", async accounts => {
 
    it("should be able deploy contracts", async () => {
        baseGasToken = await GasToken.new();
        instance = await wrappedToken.new(baseGasToken.address, "Wrapped Chi by Gas Save", "wChi");    
        helper = await GSVE_helper.new();
    });

    it("name and symbol should be correct", async () => {

        const name = await instance.name.call();
        const symbol = await instance.symbol.call();
        assert.equal(name.toString(), "Wrapped Chi by Gas Save");
        assert.equal(symbol.toString(), "wChi");
    });

    it("should be able to mint & wrap from contracts. Fee and balances should be correct", async () => {
        await baseGasToken.mint(amountMint, {from: accounts[1]});
        await baseGasToken.approve(instance.address, amountMint, {from: accounts[1]});
        var receipt = await instance.mint(amountMint, {from: accounts[1]})

        var balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.toNumber(), 3);
        
        balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 97);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 100);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should fail to free up', async function () {
        expectRevert(instance.free(amountMint, {from: accounts[3]}), 'ERC20: burn amount exceeds balance');
    });

    it('burn gas to find baseline cost', async function () {
        var receipt = await helper.burnGas(1000000);
        assert.equal(true, true);
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should burn gas and free from', async function () {
        await baseGasToken.mint(amountMint);
        await baseGasToken.approve(instance.address, amountMint);

        await instance.mint(amountMint);
        await instance.approve(helper.address, 50);

        var receipt = await helper.burnGasAndFreeFrom(instance.address, 1000000, 50);

        var total_supply =  await instance.totalSupply.call()
        assert.equal(total_supply.toNumber(), 150);

        var balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.toNumber(), 53);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 150);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should burn Gas And Free From Up To', async function () {
        await instance.approve(helper.address, 53);
        var receipt = await helper.burnGasAndFreeFromUpTo(instance.address, 1000000, 53);
        
        var total_supply =  await instance.totalSupply.call()
        assert.equal(total_supply.toNumber(), 97);

        var balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.toNumber(), 0);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 97);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

/*
    it('Should burn Gas And Free', async function () {
        var instance = await GasToken.new();
        var helper = await GSVE_helper.new();

        await instance.mint(100);
        await instance.transfer(helper.address, 75, {from: accounts[0]});
        var receipt = await helper.burnGasAndFree(instance.address, 5000000, 75, {from: accounts[0]});

        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 25);        

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should burn Gas And Free Up To', async function () {
        var instance = await GasToken.new();
        var helper = await GSVE_helper.new();

        await instance.mint(100);
        await instance.transfer(helper.address, 75, {from: accounts[0]});
        var receipt = await helper.burnGasAndFreeUpTo(instance.address, 5000000, 75, {from: accounts[0]});

        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 25);   
        
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });
*/
});
