var SG3Token  = artifacts.require ("./SG3Token.sol");

module.exports = function (deployer) {
  deployer.deploy(SG3Token);
};
