const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const GSVEToken  = artifacts.require ("./GSVEToken.sol");

contract("GSVE Token Test", async accounts => {
    let token;
    const TOTAL_SUPPLY = web3.utils.toWei('100000000');

    before(async () => {
      token = await GSVEToken.new();
    });
  
    it('admin should have total supply', async () => {
      const totalSupply = await token.totalSupply();
      const balanceAdmin = await token.balanceOf(accounts[0]);
      assert.equal(totalSupply.toString(), TOTAL_SUPPLY);
      assert.equal(balanceAdmin.toString(), TOTAL_SUPPLY);
    });

    it("name and symbol should be correct", async () => {

      const name = await instance.token.call();
      const symbol = await instance.token.call();
      assert.equal(name.toString(), "Gas Save Utility Token by Gas Save");
      assert.equal(symbol.toString(), "GSVE");
  });
});
