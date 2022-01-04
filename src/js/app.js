App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    loading: false,
    tokenPrice: 1000000000000000,
    tokensSold: 0,
    tokensAvailable: 750000,

    init: function () {
        console.log("App initialized...");
        return App.initWeb3();
    },

    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            // If a web3 instance is already provided by Meta Mask
            App.web3Provider = ethereum;
            web3 = new Web3(ethereum);
        } else {
            // Specify default instance if no web3 instance provided
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }

        return App.initContracts();
    },

    initContracts: function () {
        $.getJSON("BlingTokenSale.json", function (blingTokenSale) {
            App.contracts.BlingTokenSale = TruffleContract(blingTokenSale);
            App.contracts.BlingTokenSale.setProvider(App.web3Provider);
            App.contracts.BlingTokenSale.deployed().then(function (blingTokenSale) {
                console.log("Bling Token Sale Address:", blingTokenSale.address);
            });
        }).done(function () {
            $.getJSON("BlingToken.json", function (blingToken) {
                App.contracts.BlingToken = TruffleContract(blingToken);
                App.contracts.BlingToken.setProvider(App.web3Provider);
                App.contracts.BlingToken.deployed().then(function (blingToken) {
                    console.log("Bling Token Address:", blingToken.address);
                });

                App.listenForEvents();
                return App.render();
            });
        });
    },

    // Listen for events emitted from the contract
    listenForEvents: function() {
        App.contracts.BlingTokenSale.deployed().then((instance) => {
            instance.Sell({}, {
                fromBlock: 0,
                toBlock: 'latest',
            }).watch((error, event) => {
                console.log("Event triggered: ", event);
                App.render();
            })
        });
    },

    render: function () {
        if (App.loading) {
            return;
        }
        App.loading = true;

        var loader = $('#loader');
        var content = $('#content');

        loader.show();
        content.hide();

        // Load account data
        // web3.eth.getCoinbase(function(err, account) {
        //     if(err === null) {
        //         App.account = account;
        //         $('#accountAddress').html("Your Account: " + account);
        //     }
        // });
        ethereum.request({ method: 'eth_requestAccounts' })
            .then((acc) => {
                App.account = acc[0];
                $('#accountAddress').html("Your Account: " + App.account);
            })
            // .done(() => {
            //     App.loading = false;
            //     loader.hide();
            //     content.show();
            // });
            .catch((err) => {
                console.log("eth_requestAccounts error: " + err);
            });

        // Load token sale contract
        App.contracts.BlingTokenSale.deployed().then((instance) => {
            blingTokenSaleInstance = instance;
            return blingTokenSaleInstance.tokenPrice();
        }).then((tokenPrice) => {
            App.tokenPrice = tokenPrice;
            $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
            return blingTokenSaleInstance.tokensSold();
        }).then((tokensSold) => {
            App.tokensSold = tokensSold.toNumber();//tokensSold.toNumber();
            $('.tokens-sold').html(App.tokensSold);
            $('.tokens-available').html(App.tokensAvailable);

            var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
            $('#progress').css('width', progressPercent + '%');

            // Load token contract
            App.contracts.BlingToken.deployed().then((instance) => {
                blingTokenInstance = instance;
                return blingTokenInstance.balanceOf(App.account);
            }).then((balance) => {
                $('.blng-balance').html(balance.toNumber());

                App.loading = false;
                loader.hide();
                content.show();
            });
        });
    },

    buyTokens: function () {
        $('#content').hide();
        $('#loader').show();
        var numberOfTokens = $('#numberOfTokens').val();
        App.contracts.BlingTokenSale.deployed().then((instance) => {
            return instance.buyTokens(numberOfTokens, {
                from: App.account,
                value: numberOfTokens * App.tokenPrice,
                gas: 500000 // gas limit
            });
        }).then((result) => {
            console.log("Tokens bought...");
            $('form').trigger('reset'); // reset number of tokens in form
            // Wait for Sell event
            // $('#loader').hide();
            // $('#content').show();
        });
    }
}

$(function () {
    $(window).load(function () {
        App.init();
    })
})
