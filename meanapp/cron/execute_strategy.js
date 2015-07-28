///////////////////////////////////////////////////////////////////////////////
process.env.NODE_ENV = 'development';

var util = require('util');
var btcstats = require('btc-stats');
var http = require('http');
var async = require('async');
var Q = require('q');
var clc = require('cli-color');
var fs = require('fs');
var mongoose = require('../node_modules/mongoose');
mongoose.connect('mongodb://localhost/backtothefutures-dev');

var OKCoin = require('okcoin');
var Futures796 = require('futures796');
var BitVC = require('bitvc');
var TTL = 10;

var TradeModel = require('../app/models/trade.server.model.js');
var UserModel = require('../app/models/user.server.model.js');
var ExchangeModel = require('../app/models/exchange.server.model.js');
var StrategyModel = require('../app/models/strategy.server.model.js');
var PriceModel = require('../app/models/price.server.model.js');
var passport = require('../config/passport');
var exchange = require('../config/express');

var Trades = mongoose.model('Trade');
var Exchanges = mongoose.model('Exchange');
var Strategies = mongoose.model('Strategy');
var Prices = mongoose.model('Price');
///////////////////////////////////////////////////////////////////////////////

executeStrategy();

function executeStrategy() {
    Strategies.find({"enabled":true}, function(err, strategies) {
        if(err) {
            console.log("Error: %s", err);
        }
        
        for(var i = 0; i < strategies.length; i++) {
            if(strategies[i].name.toLowerCase() === 'long biased hedge') {
                doLongBiasedHedge(strategies[i]);
            }
            if(strategies[i].name.toLowerCase() === 'short biased hedge') {
                doShortBiasecdHedge(strategies[i]);
            }
        }
    });
}

function doLongBiasedHedge(strategy) {
    console.log("Using Strategy: " + strategy.name);
    
    // LOAD Exchanges
    // LOAD Prices and store in Exchanges.prices as array [ timestamp, price].
    
    
    
    var promise = Exchanges.find({}).exec();
    promise.then(function(exchanges) {
        for(var i = 0; i < exchanges.length; i++) {
            console.log("Loaded " + exchanges[i].name);
        }
    
        for(var i = 0; i < exchanges.length; i++) {
            console.log("Searching for: " + exchanges[i].name + " prices");
            var promise_2 = Prices.find({exchange: exchanges[i]._id}).exec();
            promise_2.then(function (prices) {       
                for(var j = 0; j < prices.length; j++) {
                    console.log("Found Price: " + prices[j].price);
                }
            });
        }
        
        
    });
    
    
    
}

function doShortBiasedHedge(strategy) {
    console.log("Using Strategy: " + strategy.name);
}