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
var passport = require('../config/passport');
var exchange = require('../config/express');

var Trades = mongoose.model('Trade');
var Exchanges = mongoose.model('Exchange');
var Strategies = mongoose.model('Strategy');
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
    
    var promise = Exchanges.find({}).exec();
    promise.then(function(exchanges) {      
        var currentPrices = [];
        for(var i = 0; i < exchanges.length; i++) {
            exchanges[i].current_price = getCurrentPrice(exchanges[i].name);
        }
        
        return Trades.find({}).exec();
    }).then(function (trades) {
        for(var i = 0; i < trades.length; i++) {
            
        }
    });
    

}

function getCurrentPrice(exchange_name) {
    console.log("Getting current price for %s", exchange_name);
    
    if(exchange_name.toLowerCase() === 'okcoin') {
        public_client = new OKCoin();
        public_client.getFutureTicker(function(err, ticker_resp) {
            if(err) {
                console.log("ERROR: " + err);
            }
            
            return ticker_resp.ticker.last;
            
        }, 'btc_usd', 'quarter');
    } else if (exchange_name.toLowerCase() === '796') {
        public_client = new Futures796();
        public_client.getTicker(function(err, ticker_resp) {
            if(err) {
                console.log("ERROR: " + err);
            }
            
            return ticker_resp.ticker.last;
        });
    } else if (exchange_name.toLowerCase() === 'bitvc') {
        public_client = new BitVC();
        
        public_client.getTicker(function(err, ticker_resp) {
            if(err) {
                console.log("ERROR: " + err);
            }
            
            public_client.getExchangeRate(function(err, exchange_rate) {
                ticker_resp.last = ticker_resp.last / exchange_rate.rate;
                
                return ticker_resp.last;
            });
        });
    }
}


/*
function doLongBiasedHedge(strategy) {
    console.log("Executing: %s", strategy.name);
        
    for(var i = 0; i < strategy.primaryExchanges.length; i++) {
        var thisAmount = strategy.primaryExchanges[i].ratio * strategy.totalCoins;
        
        Exchanges.findOne({_id: strategy.primaryExchanges[i].exchange}, function(error, thisExchange) {
            // console.log("%s BTC [LONG] on %s", thisAmount, thisExchange.name);
            
            if(thisExchange.name.toLowerCase().replace(" ", "") === 'okcoin') {
                privateClient = new OKCoin(thisExchange.apikey, thisExchange.secretkey);
                privateClient.getFixedFuturePositions(function(err, pos_resp) {
                    if(err) {
                        console.log("ERROR: " + err)
                    } 
                    
                    var currentLongAmount = 0;
                    for(var i = 0; i < pos_resp.holding.length; i++) {
                        currentLongAmount += pos_resp.holding[i]['buy_amount'];
                    }
                    
                    console.log("Holding %s / %s BTC [LONG] on %s", currentLongAmount, thisAmount, thisExchange.name);
                    // SUBMIT ORDER REQ
                
                }, 'btc_usd', 'quarter', 1);
            
            } else if(thisExchange.name.toLowerCase().replace(" ", "") === '796') {
                privateClient = new Futures796(thisExchange.apikey, thisExchange.secretkey);
                privateClient.getPositions(function(err, pos_resp) {
                    var currentLongAmount = 0;
                    var $STRING = '10';
                    
                    if(pos_resp.data.A) {
                        thisLongAmount = pos_resp.data.A.buy.$STRING.total;
                    }
                   
                });
                
            } else if (thisExchange.name.toLowerCase().replace(" ", "") === 'bitvc') {
                privateClient = new BitVC(thisExchange.apikey, thisExchange.secretkey);
            
            }
        });
    }
    
    for (var i = 0; i < strategy.insuranceExchanges.length; i++) {
        var thisAmount = strategy.insuranceExchanges[i].ratio * strategy.totalCoins * strategy.insuranceCoverage;
        
        tryShortBuy(thisAmount, strategy.insuranceExchanges[i].exchange);
        
    }
}


function tryShortBuy(thisAmount, exchange_id) {
    Exchanges.findOne({_id: exchange_id}, function(error, exchange) {
       thisExchange = exchange;
       console.log("Buying %s BTC [SHORT] on %s", thisAmount, thisExchange.name);
    });
}
*/