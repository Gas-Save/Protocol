const { BN, expectRevert, send, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const GSVEBeacon  = artifacts.require ("./GSVEBeacon.sol");


contract("GSVE Beacon Test", async accounts => {
    var beacon;

    it('should be able to deploy beacon contract', async () => {
      beacon = await GSVEBeacon.new("0x0000000000004946c0e9F43F4Dee607b0eF1fA1c", "0x0000000000b3F879cb30FE243b4Dfee438691c04", "0x88d60255F917e3eb94eaE199d827DAd837fac4cB");
    });

    it('should be able init the gas token used by a safe', async () => {
      await beacon.initSafe(accounts[0], beacon.address);
      var tokenUsed = await beacon.getAddressGastoken.call(beacon.address);
      var set = false
      if(tokenUsed !== "0x0000000000000000000000000000000000000000"){
        set = true
      }
      assert.equal(true, set)

    });

    it('should be able to add get the gas savings of an address', async () => {
      var saving = await beacon.getAddressGasTokenSaving.call(beacon.address);
      assert.equal(24000, saving)
    });

    it('should be able to get the gas safe address of an address', async () => {
      var address = await beacon.getDeployedAddress.call(accounts[0]);
      assert.equal(address, beacon.address)
    });

    it('should be able to get the gas token and saving for a safe', async () => {
      var addresssaving = await beacon.getGasTokenAndSaving.call(accounts[0]);
      console.log(addresssaving)
    });

    it('should fail init if not owner', async () => {
      expectRevert(beacon.initSafe(accounts[1], beacon.address, {from:accounts[1]}), 'Ownable: caller is not the owner.');
    });

    it('should fail init if already initd', async () => {
      expectRevert(beacon.initSafe(accounts[0], beacon.address), "GSVE: address already init'd");
    });

    it('should be able to update the token used by an address', async () => {
      await beacon.setAddressGasToken(beacon.address, "0x88d60255F917e3eb94eaE199d827DAd837fac4cB");
      var tokenUsed = await beacon.getAddressGastoken.call(beacon.address);
      var set = false
      if(tokenUsed ===  "0x88d60255F917e3eb94eaE199d827DAd837fac4cB"){
        set = true
      }
      assert.equal(true, set)

    });

    it('should fail to update the token used by an address if not owner', async () => {
      expectRevert(beacon.setAddressGasToken(beacon.address, "0x88d60255F917e3eb94eaE199d827DAd837fac4cB", {from:accounts[1]}), "GSVE: Sender is not the safe creator");
    });

    it('should fail to update the token used by an address if it is incorrect ', async () => {
      expectRevert(beacon.setAddressGasToken(beacon.address, "0x0000000000000000000000000000000000000001"), "GSVE: Invalid Gas Token");
    });

    it('should be able to update the token used by an address to 0x00', async () => {
      await beacon.setAddressGasToken(beacon.address, "0x0000000000000000000000000000000000000000");
      var tokenUsed = await beacon.getAddressGastoken.call(beacon.address);
      var set = false
      if(tokenUsed === "0x0000000000000000000000000000000000000000"){
        set = true
      }
      assert.equal(true, set)
    });


});
