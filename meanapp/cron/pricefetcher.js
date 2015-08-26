/////
process.env.NODE_ENV = 'development';

// Requirements and DB Connection.
var util = require('util');
var btcstats = require('btc-stats');
var http = require('http');
var async = require('async');
var Q = require('q');
var Promise = require('promise');
var clc = require('cli-color');
var fs = require('fs');
var mongoose = require('../node_modules/mongoose');
mongoose.connect('mongodb://localhost/backtothefutures-dev');


// Exchange API Wrappers.
var OKCoin = require('okcoin');
var Futures796 = require('futures796');
var BitVC = require('bitvc');
var BTCe = require('btce');
var BitMEX = require('bitmex');

// How Many Seconds should it wait before fetching prices again?
var TTL = 10;

// Mongo DB Collection Schemas.
var PriceModel = require('../app/models/price.server.model.js');
var TradeModel = require('../app/models/trade.server.model.js');
var UserModel = require('../app/models/user.server.model.js');
var ExchangeModel = require('../app/models/exchange.server.model.js');
var StrategyModel = require('../app/models/strategy.server.model.js');
var passport = require('../config/passport');
var exchange = require('../config/express');

// Mongoose Models.
var Prices = mongoose.model('Price');
var Trades = mongoose.model('Trade');
var Exchanges = mongoose.model('Exchange');
var Strategies = mongoose.model('Strategy');
///////////////////////////////////////////////////////////////////////////////

getPrices() 


function getPrices() {
    var promise = Exchanges.find({}).exec();
    promise.then(function(exchanges) {
        for(var i = 0; i < exchanges.length; i++) {
            getCurrentPrice(exchanges[i], savePrice);
        }
    });
    
    console.log("Checking again in %s seconds", TTL);
    setTimeout(getPrices, TTL * 1000)
}

function getCurrentPrice(exchange) {
    var exchange_name = exchange.name;
    
    // console.log("Getting current price for %s", exchange_name);
    
    if(exchange_name.toLowerCase() === 'okcoin') {
        var public_client = new OKCoin();
        public_client.getFutureTicker(function(err, ticker_resp) {
            if(err) {
                console.log("ERROR: " + err);
            }
            
            savePrice(exchange, Number(ticker_resp.ticker.last).toFixed(2));
            
        }, 'btc_usd', 'quarter');
    } else if (exchange_name.toLowerCase() === '796') {
        var public_client = new Futures796();
        public_client.getTicker(function(err, ticker_resp) {
            if(err) {
                console.log("ERROR: " + err);
            }
            
            savePrice(exchange, Number(ticker_resp.ticker.last).toFixed(2));
        });
    } else if (exchange_name.toLowerCase() === 'bitvc') {
        var public_client = new BitVC();
        
        public_client.getTicker(function(err, ticker_resp) {
            if(err) {
                console.log("ERROR: " + err);
            }
            
            public_client.getExchangeRate(function(err, exchange_rate) {
                ticker_resp.last = ticker_resp.last / exchange_rate.rate;
                
                savePrice(exchange, Number(ticker_resp.last).toFixed(2));
            });
        });
    } else if (exchange_name.toLowerCase() == 'btc-e') {
        var public_client = new BTCe();
        
        public_client.getTicker(function(err, ticker_resp) {
            if(err) {
                console.log("ERROR: " + err);
            }

            savePrice(exchange, Number(ticker_resp.btc_usd.last).toFixed(2));
        });
    } else if (exchange_name.toLowerCase() === 'bitmex') {
        var public_client = new BitMEX();
    
        public_client.getActiveIndices(function(err, ticker_resp) {
            if(err) {
                return res.status(500).send(err);
            }           
            
            for(var i = 0; i < ticker_resp.length; i++) {
            
                if(ticker_resp[i].symbol === 'XBTZ15') {
                    savePrice(exchange, Number(ticker_resp[i].lastPrice).toFixed(2));
                    
                }
            }
        });
    
    } else {
        console.log("Function for: " + exchange_name + " has not been implemented");
    }
}

function savePrice(exchange, current_price) {
    var newPrice = new Prices({
        exchange: exchange._id,
        price: current_price,
    });
                
    newPrice.save(function(err) {
        if(err) {
            console.log("Error: " + err);
        } else {
            console.log("%s's current price is %s", exchange.name, current_price);
        }                
    });
};
