///////////////////////////////////////////////////////////////////////////////
process.env.NODE_ENV = 'development';

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
data = {
    lastPrice: [],
    avgPrices: [],
    spread: [],
    avgSpread: [],
}

var strategy;
var exchanges; 
var prices;

getVariables();

function getVariables() {
    strategy = null;
    exchanges = null;
    prices = null; 
    
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
            
            executeStrategy(strategy, exchanges, prices);
        }
    });
    
    var sinceTime = new Date();
    sinceTime.setHours(sinceTime.getHours() - 3);
    
    Prices.find({'timestamp': { $gt: sinceTime }}, function(err, pricepoints) {
        prices = pricepoints;
        
        executeStrategy(strategy, exchanges, prices);
    });
    
    Exchanges.find({}, function(err, xchgs) {
        exchanges = xchgs;
        
        executeStrategy(strategy, exchanges, prices);
    });
    
    setTimeout(getVariables, TTL * 1000)     // Repeat every TTL seconds.
}

function executeStrategy(strategy, exchanges, prices) {
    if(strategy && exchanges && prices) {
        console.log("\nExecuting %s", strategy.name);
        
        if(strategy.name.toLowerCase() === 'long biased hedge') {
            doLongBiasedHedge(strategy, exchanges, prices);
        }
        if(strategy.name.toLowerCase() === 'short biased hedge') {
            doShortBiasedHedge(strategy, exchanges, prices);
        }
    
    } else {
        console.log("Waiting...");
    }
}

function doLongBiasedHedge(strategy, exchanges, prices ) {
    console.log("Total Coins: %s BTC | Max Buy Price: $ %s USD | Insurance Coverage: %s %",
        strategy.totalCoins, strategy.maxBuyPrice, strategy.insuranceCoverage*100);
    console.log("--------------------------------------------------------------------------------");
    // Show Exchanges and Amounts we are going long
    for(var i = 0; i < strategy.primaryExchanges.length; i++) {
        if(strategy.primaryExchanges[i].ratio > 0) {
            console.log("%s @ %s % = %s BTC [LONG]", 
                strategy.primaryExchanges[i].exchange.name, 
                strategy.primaryExchanges[i].ratio*100, 
                strategy.totalCoins * strategy.primaryExchanges[i].ratio
            );
        }
    }
    // Show exchanges and amounts we are going short
    console.log("--------------------------------------------------------------------------------");
    for(var i = 0; i < strategy.insuranceExchanges.length; i++) {
        if(strategy.insuranceExchanges[i].ratio > 0) {            
            console.log("%s @ %s % = %s BTC [SHORT]", 
                strategy.insuranceExchanges[i].exchange.name, 
                strategy.insuranceExchanges[i].ratio*100, 
                strategy.totalCoins * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio
            );
        }
    }
    console.log("--------------------------------------------------------------------------------");
    // Buy Long on Each Primary Exchange
    for(var i = 0; i < strategy.primaryExchanges.length; i++) {
        var sum = 0;
        var numPrices = 0;
        var lastPrice = 0;
        
        for(var j = 0; j < prices.length; j++) {          
            if(prices[j].exchange.toString() == strategy.primaryExchanges[i].exchange._id.toString()) {
                lastPrice = prices[j].price;
                strategy.primaryExchanges[i].lastPrice = lastPrice;
                sum += prices[j].price;
                numPrices++;
            }
           
        }
        
        console.log("The last price on %s was: %s (3hr average: %s)", 
            strategy.primaryExchanges[i].exchange.name, 
            Number(lastPrice).toFixed(2), 
            Number(sum/numPrices).toFixed(2)
        );
    }
    
    // Calculate Current Spreads.
    for(var i = 0; i < strategy.primaryExchanges.length; i++) {
        var sum = 0;
        var numPrices = 0;
        
        for(j = 0; j < strategy.primaryExchanges.length; j++) {
            if(i != j) {                    
                sum += (strategy.primaryExchanges[i].lastPrice - strategy.primaryExchanges[j].lastPrice)
                numPrices++;
            }
        }
        
        strategy.primaryExchanges[i].currentSpread = sum/numPrices;
        
        console.log("The current spread [averaged across all exchanges] for %s is: %s",
            strategy.primaryExchanges[i].exchange.name,
            Number(sum/numPrices).toFixed(2)
        );
    } // end of current spread calculations.
    
    // Calculate Average Spreads.
    
    for(var i = 0; i < strategy.primaryExchanges.length; i++) {
        var sum = 0;
        var numPrices = 0;
        
        for(j = 0; j < prices.length; j++) {
            if(prices[j].exchange.toString() !== strategy.primaryExchanges[i].exchange._id.toString()) {
                sum += (strategy.primaryExchanges[i].lastPrice - prices[j].price);
                numPrices++;
            }
        }
        
        strategy.primaryExchanges[i].averageSpread = sum / numPrices;
        
        console.log("The average spread [last 3 hours across all exchanges] for %s is: %s",
            strategy.primaryExchanges[i].exchange.name,
            strategy.primaryExchanges[i].averageSpread
        );
        
    } // end average spread calculations
}

function doShortBiasedHedge(strategy, exchanges, prices) {
    console.log("Using Strategy: " + strategy.name);
}

function printData(data) {
    console.log("Data: " + util.inspect(data) );
}

function handleError(err) {
    console.log("Error: " + err);
}