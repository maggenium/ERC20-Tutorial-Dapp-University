const BlingToken = artifacts.require("BlingToken");
const BlingTokenSale = artifacts.require("BlingTokenSale");

module.exports = function (deployer) {
  deployer.deploy(BlingToken, 1000000).then(function() {
    // Token price is 0.001 Ether
    tokenPrice = 1000000000000000;
    return deployer.deploy(BlingTokenSale, BlingToken.address, tokenPrice);
  });
};
