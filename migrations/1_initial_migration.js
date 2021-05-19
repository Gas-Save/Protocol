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
  
  //var deployercontract = await deployer.deploy(GS_Deployer, wchiAddress, wgst2Address, wgst1Address)
  var deployerAddress = "0x96e656e6031184F5b72cE10cf63F9f929E69f00D"

  //var wrapperMain = await deployer.deploy(GS_Wrapper)
  var WrapperMainAddress = "0x066b4DA053BcA54b3e8a8d8372EB8D5324b0c34B"

  //var wrapperFactory = await deployer.deploy(GS_WrapperFactory, WrapperMainAddress, tokenAddress)
  var factoryAddress = "0x53724878Abc584bf28D4b7238D0cB2A026E9DDb2"
  
  //var core = await deployer.deploy(GSVEProtocolCore, tokenAddress, vaultAddress, wchiAddress, wgst2Address, wgst1Address)
  var coreAddress = "0x621C63FE085f99CC270BDB7d70F66b160E78F586"

  /*
  console.log("Setting up contracts")
  console.log("GSVE Token: " + tokenAddress)
  
  var vaultInstance = await GSVEVault.at(vaultAddress);-
  console.log("vault: " + vaultAddress)
  await vaultInstance.transferOwnership(coreAddress)

  var wChiInstance = await wrappedToken.at(wchiAddress)-
  console.log("wchi: " + wchiAddress)
  await wChiInstance.transferOwnership(coreAddress)

  var wgst2Instance = await wrappedToken.at(wgst2Address)-
  console.log("wgst2: " + wgst2Address)
  await wgst2Instance.transferOwnership(coreAddress)

  var wgst1Instance = await wrappedToken.at(wgst1Address)-
  console.log("wgst1: " + wgst1Address)
  await wgst1Instance.transferOwnership(coreAddress)

  var coreInstance = await GSVEProtocolCore.at(coreAddress)-
  console.log("core: " + coreAddress)

  var wrapperFactoryInstance = await GS_WrapperFactory.at(factoryAddress)-
  console.log("factory: " + factoryAddress)
  await wrapperFactoryInstance.transferOwnership(coreAddress)

  var deployercontractInstance = await GS_Deployer.at(deployerAddress)-
  console.log("deployer: " + deployerAddress)
  await deployercontractInstance.transferOwnership(coreAddress)

  var wrapperMainInstance = await GS_Wrapper.at(WrapperMainAddress)
  console.log("wrapper: " + WrapperMainAddress)
  await wrapperMainInstance.transferOwnership(coreAddress)
  */

  var beacon = await deployer.deploy(GSVEBeacon, wchiAddress, wgst2Address, wgst1Address)
  console.log("beacon: " + GSVEBeacon.address)
  
};