const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const GSVEToken  = artifacts.require ("./GSVEToken.sol");
const GSVEVault = artifacts.require ("./GSVEVault.sol");

contract("GSVE Vault Test", async accounts => {
    var token;
    var vault;

    it('should be able to deploy vault contract', async () => {
      token = await GSVEToken.new();
      vault = await GSVEVault.new();
    });

    it('should be able to add send a token to the vault', async () => {
      await token.transfer(vault.address, web3.utils.toWei("10"));
      const vaultTokenBalance = await token.balanceOf.call(vault.address);
      assert.equal(vaultTokenBalance.toString(), web3.utils.toWei("10"));
    });

    it('should be able to transfer tokens from vault as owner', async () => {
      await vault.transferToken(token.address, accounts[1], web3.utils.toWei("6"))
      var vaultTokenBalance = await token.balanceOf.call(vault.address);
      var addressTokenBalance = await token.balanceOf.call(accounts[1]);
      assert.equal(vaultTokenBalance.toString(), web3.utils.toWei("4"));
      assert.equal(addressTokenBalance.toString(), web3.utils.toWei("6"));
    });

    it('should fail to transfer if not the owner', async () => {
      expectRevert(vault.transferToken(token.address, accounts[1], web3.utils.toWei("2"), {from:accounts[1]}), 'Ownable: caller is not the owner.');
    });

    it("should be able to transfer ownership of the vault", async () => {
      await vault.transferOwnership(accounts[2]);
      var owner = await vault.owner()
      assert.equal(owner, accounts[2]);
    });
});
