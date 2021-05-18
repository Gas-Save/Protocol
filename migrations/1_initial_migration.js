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
  
  //var wchi =  await deployer.deploy(wrappedToken, "0x0000000000004946c0e9F43F4Dee607b0eF1fA1c", vaultAddress, "Wrapped Chi by Gas Save", "wChi")
  var wchiAddress = "0x47536fD7C0CDb9338Ce495694BE6463A30314582"

  //var wgst2 = await deployer.deploy(wrappedToken, "0x0000000000b3F879cb30FE243b4Dfee438691c04", vaultAddress, "Wrapped GST2 by Gas Save", "wGST2")
  var wgst2Address = "0x1f4DD5A297ca59Cc086F6F24c36A8A032C4ddbAD"
  
  //var wgst1 = await deployer.deploy(wrappedToken, "0x88d60255F917e3eb94eaE199d827DAd837fac4cB", vaultAddress, "Wrapped GST1 by Gas Save", "wGST1")
  var wgst1Address = "0xE39B8DC27FfdcA3f2591Eb801C7548fCe7d87D72"
  
  var deployercontract = await deployer.deploy(GS_Deployer, wchiAddress, wgst2Address, wgst1Address)
  var wrapperMain = await deployer.deploy(GS_Wrapper)
  var wrapperFactory = await deployer.deploy(GS_WrapperFactory, GS_Wrapper.address, tokenAddress)
  var core = await deployer.deploy(GSVEProtocolCore, tokenAddress, vaultAddress, wchiAddress, wgst2Address, wgst1Address)

  /*
  console.log("Setting up contracts")
  console.log("GSVE Token: " + tokenAddress)
  
  var vaultInstance = await GSVEVault.at(vaultAddress);
  console.log("vault: " + vaultAddress)
  await vaultInstance.transferOwnership(GSVEProtocolCore.address)

  var wChiInstance = await wrappedToken.at(wchiAddress)
  console.log("wchi: " + wchiAddress)
  await wChiInstance.transferOwnership(GSVEProtocolCore.address)

  var wgst2Instance = await wrappedToken.at(wgst2Address)
  console.log("wgst2: " + wgst2Address)
  await wgst2Instance.transferOwnership(GSVEProtocolCore.address)

  var wgst1Instance = await wrappedToken.at(wgst1Address)
  console.log("wgst1: " + wgst1Address)
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

  var beacon = await deployer.deploy(GSVEBeacon,wchiAddress, wgst2Address, wgst1Address)
  console.log("beacon: " + GSVEBeacon.address)
  */
};