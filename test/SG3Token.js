const SG3Token  = artifacts.require ("./SG3Token.sol");

contract("SG3 Token Test", async accounts => {

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
});