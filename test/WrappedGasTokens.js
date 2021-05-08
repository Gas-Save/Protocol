const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const GSVE_helper = artifacts.require("./test_helpers/GSVE_helper.sol");
const wrappedToken = artifacts.require("./WrappedGasToken.sol");
const ChiGasToken = artifacts.require("./existing_gas_tokens/Chi/ChiToken.sol");
const GST2GasToken = artifacts.require("./existing_gas_tokens/GST/GasToken2.sol");
const GST1GasToken = artifacts.require("./existing_gas_tokens/GST/GasToken1.sol");

var instance;
var baseGasToken;
var helper;
const amountMint = 100;

contract("Wrapped ChiToken Token Test", async accounts => {

    it("should be able deploy contracts", async () => {

        baseGasToken = await ChiGasToken.at("0x0000000000004946c0e9F43F4Dee607b0eF1fA1c");
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
        await baseGasToken.mint(amountMint, { from: accounts[1] });
        await baseGasToken.approve(instance.address, amountMint, { from: accounts[1] });
        var receipt = await instance.mint(amountMint, { from: accounts[1] })

        var balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.toNumber(), 3);

        balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 97);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 100);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should fail to free up', async function () {
        expectRevert(instance.free(amountMint, { from: accounts[2] }), 'ERC20: burn amount exceeds balance');
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

        var total_supply = await instance.totalSupply.call()
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

        var total_supply = await instance.totalSupply.call()
        assert.equal(total_supply.toNumber(), 97);

        var balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.toNumber(), 0);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 97);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });


    it('Should burn Gas And Free', async function () {

        await instance.transfer(helper.address, 47, { from: accounts[1] });
        var receipt = await helper.burnGasAndFree(instance.address, 1000000, 47, { from: accounts[1] });

        var total_supply = await instance.totalSupply.call()
        assert.equal(total_supply.toNumber(), 50);

        var balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 50);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 50);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should burn Gas And Free Up To', async function () {
        await instance.transfer(helper.address, 50, { from: accounts[1] });
        var receipt = await helper.burnGasAndFreeUpTo(instance.address, 1000000, 50, { from: accounts[1] });

        var total_supply = await instance.totalSupply.call()
        assert.equal(total_supply.toNumber(), 0);

        var balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 0);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 0);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });


    it("should be able to mint & wrap and then unwrap", async () => {
        await baseGasToken.mint(100, { from: accounts[1] });
        await baseGasToken.approve(instance.address, 100, { from: accounts[1] });
        await instance.mint(100, { from: accounts[1] })
        var receipt = await instance.unwrap(97, { from: accounts[1] })

        balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 0);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 3);

        balance = await baseGasToken.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 97);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should fail to un wrap when not enough tokens', async () => {
        expectRevert(instance.unwrap(10), "ERC20: burn amount exceeds balance")
    });

    it("should be able to transfer ownership of the token", async () => {
        await instance.transferOwnership(accounts[2]);
        var owner = await instance.owner()
        assert.equal(owner, accounts[2]);
    });


    it('should fail to update fee address if not owner', async () => {
        expectRevert(instance.updateFeeAddress(accounts[1], { from: accounts[1] }), "Ownable: caller is not the owner.")
    });

    it('should fail to transfer ownership if not owner', async () => {
        expectRevert(instance.transferOwnership(accounts[1], { from: accounts[1] }), "Ownable: caller is not the owner.")
    });

    it("should be able to update fee address", async () => {
        await instance.updateFeeAddress(accounts[2], { from: accounts[2] });
        var fees = await instance.feeAddress.call()
        assert.equal(fees, accounts[2]);
    });

});

contract("Wrapped GST2 Token Test", async accounts => {

    it("should be able deploy contracts", async () => {

        baseGasToken = await GST2GasToken.at("0x0000000000b3F879cb30FE243b4Dfee438691c04");
        instance = await wrappedToken.new(baseGasToken.address, "Wrapped GST2 by Gas Save", "wGST2");


        helper = await GSVE_helper.new();
    });

    it("name and symbol should be correct", async () => {

        const name = await instance.name.call();
        const symbol = await instance.symbol.call();

        assert.equal(name.toString(), "Wrapped GST2 by Gas Save");
        assert.equal(symbol.toString(), "wGST2");


    });

    it("should be able to mint & wrap from contracts. Fee and balances should be correct", async () => {
        await baseGasToken.mint(amountMint, { from: accounts[1] });
        await baseGasToken.approve(instance.address, amountMint, { from: accounts[1] });
        var receipt = await instance.mint(amountMint, { from: accounts[1] })

        var balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.toNumber(), 3);

        balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 97);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 100);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should fail to free up', async function () {
        expectRevert(instance.free(amountMint, { from: accounts[2] }), 'ERC20: burn amount exceeds balance');
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

        var total_supply = await instance.totalSupply.call()
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

        var total_supply = await instance.totalSupply.call()
        assert.equal(total_supply.toNumber(), 97);

        var balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.toNumber(), 0);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 97);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });


    it('Should burn Gas And Free', async function () {

        await instance.transfer(helper.address, 47, { from: accounts[1] });
        var receipt = await helper.burnGasAndFree(instance.address, 1000000, 47, { from: accounts[1] });

        var total_supply = await instance.totalSupply.call()
        assert.equal(total_supply.toNumber(), 50);

        var balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 50);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 50);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should burn Gas And Free Up To', async function () {
        await instance.transfer(helper.address, 50, { from: accounts[1] });
        var receipt = await helper.burnGasAndFreeUpTo(instance.address, 1000000, 50, { from: accounts[1] });

        var total_supply = await instance.totalSupply.call()
        assert.equal(total_supply.toNumber(), 0);

        var balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 0);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 0);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it("should be able to mint & wrap and then unwrap", async () => {
        await baseGasToken.mint(100, { from: accounts[1] });
        await baseGasToken.approve(instance.address, 100, { from: accounts[1] });
        await instance.mint(100, { from: accounts[1] })
        var receipt = await instance.unwrap(97, { from: accounts[1] })

        balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 0);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 3);

        balance = await baseGasToken.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 97);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should fail to un wrap when not enough tokens', async () => {
        expectRevert(instance.unwrap(10), "ERC20: burn amount exceeds balance")
    });

    it("should be able to transfer ownership of the token", async () => {
        await instance.transferOwnership(accounts[2]);
        var owner = await instance.owner()
        assert.equal(owner, accounts[2]);
    });

    it('should fail to update fee address if not owner', async () => {
        expectRevert(instance.updateFeeAddress(accounts[1], { from: accounts[1] }), "Ownable: caller is not the owner.")
    });

    it('should fail to transfer ownership if not owner', async () => {
        expectRevert(instance.transferOwnership(accounts[1], { from: accounts[1] }), "Ownable: caller is not the owner.")
    });

    it("should be able to update fee address", async () => {
        await instance.updateFeeAddress(accounts[2], { from: accounts[2] });
        var fees = await instance.feeAddress.call()
        assert.equal(fees, accounts[2]);
    });

});

contract("Wrapped GST1 Token Test", async accounts => {

    it("should be able deploy contracts", async () => {

        baseGasToken = await GST1GasToken.at("0x88d60255F917e3eb94eaE199d827DAd837fac4cB");
        instance = await wrappedToken.new(baseGasToken.address, "Wrapped GST1 by Gas Save", "wGST1");
        helper = await GSVE_helper.new();
    });

    it("name and symbol should be correct", async () => {

        const name = await instance.name.call();
        const symbol = await instance.symbol.call();

        assert.equal(name.toString(), "Wrapped GST1 by Gas Save");
        assert.equal(symbol.toString(), "wGST1");
    });

    it("should be able to mint & wrap from contracts. Fee and balances should be correct", async () => {
        await baseGasToken.mint(amountMint, { from: accounts[1] });
        await baseGasToken.approve(instance.address, amountMint, { from: accounts[1] });
        var receipt = await instance.mint(amountMint, { from: accounts[1] })

        var balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.toNumber(), 3);

        balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 97);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 100);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should fail to free up', async function () {
        expectRevert(instance.free(amountMint, { from: accounts[2] }), 'ERC20: burn amount exceeds balance');
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

        var total_supply = await instance.totalSupply.call()
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

        var total_supply = await instance.totalSupply.call()
        assert.equal(total_supply.toNumber(), 97);

        var balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.toNumber(), 0);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 97);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });


    it('Should burn Gas And Free', async function () {

        await instance.transfer(helper.address, 47, { from: accounts[1] });
        var receipt = await helper.burnGasAndFree(instance.address, 1000000, 47, { from: accounts[1] });

        var total_supply = await instance.totalSupply.call()
        assert.equal(total_supply.toNumber(), 50);

        var balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 50);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 50);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should burn Gas And Free Up To', async function () {
        await instance.transfer(helper.address, 50, { from: accounts[1] });
        var receipt = await helper.burnGasAndFreeUpTo(instance.address, 1000000, 50, { from: accounts[1] });

        var total_supply = await instance.totalSupply.call()
        assert.equal(total_supply.toNumber(), 0);

        var balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 0);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 0);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });


    it("should be able to mint & wrap and then unwrap", async () => {
        await baseGasToken.mint(100, { from: accounts[1] });
        await baseGasToken.approve(instance.address, 100, { from: accounts[1] });
        await instance.mint(100, { from: accounts[1] })
        var receipt = await instance.unwrap(97, { from: accounts[1] })

        balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 0);

        balance = await baseGasToken.balanceOf.call(instance.address);
        assert.equal(balance.toNumber(), 3);

        balance = await baseGasToken.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 97);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('should fail to un wrap when not enough tokens', async () => {
        expectRevert(instance.unwrap(10), "ERC20: burn amount exceeds balance")
    });

    it("should be able to transfer ownership of the token", async () => {
        await instance.transferOwnership(accounts[2]);
        var owner = await instance.owner()
        assert.equal(owner, accounts[2]);
    });


    it('should fail to update fee address if not owner', async () => {
        expectRevert(instance.updateFeeAddress(accounts[1], { from: accounts[1] }), "Ownable: caller is not the owner.")
    });

    it('should fail to transfer ownership if not owner', async () => {
        expectRevert(instance.transferOwnership(accounts[1], { from: accounts[1] }), "Ownable: caller is not the owner.")
    });

    it("should be able to update fee address", async () => {
        await instance.updateFeeAddress(accounts[2], { from: accounts[2] });
        var fees = await instance.feeAddress.call()
        assert.equal(fees, accounts[2]);
    });

});
