var bep20 = artifacts.require ("./BEP20Token.sol");

module.exports = function (deployer) {
  deployer.deploy(bep20);
};
