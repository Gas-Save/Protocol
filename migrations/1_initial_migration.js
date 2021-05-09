var gsvetoken  = artifacts.require ("./GSVEToken.sol");
var wrappedToken = artifacts.require("./WrappedGasToken.sol");
var GSVEVault = artifacts.require ("./GSVEVault.sol");
var GS_Deployer  = artifacts.require ("./GSVEDeployer.sol");
var GS_WrapperFactory  = artifacts.require ("./GSVESmartWrapperFactory.sol");
var GS_Wrapper  = artifacts.require ("./GSVESmartWrapper.sol");
var GSVEProtocolCore = artifacts.require ("./GSVECore.sol");


module.exports = async(deployer) => {
  var vault = await deployer.deploy(GSVEVault)
  var token = await deployer.deploy(gsvetoken)
  var wchi = await deployer.deploy(wrappedToken,"0x0000000000004946c0e9F43F4Dee607b0eF1fA1c", "Wrapped Chi by Gas Save", "wChi")
  var wgst2 = await deployer.deploy(wrappedToken,"0x0000000000b3F879cb30FE243b4Dfee438691c04", "Wrapped GST2 by Gas Save", "wGST2")
  var wgst1 = await deployer.deploy(wrappedToken,"0x88d60255F917e3eb94eaE199d827DAd837fac4cB", "Wrapped GST1 by Gas Save", "wGST1")
  var deployercontract = await deployer.deploy(GS_Deployer)
  var wrapperMain = await deployer.deploy(GS_Wrapper, gsvetoken.address)
  var wrapperFactory = await deployer.deploy(GS_WrapperFactory, GS_Wrapper.address, gsvetoken.address)
  var core = await deployer.deploy(GSVEProtocolCore, gsvetoken.address, GSVEVault.address)

  console.log("Setting up contracts")
  var vaultInstance = await GSVEVault.at(GSVEVault.address);
  console.log("vault: " + GSVEVault.address)
  await vaultInstance.transferOwnership(GSVEProtocolCore.address)

  var wChiInstance = await wrappedToken.at(wchi.address)
  console.log("wchi: " + wchi.address)
  await wChiInstance.updateFeeAddress(GSVEVault.address)
  await wChiInstance.transferOwnership(GSVEProtocolCore.address)

  var wgst2Instance = await wrappedToken.at(wgst2.address)
  console.log("wgst2: " + wgst2.address)
  await wgst2Instance.updateFeeAddress(GSVEVault.address)
  await wgst2Instance.transferOwnership(GSVEProtocolCore.address)

  var wgst1Instance = await wrappedToken.at(wgst1.address)
  console.log("wgst1: " + wgst1.address)
  await wgst1Instance.updateFeeAddress(GSVEVault.address)
  await wgst1Instance.transferOwnership(GSVEProtocolCore.address)

  var coreInstance = await GSVEProtocolCore.at(GSVEProtocolCore.address)
  console.log("core: " + GSVEProtocolCore.address)
  await coreInstance.addGasToken("0x0000000000004946c0e9F43F4Dee607b0eF1fA1c", 1, true); // chi
  await coreInstance.addGasToken("0x0000000000b3F879cb30FE243b4Dfee438691c04", 1, true); // gst2
  await coreInstance.addGasToken("0x88d60255F917e3eb94eaE199d827DAd837fac4cB", 1, true); //gst1
  await coreInstance.addGasToken(wchi.address, 2, true); //wchi
  await coreInstance.addGasToken(wgst2.address, 2, true); //wgst2
  await coreInstance.addGasToken(wgst1.address, 2, true); //wgst1

  var wrapperFactoryInstance = await GS_WrapperFactory.at(wrapperFactory.address)
  console.log("factory: " + wrapperFactory.address)
  await wrapperFactoryInstance.addGasToken(wchi.address, 24000); //wchi
  await wrapperFactoryInstance.addGasToken(wgst2.address, 24000); //wgst2
  await wrapperFactoryInstance.addGasToken(wgst1.address, 15000); //wgst1
  await wrapperFactoryInstance.transferOwnership(GSVEProtocolCore.address)

  var deployercontractInstance = await GS_Deployer.at(deployercontract.address)
  console.log("deployer: " + deployercontract.address)
  await deployercontractInstance.addGasToken(wchi.address, 41130); //wchi
  await deployercontractInstance.addGasToken(wgst2.address, 41130); //wgst2
  await deployercontractInstance.addGasToken(wgst1.address, 25130); //wgst1
  await deployercontractInstance.transferOwnership(GSVEProtocolCore.address)

  var wrapperMainInstance = await GS_WrapperFactory.at(GS_Wrapper.address)
  console.log("wrapper: " + GS_Wrapper.address)
  await wrapperMainInstance.transferOwnership(GSVEProtocolCore.address)
  
};