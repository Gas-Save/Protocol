var rFuel  = artifacts.require ("./RocketFuel.sol");

module.exports = function (deployer) {
  deployer.deploy(rFuel);
};
