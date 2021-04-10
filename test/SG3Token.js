const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const SG3Token  = artifacts.require ("./SG3Token.sol");
const SG3_helper  = artifacts.require ("./test_helpers/SG3_helper.sol");

contract("SG3 Token Test", async accounts => {
    /*
    it("should be able to mint tokens", async () => {
        const account_one = accounts[0];
        var instance = await SG3Token.new();
        const amountMint = 100;

        var receipt = await instance.mint(amountMint, {from: accounts[1]})
        const balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 99);

        const gasUsed = receipt.receipt.gasUsed;
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it("should be able to get fee of tokens", async () => {
        const account_one = accounts[0];
        var instance = await SG3Token.new();
        const amountMint = 100;

        var receipt = await instance.mint(amountMint, {from: accounts[1]})

        const balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.toNumber(), 1);
        const gasUsed = receipt.receipt.gasUsed;
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    }); 
    it('Should mint', async function () {
        var instance = await SG3Token.new();
        await instance.mint(100, {from:accounts[0]});
        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 100);
    });

    it('Should fail to free up', async function () {
        var instance = await SG3Token.new();
        expectRevert(instance.free(100, {from: accounts[3]}), 'ERC20: burn amount exceeds balance');
    });

    it('Should burn gas and free from', async function () {
        var instance = await SG3Token.new();
        var helper = await SG3_helper.new();

        await instance.mint(100);
        await instance.approve(helper.address, 50, {from: accounts[0]});
        await helper.burnGasAndFreeFrom(instance.address, 5000000, 50, {from: accounts[0]});
        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 51);
    });
*/

    it('Should burn Gas And Free', async function () {
        var instance = await SG3Token.new();
        var helper = await SG3_helper.new();

        await instance.mint(100);
        await instance.transfer(helper.address, 75, {from: accounts[0]});
        await helper.burnGasAndFree(instance.address, 5000000, 75, {from: accounts[0]});
        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 26);        
    });
/*
    it('Should burnGasAndFreeUpTo', async function () {
        await this.SG3Token.mint(75);
        await this.SG3Token.transfer(this.SG3_helper.address, 75);
        await this.SG3_helper.burnGasAndFreeUpTo(this.SG3Token.address, 5000000, 75);
        expect((await this.SG3Token.totalSupply()).toString()).to.be.equal('175');
    });

    it('Should burnGasAndFreeFromUpTo', async function () {
        await this.SG3Token.mint(100);
        await this.SG3Token.approve(this.SG3_helper.address, 70);
        await this.SG3_helper.burnGasAndFreeFromUpTo(this.SG3Token.address, 5000000, 70);
        expect((await this.SG3Token.totalSupply()).toString()).to.be.equal('205');
    });
    */
});
