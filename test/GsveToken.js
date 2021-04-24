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

      const name = await token.name.call();
      const symbol = await token.symbol.call();
      assert.equal(name.toString(), "Gas Save Utility Token by Gas Save");
      assert.equal(symbol.toString(), "GSVE");
  });

  it("should be able to burn tokens", async () => {

    await token.burn(web3.utils.toWei("1"));
    const New_SUPPLY = web3.utils.toWei('99999999');
    const totalSupply = await token.totalSupply();
    const balanceAdmin = await token.balanceOf(accounts[0]);
    assert.equal(totalSupply.toString(), New_SUPPLY);
    assert.equal(balanceAdmin.toString(), New_SUPPLY);
  });

  it("should not be able to burn tokens if has no tokens", async () => {
    expectRevert(token.burn(web3.utils.toWei("1"), {from:accounts[1]}), 'ERC20: burn amount exceeds balance');
  });

  it("should be able to burn tokens for another account if approved", async () => {
    await token.approve(accounts[1], web3.utils.toWei("1"))
    await token.burnFrom(accounts[0], web3.utils.toWei("1"), {from:accounts[1]});
    const New_SUPPLY = web3.utils.toWei('99999998');
    const totalSupply = await token.totalSupply();
    const balanceAdmin = await token.balanceOf(accounts[0]);
    assert.equal(totalSupply.toString(), New_SUPPLY);
    assert.equal(balanceAdmin.toString(), New_SUPPLY);
  });

  it("should not be able to burn tokens when not approved", async () => {
    expectRevert(token.burnFrom(accounts[0], web3.utils.toWei("1"), {from: accounts[1]}), 'ERC20: burn amount exceeds allowance.');
  });
});
