///////////////////////////////////////////////////////////////////////////////
process.env.NODE_ENV = 'development';
process.env.TRADES = [];

var util = require('util');
var btcstats = require('btc-stats');
var http = require('http');
var async = require('async');
var Q = require('q');
var clc = require('cli-color');
var fs = require('fs');
var sprintf = require('sprintf-js').sprintf;

var mongoose = require('../node_modules/mongoose');

mongoose.connect('mongodb://localhost/backtothefutures-dev');

var OKCoin = require('okcoin');
var Futures796 = require('futures796');
var BitVC = require('bitvc');
var BTCe = require('btce');
var BitMEX = require('bitmex');

var TTL = 10;

var BalancesModel = require('../app/models/balance.server.model.js');
var TradeModel = require('../app/models/trade.server.model.js');
var UserModel = require('../app/models/user.server.model.js');
var ExchangeModel = require('../app/models/exchange.server.model.js');
var StrategyModel = require('../app/models/strategy.server.model.js');
var PriceModel = require('../app/models/price.server.model.js');
var passport = require('../config/passport');
var exchange = require('../config/express');

var Balances = mongoose.model('Balance');
var Trades = mongoose.model('Trade');
var Exchanges = mongoose.model('Exchange');
var Strategies = mongoose.model('Strategy');
var Prices = mongoose.model('Price');
///////////////////////////////////////////////////////////////////////////////

var strategy;
var exchanges; 
var prices;

getVariables();

function getVariables() {
    strategy = null;
    exchanges = null;
    prices = null; 
    trades = null;
    
    Strategies
    .find({"enabled":true})
    .populate('primaryExchanges.exchange')
    .populate('insuranceExchanges.exchange')
    .exec(function(err, strategies) {
        if(err) {
            console.log("Error: %s", err);
        }
        
        for(var i = 0; i < strategies.length; i++) {
            strategy = strategies[i];
            
            getBalances(strategy, exchanges, prices, trades);
        }
    });
    
    var sinceTime = new Date();
    sinceTime.setHours(sinceTime.getHours() - 3);
    
    Prices.find({'timestamp': { $gt: sinceTime }}, function(err, pricepoints) {
        prices = pricepoints;
        
        getBalances(strategy, exchanges, prices, trades);
    });
    
    Exchanges.find({}, function(err, xchgs) {
        exchanges = xchgs;
        
        getBalances(strategy, exchanges, prices, trades);
    });
    
    
    Trades.find({}, function(err, trds) {
        trades = trds;
        
        getBalances(strategy, exchanges, prices, trades);
    });
    
    
    // setTimeout(getVariables, TTL * 1000);     // Repeat every TTL seconds.
}

function getBalances(strategy, exchanges, prices, trades) {  
        
    if(strategy && exchanges && prices && trades) {
        var exchange_name, api_key, secret;
        
        for(var i = 0; i < exchanges.length; i++) {            
            // Get Exchange Values.
            exchange_name = exchanges[i].name.toLowerCase();
            api_key = exchanges[i].apikey;
            secret = exchanges[i].secretkey;
            
            // Get Balance Obligated Vs. Holding
            if(exchange_name === 'okcoin') {
                var client = new OKCoin(api_key, secret);
                
                client.getFixedFuturePositions(function(err, resp) {
                    if(err) {
                        console.log(clc.red("ERROR: " + err));
                    }
                    
                    console.log("OKCOIN RESPONSE: " + util.inspect(resp));
                }, 'btc_usd', 'quarter', 1);
                
            }
            
            if(exchange_name === '796') {
                var client = new Futures796(api_key, secret);
                
                client.getPositions(function (err, resp) {
                    if(err) {
                        console.log(clc.red("ERROR: " + err));
                    }

                    console.log("796 RESPONSE: " + util.inspect(resp));
                });

            }
            
            if(exchange_name === 'bitvc') {
                var client = new BitVC(api_key, secret);
                
                client.getUserPositions(function(err, resp) {
                    if(err) {
                        console.log(clc.red("ERROR: " + err));
                    }
                    
                    console.log("BitVC RESPONSE: " + util.inspect(resp));
                }, 1);
            }
            
            if(exchange_name === 'btc-e') {
                var client = new BTCe(api_key, secret);
                
                client.getActiveOrders(function(err, resp) {
                    if(err) {
                        console.log(clc.red("ERROR: " + err));
                    }
                    
                    console.log("BTC-e RESPONSE: " + util.inspect(resp));
                });
            }
            
            if(exchange_name === 'bitmex') {
                var client = new BitMEX(api_key, secret);
                
                client.getPositions(function(err, resp) {
                    if(err) {
                        console.log(clc.red("ERROR: " + err));
                    }
                    
                    console.log("BitMEX RESPONSE: " + util.inspect(resp));
                });
                
                
                
            }
        }
    } 
}
