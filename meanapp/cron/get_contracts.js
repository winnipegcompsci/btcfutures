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
            
            getContracts(strategy, exchanges, prices, trades);
        }
    });
    
    var sinceTime = new Date();
    sinceTime.setHours(sinceTime.getHours() - 3);
    
    Prices.find({'timestamp': { $gt: sinceTime }}, function(err, pricepoints) {
        prices = pricepoints;
        
        getContracts(strategy, exchanges, prices, trades);
    });
    
    Exchanges.find({}, function(err, xchgs) {
        exchanges = xchgs;
        
        getContracts(strategy, exchanges, prices, trades);
    });
    
    
    Trades.find({}, function(err, trds) {
        trades = trds;
        
        getContracts(strategy, exchanges, prices, trades);
    });
    
    console.log("\n");
    setTimeout(getVariables, TTL * 1000);     // Repeat every TTL seconds.
}

function getContracts(strategy, exchanges, prices, trades) {  
        
    if(strategy && exchanges && prices && trades) {
        for(var i = 0; i < exchanges.length; i++) {            
            var exchange_name = exchanges[i].name.toLowerCase();
            
            if(exchange_name === 'okcoin') {
                var client = new OKCoin();
                
                var contract_types = ['this_week', 'next_week', 'quarter'];
                
                contract_types.forEach(function (type) {
                    client.getFutureTicker(function(err, resp) {
                        console.log("OKCoin Contract %s: \tLast: %s | High: %s | Low: %s | Buy: %s | Sell: %s | Volume: %s", type,
                            Number(resp.ticker.last).toFixed(2), 
                            Number(resp.ticker.high).toFixed(2), 
                            Number(resp.ticker.low).toFixed(2), 
                            Number(resp.ticker.buy).toFixed(2), 
                            Number(resp.ticker.sell).toFixed(2), 
                            Number(resp.ticker.vol).toFixed(2)
                        );    
                    }, 'btc_usd', type);
                
                });
                
            }
            
            if(exchange_name === '796') {
                var client = new Futures796();
                
                client.getTicker(function (err, resp) {
                    console.log("796 Future Ticker: \t\tLast: %s | High: %s | Low: %s | Buy: %s | Sell: %s | Volume: %s",
                        Number(resp.ticker.last).toFixed(2), 
                        Number(resp.ticker.high).toFixed(2), 
                        Number(resp.ticker.low).toFixed(2), 
                        Number(resp.ticker.buy).toFixed(2), 
                        Number(resp.ticker.sell).toFixed(2), 
                        Number(resp.ticker.vol).toFixed(2)
                    );
                });
            }
            
            if(exchange_name === 'bitvc') {
                var client = new BitVC();
                
                client.getExchangeRate(function (err, rate) {
                
                    client.getThisWeekFutureTicker(function(err, resp) {
                        console.log("BitVC Contract This Week: \tLast: %s | High: %s | Low: %s | Buy: %s | Sell: %s | Volume: %s",
                            Number(resp.last / rate.rate).toFixed(2), 
                            Number(resp.high/rate.rate).toFixed(2), 
                            Number(resp.low / rate.rate).toFixed(2), 
                            Number(resp.buy / rate.rate).toFixed(2), 
                            Number(resp.sell / rate.rate).toFixed(2), 
                            Number(resp.vol).toFixed(2)
                        );
                    });
                
                    client.getNextWeekFutureTicker(function(err, resp) {
                        console.log("BitVC Contract Next Week: \tLast: %s | High: %s | Low: %s | Buy: %s | Sell: %s | Volume: %s",
                            Number(resp.last / rate.rate).toFixed(2), 
                            Number(resp.high / rate.rate).toFixed(2), 
                            Number(resp.low / rate.rate).toFixed(2), 
                            Number(resp.buy / rate.rate).toFixed(2), 
                            Number(resp.sell / rate.rate).toFixed(2), 
                            Number(resp.vol).toFixed(2)
                        );
                    });
                
                    client.getQuarterFutureTicker(function(err, resp) {                                          
                        console.log("BitVC Contract Quarter: \tLast: %s | High: %s | Low: %s | Buy: %s | Sell: %s | Volume: %s",
                            Number(resp.last / rate.rate).toFixed(2), 
                            Number(resp.high/rate.rate).toFixed(2), 
                            Number(resp.low / rate.rate).toFixed(2), 
                            Number(resp.buy / rate.rate).toFixed(2), 
                            Number(resp.sell / rate.rate).toFixed(2), 
                            Number(resp.vol).toFixed(2)
                        );
                    });                
                
                });
            }
            
            if(exchange_name === 'btc-e') {
                var client = new BTCe();
                
                client.getTicker(function(err, resp) {
                    console.log("BTC-e Future Ticker: \t\tLast: %s | High: %s | Low: %s | Buy: %s | Sell: %s | Volume: %s",
                        Number(resp.btc_usd.last).toFixed(2),
                        Number(resp.btc_usd.high).toFixed(2), 
                        Number(resp.btc_usd.low).toFixed(2), 
                        Number(resp.btc_usd.buy).toFixed(2), 
                        Number(resp.btc_usd.sell).toFixed(2), 
                        Number(resp.btc_usd.vol).toFixed(2)
                    );
                });
            }
            
            if(exchange_name === 'bitmex') {
                var client = new BitMEX();
                
                client.getActiveIndices(function(err, resp) {
                    resp.forEach(function (symbol) {
                        if(symbol.symbol.length >= 6) {
                            formatString = "BitMex Contract %s: \tLast: %s | High: %s | Low: %s | Buy: %s | Sell: %s | Volume: %s";                          
                        } else {
                            formatString = "BitMex Contract %s: \t\tLast: %s | High: %s | Low: %s | Buy: %s | Sell: %s | Volume: %s";
                        }
                        
                        console.log(formatString,
                            symbol.symbol,
                            symbol.lastPrice, 
                            symbol.highPrice, 
                            symbol.lowPrice, 
                            symbol.bidPrice, 
                            symbol.askPrice, 
                            symbol.volume
                        );                       
                    });
                });
            }
        }
    } 
}
