const _deploy_contracts = require("../migrations/2_deploy_contracts");

var BlingToken = artifacts.require("./BlingToken.sol");
var BlingTokenSale = artifacts.require("./BlingTokenSale.sol");

contract('BlingTokenSale', function (accounts) {
    var tokenSaleInstance;
    var tokenInstance;
    var admin = accounts[0];
    var buyer = accounts[1];
    var tokenPrice = 1000000000000000; // in Wei
    var tokensAvailable = 750000;
    var numberOfTokens;

    it('initializes the contract with the correct values', function () {
        return BlingTokenSale.deployed().then(function (instance) {
            tokenSaleInstance = instance;
            return tokenSaleInstance.address;
        }).then(function (address) {
            assert.notEqual(address, 0x0, 'has contract address');
            return tokenSaleInstance.tokenContract();
        }).then(function (address) {
            assert.notEqual(address, 0x0, 'has token contract address');
            return tokenSaleInstance.tokenPrice();
        }).then(function (price) {
            assert.equal(price, tokenPrice, 'token price is correct');
        });
    });

    it('facilitates token buying', function () {
        return BlingToken.deployed().then(function (instance) {
            // Grab token instance first
            tokenInstance = instance;
            return BlingTokenSale.deployed();
        }).then(function (instance) {
            // Then grab token sale instance
            tokenSaleInstance = instance;
            // Provision 75% of all tokens to the token sale
            return tokenInstance.transfer(tokenSaleInstance.address, tokensAvailable, { from: admin });
        }).then(function (receipt) {
            numberOfTokens = 10;
            return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice });
        }).then(function (receipt) {
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
            assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
            assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
            return tokenSaleInstance.tokensSold();
        }).then(function (amount) {
            assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold');
            return tokenInstance.balanceOf(buyer);
        }).then(function (balance) {
            assert.equal(balance, numberOfTokens);
            return tokenInstance.balanceOf(tokenSaleInstance.address);
        }).then( async function (balance) {
            assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens);
            // Try to buy tokens with wrong ether value
            return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 });
        }).then(assert.fail).catch(function (error) {
            assert(error.message.toString().indexOf('revert') >= 0, 'msg.value must equal number of tokens in Wei');
            // Try to buy more tokens than are available
            return tokenSaleInstance.buyTokens(800000, { from: buyer, value: 800000 * tokenPrice });
        }).then(assert.fail).catch( async function (error) {
            assert(error.message.toString().indexOf('revert') >= 0, 'cannot purchase more tokens than available');
        });
    });

    it('ends token sale', function () {
        return BlingToken.deployed().then(function (instance) {
            tokenInstance = instance;
            return BlingTokenSale.deployed();
        }).then(function (instance) {
            tokenSaleInstance = instance;
            // Try to end sale from account other than admin
            return tokenSaleInstance.endSale({ from: buyer });
        }).then(assert.fail).catch(function(error) {
            assert(error.message.toString().indexOf('revert') >= 0, 'must be admin to end sale');
            return tokenSaleInstance.endSale({ from: admin });
        }).then( async function(receipt) {
            var balance = await tokenInstance.balanceOf(admin);
            assert.equal(balance.toNumber(), 999990, 'returns all unsold Bling Tokens to admin');
            // Check if token price was reset when selfDestruct was called
            // var price = await tokenSaleInstance.tokenPrice();
            // assert.equal(price.toNumber(), 0, 'token price was reset');
        });
    });
});