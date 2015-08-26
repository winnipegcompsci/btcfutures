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
            
            executeStrategy(strategy, exchanges, prices, trades);
        }
    });
    
    var sinceTime = new Date();
    sinceTime.setHours(sinceTime.getHours() - 3);
    
    Prices.find({'timestamp': { $gt: sinceTime }}, function(err, pricepoints) {
        prices = pricepoints;
        
        executeStrategy(strategy, exchanges, prices, trades);
    });
    
    Exchanges.find({}, function(err, xchgs) {
        exchanges = xchgs;
        
        executeStrategy(strategy, exchanges, prices, trades);
    });
    
    
    Trades.find({}, function(err, trds) {
        trades = trds;
        
        executeStrategy(strategy, exchanges, prices, trades);
    });
    
    
    setTimeout(getVariables, TTL * 1000);     // Repeat every TTL seconds.
}

function executeStrategy(strategy, exchanges, prices, trades) {  
        
    if(strategy && exchanges && prices && trades) {
        if(strategy.name.toLowerCase() === 'long biased hedge') {
            prepLongBiasedHedge(strategy, exchanges, prices, trades);
        }
        if(strategy.name.toLowerCase() === 'short biased hedge') {
            prepLongBiasedHedge(strategy, exchanges, prices, trades);
        }
    
    } else {
        console.log("Waiting...");
    }
}

function prepLongBiasedHedge(strategy, exchanges, prices, trades ) {    
    //  Get LTP for each exchange.
    for(var i = 0; i < strategy.primaryExchanges.length; i++) {        
        var sum = 0;
        var numPrices = 0;
        var lastPrice = 0;
        
        for(var j = 0; j < prices.length; j++) {          
            if(prices[j].exchange.toString() == strategy.primaryExchanges[i].exchange._id.toString()) {
                lastPrice = prices[j].price;

                // Randomize to Test.
                // lastPrice = lastPrice * (Math.random() * (1.02 - 0.98) + 0.98); //  =1
                                
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
            // if(i != j) {                    
                sum += (strategy.primaryExchanges[i].lastPrice - strategy.primaryExchanges[j].lastPrice)
                numPrices++;
            // }
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
        
                        
        // IF DEBUG PARSE TRADES?
        if(process.env.NODE_ENV === 'development') {
            var numLong = 0;
            var sumLong = 0;
            var numShort = 0;
            var sumShort = 0;
                         
            for(var j = 0; j < trades.length; j++) {
                if(trades[j].exchange.toString() == strategy.primaryExchanges[i].exchange._id.toString()) {                   
                    if(trades[j].bias === 'LONG') {
                        
                        if(trades[j].type === 'BUY') {
                            strategy.primaryExchanges[i].currentlyHolding += trades[j].amount;
                            numLong++;
                            sumLong += trades[j].price;
                        }
                        
                        if(trades[j].type === 'SELL') {
                            strategy.primaryExchanges[i].currentlyHolding -= trades[j].amount;
                        }
                    }
                } // end if trade was on primary exchange 
                
                if(trades[j].exchange.toString() == strategy.primaryExchanges[i].exchange._id.toString()) {                    
                    if(trades[j].bias === 'SHORT') {
                        
                        if(trades[j].type === 'BUY') {
                            strategy.insuranceExchanges[i].currentlyHolding += trades[j].amount;
                            numShort++;
                            sumShort += trades[j].price;
                        }
                        
                        if(trades[j].type === 'SELL') {
                            strategy.insuranceExchanges[i].currentlyHolding -= trades[j].amount;
                        }
                    }
                } // end if trade was on insurance exchange
                
                if(sumLong != 0) {
                    strategy.primaryExchanges[i].averageBuyPrice = sumLong / numLong;
                }
                if(sumShort != 0) {
                    strategy.insuranceExchanges[i].averageBuyPrice = sumShort / numShort;     
                }
            }
            

        } // end if development (QUERY TRADES).
        
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
        console.log("\nExecuting %s", strategy.name);
        
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
            
            // Write Current Holding and Current Price to Chart.
            var newBalance = new Balances({
                balance: strategy.primaryExchanges[i].currentlyHolding,
                price: strategy.primaryExchanges[i].lastPrice,
                exchange: strategy.primaryExchanges[i].exchange._id
            });    
            
            newBalance.save(function (err) {
                if(err) {
                    handleError(err);
                }       
            });  
            
        }
        // Show Exchanges and amounts we are going short
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
        
        // Maintenance -- Get Rid of Overages in case of Strategy values change.
        for(var k = 0; k < strategy.primaryExchanges.length; k++) {
            // Long Biased Hedge, if Over Sell Overage Long.
            if(strategy.primaryExchanges[k].currentlyHolding > (strategy.totalCoins * strategy.primaryExchanges[k].ratio)) {
                var difference = strategy.primaryExchanges[k].currentlyHolding - (strategy.totalCoins * strategy.primaryExchanges[k].ratio);
                  
                placeOrder(
                    strategy.primaryExchanges[k].exchange,
                    strategy.primaryExchanges[k].lastPrice,
                    difference,
                    'SELL',
                    'LONG',
                    strategy
                );
                
            }
        }
        for(var k = 0; k < strategy.insuranceExchanges.length; k++) {
            // Long Biased Hedge, if Over Sell Overage Short.
            if(strategy.insuranceExchanges[k].currentlyHolding > (strategy.totalCoins * strategy.insuranceCoverage * strategy.insuranceExchanges[k].ratio)) {
                difference = strategy.insuranceExchanges[k].currentlyHolding - (strategy.totalCoins * strategy.insuranceCoverage * strategy.insuranceExchanges[k].ratio);
            
                placeOrder(
                    strategy.insuranceExchanges[k].exchange,
                    strategy.insuranceExchanges[k].lastPrice,
                    difference,
                    'SELL',
                    'SHORT',
                    strategy
                );   
            }
        }
        
        
        // Main Strategy
        var randomizer = 1;
        console.log('\n');          // Formatting.
        
        for(var i = 0; i < strategy.primaryExchanges.length; i++) {
            randomizer = (Math.random() * (1.3 - 0.7) + 0.7).toFixed(4) //  =1
            
            console.log(clc.yellow("\nExchange: %s || Last Traded Price: %s"), strategy.primaryExchanges[i].exchange.name, Number(strategy.primaryExchanges[i].lastPrice).toFixed(2) );
           
            console.log("Current Spread [Averaged Across All Exchanges]: %s", Number(strategy.primaryExchanges[i].currentSpread).toFixed(2) );
            console.log("3Hr Avg Spread [Averaged Across All Exchanges]: %s", Number(strategy.primaryExchanges[i].averageSpread).toFixed(2) ); 
            console.log(clc.green("Currently Holding [LONG]: %s / %s  BTC (average buy price: %s)"), 
                Number(strategy.primaryExchanges[i].currentlyHolding).toFixed(2), 
                Number(strategy.totalCoins * strategy.primaryExchanges[i].ratio).toFixed(2),
                Number(strategy.primaryExchanges[i].averageBuyPrice).toFixed(2)
            );
            console.log(clc.green("Currently Holding [SHORT]: %s / %s BTC (average buy price: %s)"), 
                Number(strategy.insuranceExchanges[i].currentlyHolding).toFixed(2), 
                Number(strategy.totalCoins * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio).toFixed(2),
                Number(strategy.insuranceExchanges[i].averageBuyPrice).toFixed(2)
            );
                        
            // LONG BUY LOGIC
            if((strategy.primaryExchanges[i].currentlyHolding < (strategy.totalCoins * strategy.primaryExchanges[i].ratio)) &&
                strategy.primaryExchanges[i].lastPrice < strategy.maxBuyPrice && 
                Math.abs(strategy.primaryExchanges[i].currentSpread) < Math.abs(strategy.primaryExchanges[i].averageSpread)) {
                            
                placeOrder(
                    strategy.primaryExchanges[i].exchange,
                    strategy.primaryExchanges[i].lastPrice,
                    (((strategy.totalCoins / 10)*randomizer) * strategy.primaryExchanges[i].ratio),
                    'BUY',
                    'LONG',
                    strategy
                );
                
            }
                        
            // Sell Short Logic
            if((strategy.primaryExchanges[i].lastPrice > (strategy.insuranceExchanges[i].averageBuyPrice * 1.0125))) {
                
                if(strategy.insuranceExchanges[i].currentlyHolding > strategy.primaryExchanges[i].currentlyHolding * strategy.insuranceCoverage) {
                    
                    placeOrder(
                        strategy.insuranceExchanges[i].exchange,
                        strategy.insuranceExchanges[i].lastPrice,
                        ((strategy.insuranceExchanges[i].currentlyHolding * randomizer * strategy.insuranceCoverage)),
                        'SELL',
                        'SHORT',
                        strategy
                    );
                        
                    
                }
                
                if(strategy.primaryExchanges[i].currentlyHolding > 0) {
                    if(strategy.primaryExchanges[i].lastPrice > (strategy.primaryExchanges[i].averageBuyPrice * 1.025)) {
                        
                        placeOrder(
                            strategy.primaryExchanges[i].exchange,
                            strategy.primaryExchanges[i].lastPrice,
                            ((strategy.primaryExchanges[i].currentlyHolding / 2)).toFixed(4),
                            'SELL',
                            'LONG',
                            strategy
                        );
                    }
                }
                
                if((strategy.primaryExchanges[i].currentlyHolding * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio) > 0) {
                    if(strategy.primaryExchanges[i].lastPrice > (strategy.primaryExchanges[i].averageBuyPrice * 1.04) && 
                        (strategy.primaryExchanges[i].currentlyHolding * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio) < strategy.primaryExchanges[i].currentlyHolding * strategy.insuranceCoverage ) {                    
                            
                        placeOrder(
                            strategy.primaryExchanges[i].exchange,
                            strategy.primaryExchanges[i].lastPrice,
                            ((strategy.primaryExchanges[i].currentlyHolding * randomizer * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio)),
                            'BUY',
                            'SHORT',
                            strategy
                        );
                    
                    }
                    // call API buy
                }
            } // if price > avereage + 1.25%
            
            if(strategy.primaryExchanges[i].lastPrice < (strategy.primaryExchanges[i].averageBuyPrice / 1.0125)) {
                if(strategy.primaryExchanges[i].currentlyHolding > 0) {                    
                    placeOrder(
                        strategy.primaryExchanges[i].exchange,
                        strategy.primaryExchanges[i].lastPrice,
                        ((strategy.primaryExchanges[i].currentlyHolding)),
                        'SELL',
                        'LONG',
                        strategy
                    );
                }
            } // if price < average - 1.25%
            
        } // end foreach primary exchange    
        
        
        // Build Up Insurance if below threshold.
        for(var i = 0; i < strategy.insuranceExchanges.length; i++) {
            randomizer = (Math.random() * (1.3 - 0.7) + 0.7).toFixed(4) //  =1
        
            // SHORT BUY LOGIC
            if((strategy.insuranceExchanges[i].currentlyHolding < (strategy.totalCoins * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio)) &&
                strategy.insuranceExchanges[i].lastPrice < strategy.maxBuyPrice &&
                Math.abs(strategy.insuranceExchanges[i].currentSpread) < Math.abs(strategy.insuranceExchanges[i].averageSpread)) {
                            
                placeOrder(
                    strategy.primaryExchanges[i].exchange,
                    strategy.primaryExchanges[i].lastPrice,
                    ((strategy.totalCoins / 10) * randomizer * strategy.insuranceCoverage * strategy.insuranceExchanges[i].ratio),
                    'BUY',
                    'SHORT',
                    strategy
                );
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
    console.log(clc.red("Error: %s"), err);
}

function placeOrder(exchange, price, amount, type, bias, strategy) {
    
    console.log(clc.green.bgWhite.underline('Executing %s trade: %s %s BTC %s @ %s on %s)'),
        strategy.name,
        type,
        Number(amount).toFixed(4),
        bias,
        Number(price).toFixed(2),
        exchange.name
    );
        
    if(process.env.NODE_ENV === 'development') {
        var thisTrade = new Trades({
            exchange: exchange._id, 
            price: price, 
            amount: amount,
            type: type,
            bias: bias,
            strategy: strategy._id,            
        });
        
        thisTrade.save(function (err) {
            if(err) {
                handleError(err);
            }                       
        });
    } else {
        // PRODUCTION API CALLS
    }
}