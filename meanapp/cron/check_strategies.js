process.env.NODE_ENV = 'development';

var config = require('../config/config');
var mongoose = require('../node_modules/mongoose');
mongoose.connect('mongodb://localhost/backtothefutures-dev');

var OKCoin = require('okcoin');
var Futures796 = require('futures796');
    
    
var Strategies = require('../app/models/strategy.server.model.js');
var Exchanges = require('../app/models/exchange.server.model.js');
var Trades = require('../app/models/trade.server.model');
var Users = require('../app/models/user.server.model');

var passport = require('../config/passport');
var express = require('../config/express');

var util = require('util');
var http = require('http'); 

var passport = passport();
var db = mongoose.connection;
// var app = express();

var Strategy = mongoose.model('Strategy');
var Exchange = mongoose.model('Exchange');
var Trade = mongoose.model('Trade');


var ExchangesCtrl = require('../app/controllers/exchanges.server.controller.js');

    
db.on('open', function () {
    Strategy.find({}, function(err, strategies) {
        for(var i = 0; i < strategies.length; i++) {
            if(strategies[i].enabled) {
                if(strategies[i].name == "Long Biased Hedge") {
                    doLongBiasedHedge(strategies[i]);
                } else {
                    console.log("NOT EXECUTE: " + strategies[i].name.replace(" ", ""));
                }
            }
        }
    });
        
    var trade = new Trade({
        exchange: null,
        price: 0,
        amount: 0,
        type: 'LONG',
        lever_rate: 0,
        status: 0,
        user: null,
    });


    trade.save(function(err) {
        if(err){ 
            console.log("ERROR: " + err);
        } else {
            console.log("SAVED");
        }
    });


});
    
function doLongBiasedHedge(strategy) {
    var totalCoins = strategy.totalCoins;
    var maxBuyPrice = strategy.maxBuyPrice;
    var insuranceCoverage = strategy.insuranceCoverage;
        
    Exchange.findOne({"_id": strategy.primaryExchange}, function(err, exchange) {
        if(err) {
            console.log("ERROR: " + err);
        }
        
        strategy.primaryExchange = exchange;
        strategy.primaryExchange.name = exchange.name;
        
        if(exchange.name.trim().toLowerCase() == "okcoin") {
            strategy.primaryExchange.publicClient = new OKCoin();
            strategy.primaryExchange.privateClient = new OKCoin(exchange.apikey, exchange.secretkey);
            
            
            strategy.primaryExchange.publicClient.getFutureTicker(function(err, resp) {                
                strategy.primaryExchange.ticker = resp.ticker;
                checkTickers(strategy);
            }, 'btc_usd', 'quarter');
            
        } else if(exchange.name.trim().toLowerCase() == "796") {
            strategy.primaryExchange.publicClient = new Futures796();
            strategy.primaryExchange.privateClient = new Futures796(exchange.apikey, exchange.secretkey);
        
            strategy.primaryExchange.publicClient.getFutureTicker(function(err, resp) {               
                strategy.primaryExchange.ticker = resp.ticker;
                checkTickers(strategy);
            });
            
        }
    });
    
    Exchange.findOne({"_id": strategy.insuranceExchange}, function(err, exchange) {
        if(err) {
            console.log("ERROR: " + err);
        }
        
        strategy.insuranceExchange = exchange;
        strategy.insuranceExchange.name = exchange.name;
       
       
        if(exchange.name.trim().toLowerCase() == "okcoin") {
            strategy.insuranceExchange.publicClient = new OKCoin();
            strategy.insuranceExchange.privateClient = new OKCoin(exchange.apikey, exchange.secretkey);
        
            strategy.insuranceExchange.publicClient.getFutureTicker(function(err, resp) {
                strategy.insuranceExchange.ticker = resp.ticker;
                checkTickers(strategy);
            }, 'btc_usd', 'quarter');
        
        } else if(exchange.name.trim().toLowerCase() == "796") {
            strategy.insuranceExchange.publicClient = new Futures796();
            strategy.insuranceExchange.privateClient = new Futures796(exchange.apikey, exchange.secretkey);
        
            strategy.insuranceExchange.publicClient.getTicker(function(err, resp) {                   
                strategy.insuranceExchange.ticker = resp.ticker;
                checkTickers(strategy);
            });
        }
    });
    
    console.log("-------------------------------------------------");
    console.log("Long Biased Hedge: ");
    console.log("-------------------------------------------------");
        
    console.log("Total Coins: %s BTC, Max Buy Price: %s USD, Insurance Coverage: %s %",
        totalCoins, maxBuyPrice, insuranceCoverage*100);    
}

function checkTickers(strategy) {
    var done =  false; 
        
    if(strategy.primaryExchange.ticker && strategy.insuranceExchange.ticker) {
        var done = true;
        console.log("Primary Exchange: %s || Last Price: %s",
            strategy.primaryExchange.name, strategy.primaryExchange.ticker.last);
        console.log("Insurance Exchange: %s || Last Price: %s",
            strategy.insuranceExchange.name, strategy.insuranceExchange.ticker.last);
    }
    
    if(done) {
        performLonghedgeStrategy(strategy);
    }
}

function performLonghedgeStrategy(strategy) {
    var longhedge = {};
    
    longhedge.primaryLTP = strategy.primaryExchange.ticker.last;
    longhedge.currentSpread = strategy.primaryExchange.ticker.last - strategy.insuranceExchange.ticker.last;
    longhedge.averageSpread = (strategy.primaryExchange.ticker.high - strategy.primaryExchange.ticker.low) +
        (strategy.insuranceExchange.ticker.high - strategy.insuranceExchange.ticker.low) / 2;
        
    console.log("The Current Spread: " + longhedge.currentSpread);
    console.log("3Hr Average Spread: " + longhedge.averageSpread);  
    
}


