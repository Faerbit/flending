//var strings = artifacts.require("./strings.sol");
var Lending = artifacts.require("./Lending.sol");

module.exports = function(deployer) {
  //deployer.deploy(strings);
  deployer.deploy(Lending);
  //deployer.autolink();
};
