var SG2Token  = artifacts.require ("./SG2Token.sol");

module.exports = function (deployer) {
  deployer.deploy(SG2Token);
};
