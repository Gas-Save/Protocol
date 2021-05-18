var gsvetoken  = artifacts.require ("./GSVEToken.sol");
var wrappedToken = artifacts.require("./WrappedGasToken.sol");
var GSVEVault = artifacts.require ("./GSVEVault.sol");
var GS_Deployer  = artifacts.require ("./GSVEDeployer.sol");
var GS_WrapperFactory  = artifacts.require ("./GSVESmartWrapperFactory.sol");
var GS_Wrapper  = artifacts.require ("./GSVESmartWrapper.sol");
var GSVEProtocolCore = artifacts.require ("./GSVECore.sol");
var GSVEBeacon  = artifacts.require ("./GSVEBeacon.sol");


module.exports = async(deployer) => {
  
  //var token = await deployer.deploy(gsvetoken)
  var tokenAddress = "0x000000000000e01999859eebfe39ecd039f67a54"
  
  //var vault = await deployer.deploy(GSVEVault)
  var vaultAddress = "0x9E4309be6aC12dE5A9a979047ff426F5Aa73D908"
  
  var wchi =  await deployer.deploy(wrappedToken, "0x0000000000004946c0e9F43F4Dee607b0eF1fA1c", vaultAddress, "Wrapped Chi by Gas Save", "wChi")
  var wgst2 = await deployer.deploy(wrappedToken, "0x0000000000b3F879cb30FE243b4Dfee438691c04", vaultAddress, "Wrapped GST2 by Gas Save", "wGST2")
  var wgst1 = await deployer.deploy(wrappedToken, "0x88d60255F917e3eb94eaE199d827DAd837fac4cB", vaultAddress, "Wrapped GST1 by Gas Save", "wGST1")
  var deployercontract = await deployer.deploy(GS_Deployer, wchi.address, wgst2.address, wgst1.address)
  var wrapperMain = await deployer.deploy(GS_Wrapper)
  var wrapperFactory = await deployer.deploy(GS_WrapperFactory, GS_Wrapper.address, tokenAddress)
  var core = await deployer.deploy(GSVEProtocolCore, tokenAddress, vaultAddress, wchi.address, wgst2.address, wgst1.address)

  console.log("Setting up contracts")
  console.log("GSVE Token: " + tokenAddress)
  
  var vaultInstance = await GSVEVault.at(vaultAddress);
  console.log("vault: " + vaultAddress)
  await vaultInstance.transferOwnership(GSVEProtocolCore.address)

  var wChiInstance = await wrappedToken.at(wchi.address)
  console.log("wchi: " + wchi.address)
  await wChiInstance.transferOwnership(GSVEProtocolCore.address)

  var wgst2Instance = await wrappedToken.at(wgst2.address)
  console.log("wgst2: " + wgst2.address)
  await wgst2Instance.transferOwnership(GSVEProtocolCore.address)

  var wgst1Instance = await wrappedToken.at(wgst1.address)
  console.log("wgst1: " + wgst1.address)
  await wgst1Instance.transferOwnership(GSVEProtocolCore.address)

  var coreInstance = await GSVEProtocolCore.at(GSVEProtocolCore.address)
  console.log("core: " + GSVEProtocolCore.address)

  var wrapperFactoryInstance = await GS_WrapperFactory.at(wrapperFactory.address)
  console.log("factory: " + wrapperFactory.address)
  await wrapperFactoryInstance.transferOwnership(GSVEProtocolCore.address)

  var deployercontractInstance = await GS_Deployer.at(deployercontract.address)
  console.log("deployer: " + deployercontract.address)
  await deployercontractInstance.transferOwnership(GSVEProtocolCore.address)

  var wrapperMainInstance = await GS_Wrapper.at(GS_Wrapper.address)
  console.log("wrapper: " + GS_Wrapper.address)
  await wrapperMainInstance.transferOwnership(GSVEProtocolCore.address)

  var beacon = await deployer.deploy(GSVEBeacon,wchi.address, wgst2.address, wgst1.address)
  console.log("beacon: " + GSVEBeacon.address)

};