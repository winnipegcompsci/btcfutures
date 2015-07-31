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
        if(strategy.name.toLowerCase() === 'long biased hedge') {
            prepLongBiasedHedge(strategy, exchanges, prices);
        }
        if(strategy.name.toLowerCase() === 'short biased hedge') {
            prepLongBiasedHedge(strategy, exchanges, prices);
        }
    
    } else {
        console.log("Waiting...");
    }
}

function prepLongBiasedHedge(strategy, exchanges, prices ) {    
    //  Get LTP for each exchange.
    for(var i = 0; i < strategy.primaryExchanges.length; i++) {        
        var sum = 0;
        var numPrices = 0;
        var lastPrice = 0;
        
        for(var j = 0; j < prices.length; j++) {          
            if(prices[j].exchange.toString() == strategy.primaryExchanges[i].exchange._id.toString()) {
                lastPrice = prices[j].price;
                
                strategy.primaryExchanges[i].lastPrice = lastPrice;
                strategy.insuranceExchanges[i].lastPrice = lastPrice;
                
                sum += prices[j].price;
                numPrices++;
            }  
        }
                
        doLongBiasedHedge(strategy);
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
        strategy.insuranceExchanges[i].currentSpread = sum/numPrices;
        
        doLongBiasedHedge(strategy);
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
        strategy.insuranceExchanges[i].averageSpread = sum / numPrices;
        
        doLongBiasedHedge(strategy);
        
    } // end average spread calculations
    
    
    // Calculate Currently Holding
    for(var i = 0; i < strategy.primaryExchanges.length; i++) {
        strategy.primaryExchanges[i].currentlyHolding = 0;
        strategy.primaryExchanges[i].averageBuyPrice = 0;
        strategy.insuranceExchanges[i].currentlyHolding = 0;
        strategy.insuranceExchanges[i].averageBuyPrice = 0;
        
        if(strategy.primaryExchanges[i].exchange.name.toLowerCase() == "okcoin") {

            var privateClient = new OKCoin(strategy.primaryExchanges[i].exchange.apikey, strategy.primaryExchanges[i].exchange.secretkey);
            
            privateClient.getFixedFuturePositions(function (err, pos_resp) {
                if(pos_resp.result) {
                    for(var j = 0; j < pos_resp.holding.length; j++) {
                        strategy.primaryExchanges[i].currentlyHolding += pos_resp.holding[j].buy_amount;
                        strategy.insuranceExchanges[i].currentlyHolding += pos_resp.holding[j].sell_amount;
                        
                        strategy.primaryExchanges[i].averageBuyPrice = pos_resp.holding[i].buy_price_avg;
                        strategy.insuranceExchanges[i].averageBuyPrice = pos_resp.holding[i].sell_price_avg;
                    }
                }
            }, 'btc_usd', 'quarter', 1);
            
        } else if (strategy.primaryExchanges[i].exchange.name.toLowerCase() == "796") {
            var privateClient = new Futures796(strategy.primaryExchanges[i].exchange.apikey, strategy.primaryExchanges[i].exchange.secretkey);
            
            privateClient.getPositions(function(err, pos_resp) {
                if(pos_resp.msg == "success") {
                    var $STRING = '10';
                    
                    for(var j = 0; j < pos_resp.data.length; j++) {
                        strategy.primaryExchanges[i].currentlyHolding += 
                            pos_resp.data[j].A.buy.$STRING.total;
                        strategy.insuranceExchanges[i].currentlyHolding += 
                            pos_resp.data[j].B.buy.$STRING.total;
                        
                        strategy.primaryExchanges[i].averageBuyPrice = 
                            pos_resp.data[j].A.buy.$STRING.avg_price;
                        strategy.insuranceExchanges[i].averageBuyPrice = 
                            pos_resp.data[j].B.buy.$STRING.avg_price;
                    }
                }                
            });

        } else if (strategy.primaryExchanges[i].exchange.name.toLowerCase() == 'bitvc') {
            var privateClient = new BitVC(strategy.primaryExchanges[i].exchange.apikey, strategy.primaryExchanges[i].exchange.secretkey);
            
            privateClient.getCurrentOrders(function(err, pos_resp) {
                if(typeof pos_resp !== 'undefined') {
                    for(var j = 0; j < pos_resp.orders.length; i++) {
                        amount = pos_resp.orders[j].order_amount;
                        
                        if(pos_resp.orders[j].type == 1) {
                            strategy.primaryExchanges[i].currentlyHolding += amount;
                        }
                        
                        if(pos_resp.orders[j].type == 2) {
                            strategy.insuranceExchanges[i].currentlyHolding += amount;
                        }
                    }
                }
            });
            
        }
        
            // IF DEBUG PARSE TRADES?
        if(process.env.NODE_ENV == 'development') {
            if(!process.env.TRADES[strategy.primaryExchanges[i].exchange._id]) {
                process.env.TRADES[strategy.primaryExchanges[i].exchange._id] = [];
            }
            else if (process.env.TRADES[strategy.primaryExchanges[i].exchange._id]) {
                var sumBuyLong = 0;
                var sumBuyShort = 0;
                var numBuyLong = 0;
                var numBuyShort = 0;
                console.log("DEBUGGING: ");
                for(var j = 0; j < process.env.TRADES[strategy.primaryExchanges[i].exchange._id].length; j++) {
                    if(process.env.TRADES[strategy.primaryExchanges[i].exchange._id][j].bias == 'LONG') {
                        if(process.env.TRADES[strategy.primaryExchanges[i].exchange._id][j].type == "BUY") {
                            strategy.primaryExchanges[i].currentlyHolding += 
                                process.env.TRADES[strategy.primaryExchanges[i].exchange._id][j].amount;
                                
                            numBuyLong++;
                            sumBuyLong += process.env.TRADES[strategy.primaryExchanges[i].exchange._id][j].amount;
                        } 
                        if(process.env.TRADES[strategy.primaryExchanges[i].exchange._id][j].type == "SELL") {
                            strategy.primaryExchanges[i].currentlyHolding -= 
                                process.env.TRADES[strategy.primaryExchanges[i].exchange._id][j].amount;
                        }
                    }
                    
                    if(process.env.TRADES[strategy.primaryExchanges[i].exchange._id][j].bias == 'SHORT') {
                        if(process.env.TRADES[strategy.primaryExchanges[i].exchange._id][j].type == "BUY") {
                            strategy.insuranceExchanges[i].currentlyHolding +=
                                process.env.TRADES[strategy.primaryExchanges[i].exchange._id][j].amount;
                                
                            numBuyShort++;
                            sumBuyShort += process.env.TRADES[strategy.primaryExchanges[i].exchange._id][j].amount;
                        }
                        if(process.env.TRADES[strategy.primaryExchanges[i].exchange._id][j].type == "SELL") {
                            strategy.insuranceExchanges[i].currentlyHolding -=
                                process.env.TRADES[strategy.primaryExchanges[i].exchange._id][j].amount;
                        }
                    }
                }
                
                strategy.primaryExchanges[i].averageBuyPrice = sumBuyLong / numBuyLong;
                strategy.insuranceExchanges[i].averageBuyPrice = sumBuyShort / numBuyShort;
            }
        }
        
        doLongBiasedHedge(strategy);
    }
}

function doLongBiasedHedge(strategy) {    
    var pass = true;
        
    for(var i = 0; i < strategy.primaryExchanges.length; i++) {
        // Check Primary Exchange Variables
        if(!strategy.primaryExchanges[i].lastPrice)             { pass = false; }
        if(!strategy.primaryExchanges[i].currentSpread)         { pass = false; }
        if(!strategy.primaryExchanges[i].averageSpread)         { pass = false; }
        if(typeof strategy.primaryExchanges[i].currentlyHolding == 'undefined')      { pass = false; }
        if(typeof strategy.primaryExchanges[i].averageBuyPrice == 'undefined')       { pass = false; }
        
        // Check Insurance Exchange Variables
        if(!strategy.insuranceExchanges[i].lastPrice)           { pass = false; }
        if(!strategy.insuranceExchanges[i].currentSpread)       { pass = false; }
        if(!strategy.insuranceExchanges[i].averageSpread)       { pass = false; }
        if(typeof strategy.insuranceExchanges[i].currentlyHolding == 'undefined')    { pass = false; }
        if(typeof strategy.insuranceExchanges[i].averageBuyPrice == 'undefined')     { pass = false; }
    }
    
    if(!pass) {
        return; 
    } else {
        console.log("Executing %s", strategy.name);
        
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
        
        
        for(var i = 0; i < strategy.primaryExchanges.length; i++) {
            console.log("\nExchange: " + strategy.primaryExchanges[i].exchange.name +" || Last Price (Current): %s", Number(strategy.primaryExchanges[i].lastPrice).toFixed(2) );
            console.log("Current Spread [Averaged Across All Exchanges]: %s", Number(strategy.primaryExchanges[i].currentSpread).toFixed(2) );
            console.log("3Hr Avg Spread [Averaged Across All Exchanges]: %s", Number(strategy.primaryExchanges[i].averageSpread).toFixed(2) ); 
            console.log("Currently Holding [LONG]: %s (average price paid: %s)", Number(strategy.primaryExchanges[i].currentlyHolding).toFixed(2), Number(strategy.primaryExchanges[i].averageBuyPrice).toFixed(2));
            console.log("Currently Holding [SHORT]: %s (average price paid: %s)", Number(strategy.insuranceExchanges[i].currentlyHolding).toFixed(2), Number(strategy.insuranceExchanges[i].averageBuyPrice).toFixed(2));
                        
            // LONG BUY LOGIC
            if((strategy.primaryExchanges[i].currentlyHolding < (strategy.totalCoins * strategy.primaryExchanges[i].ratio)) &&
                strategy.primaryExchanges[i].lastPrice < strategy.maxBuyPrice && 
                Math.abs(strategy.primaryExchanges[i].currentSpread) < Math.abs(strategy.primaryExchanges[i].averageSpread)) {
            
                // Buy out of Total.
                console.log("Buy %s BTC [LONG] from %s @ $ %s (holding %s / %s BTC)", 
                    ((strategy.totalCoins / 10) * strategy.primaryExchanges[i].ratio).toFixed(4),
                    strategy.primaryExchanges[i].exchange.name, 
                    strategy.primaryExchanges[i].lastPrice.toFixed(2),
                    (((strategy.totalCoins / 10) * strategy.primaryExchanges[i].ratio) + strategy.primaryExchanges[i].currentlyHolding).toFixed(4),
                    (strategy.totalCoins * strategy.primaryExchanges[i].ratio).toFixed(4)
                );
                // DEV LOG
                if(process.env.NODE_ENV == 'development') {
                    if(process.env.TRADES[strategy.primaryExchanges[i].exchange._id]) {
                        process.env.TRADES[strategy.primaryExchanges[i].exchange._id].push({
                            'amount': strategy.totalCoins / 10,
                            'price': strategy.primaryExchanges[i].lastPrice,
                            'type': 'BUY',
                            'bias': 'LONG'
                        });
                    }
                }
                
                // call API buy
            }
                        
            // LONG SELL LOGIC
            if((strategy.primaryExchanges[i].lastPrice > (strategy.primaryExchanges[i].averageBuyPrice * 1.0125))) {
                if(strategy.insuranceExchanges[i].currentlyHolding > strategy.primaryExchanges[i].currentlyHolding * strategy.insuranceCoverage) {
                    console.log("Sell %s BTC [SHORT] from %s @ %s (holding %s / %s BTC)",
                        ((strategy.insuranceExchanges[i].currentlyHolding * strategy.insuranceCoverage)).toFixed(4),
                        strategy.primaryExchanges[i].exchange.name,
                        strategy.primaryExchanges[i].lastPrice.toFixed(2),
                        ((strategy.insuranceExchanges[i].currentlyHolding - (strategy.insuranceExchanges[i].currentlyHolding * strategy.insuranceCoverage))).toFixed(4),
                        (strategy.totalCoins * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio).toFixed(4)
                    );
                    // DEV LOG
                    if(process.env.NODE_ENV == 'development') {
                        process.env.TRADES[strategy.insuranceExchanges[i].exchange._id].push({
                           'amount': ((strategy.insuranceExchanges[i].currentlyHolding * strategy.insuranceCoverage)),
                           'price': strategy.insuranceExchanges[i].lastPrice,
                           'type': "SELL",
                           'bias': 'SHORT'
                        });
                    };
                    // call API sell.
                }
                
                if(strategy.primaryExchanges[i].currentlyHolding > 0) {
                    if(strategy.primaryExchanges[i].lastPrice > (strategy.primaryExchanges[i].averageBuyPrice * 1.025)) {
                        console.log("Sell %s BTC [LONG] from %s @ %s (holding %s / %s BTC)",
                            ((strategy.primaryExchanges[i].currentlyHolding / 2)).toFixed(4),
                            strategy.primaryExchanges[i].exchange.name,
                            strategy.primaryExchanges[i].lastPrice.toFixed(2),
                            Number((strategy.primaryExchanges[i].currentlyHolding - (strategy.primaryExchanges[i].currentlyHolding / 2))).toFixed(4),
                            Number((strategy.primaryExchanges * strategy.primaryExchanges[i].ratio)).toFixed(4)
                        );
                        // DEV LOG
                        if(process.env.NODE_ENV == 'development') {
                            process.env.TRADES[strategy.primaryExchanges[i].exchange._id].push({
                                'amount': strategy.primaryExchanges[i].currentlyHolding / 2,   
                                'price': strategy.primaryExchanges[i].lastPrice,
                                'type': "SELL",
                                'bias': 'LONG'
                            });
                        }
                    }
                    
                    // call API sell
                }
                
                if((strategy.primaryExchanges[i].currentlyHolding * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio) > 0) {
                    if(strategy.primaryExchanges[i].lastPrice > (strategy.primaryExchanges[i].averageBuyPrice * 1.04) && 
                        (strategy.primaryExchanges[i].currentlyHolding * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio) < strategy.primaryExchanges[i].currentlyHolding * strategy.insuranceCoverage ) {
                            console.log("Buy %s BTC [SHORT] from %s @ %s (holding %s / %s BTC)",
                                ((strategy.primaryExchanges[i].currentlyHolding * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio)).toFixed(4),
                                strategy.primaryExchanges[i].exchange.name,
                                strategy.primaryExchanges[i].lastPrice.toFixed(2),
                                Number((strategy.insuranceExchanges[i].currentlyHolding + (strategy.primaryExchanges[i].currentlyHolding * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio ))).toFixed(4),
                                Number((strategy.totalCoins * strategy.primaryExchanges[i].ratio)).toFixed(4)
                            );
                            
                            if(process.env.NODE_ENV == 'development') {
                                process.env.TRADES[strategy.insuranceExchanges[i].exchange._id].push({
                                    'amount': (strategy.primaryExchanges[i].currentlyHolding * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio),
                                    'price': strategy.primaryExchanges[i].lastPrice,
                                    'type': "BUY",
                                    'bias': 'SHORT'
                                });
                            }
                    }
                    // call API buy
                }
            } // if price > avereage + 1.25%
            
            if(strategy.primaryExchanges[i].lastPrice < (strategy.primaryExchanges[i].currentPrice / 1.0125)) {
                if(strategy.primaryExchanges[i].currentlyHolding > 0) {
                    console.log("Sell %s BTC [LONG] from %s @ %s (holding %s / %s BTC)",
                        ((strategy.primaryExchanges[i].currentlyHolding)).toFixed(4),
                        strategy.primaryExchanges[i].exchange.name,
                        strategy.primaryExchanges[i].lastPrice.toFixed(2),
                        Number(0).toFixed(4),
                        Number((strategy.totalCoins * strategy.primaryExchanges[i].ratio))
                    );
                    
                    if(process.env.NODE_ENV == 'development') {
                        
                        process.env.TRADES[strategy.primaryExchanges[i].exchange._id].push({
                            'amount': strategy.primaryExchanges[i].currentlyHolding,
                            'price': strategy.primaryExchanges[i].lastPrice,
                            'type': "SELL",
                            'bias': 'LONG'
                        });
                    }
                    // call API buy.
                }
            }
            
        } // end foreach primary exchange    
        
        for(var i = 0; i < strategy.insuranceExchanges.length; i++) {
            
            // SHORT BUY LOGIC
            if((strategy.insuranceExchanges[i].currentlyHolding < (strategy.totalCoins * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio)) &&
                strategy.insuranceExchanges[i].lastPrice < strategy.maxBuyPrice &&
                Math.abs(strategy.insuranceExchanges[i].currentSpread) < Math.abs(strategy.insuranceExchanges[i].averageSpread)) {
            
                // Buy out of Total.
                console.log("Buy %s BTC [SHORT] from %s @ $ %s (holding %s / %s BTC)", 
                    ((strategy.totalCoins / 10) * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio).toFixed(4),
                    strategy.insuranceExchanges[i].exchange.name, 
                    (strategy.insuranceExchanges[i].lastPrice).toFixed(2),
                    ((strategy.totalCoins / 10) * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio + strategy.insuranceExchanges[i].currentlyHolding).toFixed(4),
                    (strategy.totalCoins * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio).toFixed(4)
                );
                
                if(process.env.NODE_ENV == 'development') {
                    if(process.env.TRADES[strategy.primaryExchanges[i].exchange._id]) {
                        process.env.TRADES[strategy.primaryExchanges[i].exchange._id].push({
                            'amount': ((strategy.totalCoins / 10) * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio),
                            'price': strategy.primaryExchanges[i].lastPrice,
                            'type': 'BUY',
                            'bias': 'SHORT'
                        });                   
                    }
                }
            }
        } // end foreach insurance exchange.
    }   
}

function prepShortBiasedHedge(strategy, exchanges, prices) {
    console.log("Using Strategy: " + strategy.name);
    
    // Copy and Invert prepLongBiasedHedge
}

function doShortBiasedHedge(strategy) {
    // Implement Short Biased Hedge.
}


function printData(data) {
    console.log("Data: " + util.inspect(data) );
}

function handleError(err) {
    console.log("Error: " + err);
}