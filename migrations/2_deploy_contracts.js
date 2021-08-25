const BlingToken = artifacts.require("BlingToken");

module.exports = function (deployer) {
  deployer.deploy(BlingToken, 1000000);
};
