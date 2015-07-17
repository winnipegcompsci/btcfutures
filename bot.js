// Requires.
var btcstats = require('btc-stats');
var http = require('http');
var async = require('async');
var Q = require('q');
var clc = require('cli-color');
var fs = require('fs');

var util = require('util');

var DATA = {
    OKCOIN: {},
    FUTURES796: {}
};

// OKCOIN 
var OKCoin = require('okcoin');
var okcoin_key = process.argv[2] || 'a3df6a8b-2799-4988-9336-e4ce74b88408';
var okcoin_secret = process.argv[3] || 'C890A97000A0A5102CF6462F4F7BDCC1';

var okcoin_public_client = new OKCoin();
var okcoin_private_client = new OKCoin(okcoin_key, okcoin_secret);

// Futures796
var Futures796 = require('futures796');
var sevenninesix_key = process.argv[7] || '9ff4f593-0fd9-aaf9-b09a-8e2b-6b2f449c';
var sevenninesix_secret = process.argv[8] || 'QVx4ZB572LlRqtl9eQzGxm5DEhvZFM0G5JIOrUi3QPQNlinzGoVHfhIg77U9';

var futures796_public_client = new Futures796();
var futures796_private_client = new Futures796(sevenninesix_key, sevenninesix_secret);

var TTL = 10;               // Number of Seconds to Wait.

// Prompt for These Variables
var MAX_COINS_TO_HEDGE = process.argv[4] || 100;
var MAX_BUY_PRICE = process.argv[5] || 350;
var INSURANCE_COVER_RATE = process.argv[6] || 0.70;


futures796_private_client.getUserInfo(function (err, response) {
    if(err) {
        console.log("ERROR: " + err);
    } else {
        console.log("RESPONSE: " + util.inspect(response));
    }
});