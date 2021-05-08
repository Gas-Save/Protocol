var token  = artifacts.require ("./GSVEToken.sol");

module.exports = function (deployer) {
  deployer.deploy(token);
};
