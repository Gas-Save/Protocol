const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const SG3Token  = artifacts.require ("./SG3Token.sol");
const SG3_helper  = artifacts.require ("./test_helpers/SG3_helper.sol");

contract("SG3 Token Test", async accounts => {
    
    it("should be able to init contract", async () => {


        const rlp = require('rlp');
        const keccak = require('keccak');
        
        var nonce = 0x00; //The nonce must be a hex literal!
        var sender = accounts[9]; //Requires a hex string as input!
        
        var input_arr = [ sender, nonce ];
        var rlp_encoded = rlp.encode(input_arr);
        
        var contract_address_long = keccak('keccak256').update(rlp_encoded).digest('hex');
        
        var contract_address = contract_address_long.substring(24); //Trim the first 24 characters.
        console.log("contract_address: " + contract_address);
        
        const account_one = accounts[0];
        var instance = await SG3Token.new();
        const amountMint = 100;

        var receipt = await instance.mint(amountMint, {from: accounts[1]})
        const balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 99);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });


    it("should be able to mint tokens", async () => {
        
        const account_one = accounts[0];
        var instance = await SG3Token.new();
        const amountMint = 100;

        var receipt = await instance.mint(amountMint, {from: accounts[1]})
        const balance = await instance.balanceOf.call(accounts[1]);
        assert.equal(balance.toNumber(), 99);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it("should be able to get fee of tokens", async () => {
        const account_one = accounts[0];
        var instance = await SG3Token.new();
        const amountMint = 100;

        var receipt = await instance.mint(amountMint, {from: accounts[1]})

        const balance = await instance.balanceOf.call(accounts[0]);
        assert.equal(balance.toNumber(), 1);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    }); 
    it('Should mint', async function () {
        var instance = await SG3Token.new();
        var receipt = await instance.mint(100, {from:accounts[0]});

        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 100);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should fail to free up', async function () {
        var instance = await SG3Token.new();
        expectRevert(instance.free(100, {from: accounts[3]}), 'ERC20: burn amount exceeds balance');
    });

    it('burn gas to find baseline cost', async function () {
        var instance = await SG3Token.new();
        var helper = await SG3_helper.new();

        await instance.mint(100);
        await instance.approve(helper.address, 50, {from: accounts[0]});
        var receipt = await helper.burnGas(5000000, {from: accounts[0]});

        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(true, true);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });


    it('Should burn gas and free from', async function () {
        var instance = await SG3Token.new();
        var helper = await SG3_helper.new();

        await instance.mint(100);
        await instance.approve(helper.address, 50, {from: accounts[0]});
        var receipt = await helper.burnGasAndFreeFrom(instance.address, 5000000, 50, {from: accounts[0]});

        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 51);

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should burn Gas And Free', async function () {
        var instance = await SG3Token.new();
        var helper = await SG3_helper.new();

        await instance.mint(100);
        await instance.transfer(helper.address, 75, {from: accounts[0]});
        var receipt = await helper.burnGasAndFree(instance.address, 5000000, 75, {from: accounts[0]});

        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 26);        

        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should burn Gas And Free Up To', async function () {
        var instance = await SG3Token.new();
        var helper = await SG3_helper.new();

        await instance.mint(100);
        await instance.transfer(helper.address, 75, {from: accounts[0]});
        var receipt = await helper.burnGasAndFreeUpTo(instance.address, 5000000, 75, {from: accounts[0]});

        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 26);   
        
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });

    it('Should burn Gas And Free From Up To', async function () {
        var instance = await SG3Token.new();
        var helper = await SG3_helper.new();

        await instance.mint(100);
        await instance.approve(helper.address, 75, {from: accounts[0]});
        var receipt = await helper.burnGasAndFreeFromUpTo(instance.address, 5000000, 70, {from: accounts[0]});
        
        var total_supply =  await instance.totalSupply.call()
        total_supply = total_supply.toNumber()
        assert.equal(total_supply, 31); 
        
        console.log(`GasUsed: ${receipt.receipt.gasUsed}`);
    });
    
});
