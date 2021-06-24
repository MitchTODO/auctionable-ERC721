// migrating the appropriate contracts
var TenderToken = artifacts.require("./Tender.sol");

module.exports = function(deployer) {
  const name = "400 9mm Rounds"
  const symbol = "WS"
  deployer.deploy(TenderToken,name,symbol);
};
