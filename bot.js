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

var okcoin_holding = 0;
var futures796_holding = 0;

// INIT
getData();

function getData() {
    DATA = {
        OKCOIN: {},
        FUTURES796: {}
    };
    
    futures796_public_client.getTicker(function (err, response) {
        if(err) {
            console.log("ERROR: " + err);
        }
        
        DATA.FUTURES796.ticker = response;
        checkDone(DATA);
    });

    futures796_public_client.getDepth(function (err, response) {
        if(err) {
            console.log("ERROR: " + err);
        } 
        
        DATA.FUTURES796.depth = response;
        checkDone(DATA);
    });

    futures796_public_client.getTrades(function (err, response) {
        if(err) {
            console.log("ERROR: " + err);
        }

        DATA.FUTURES796.trades = response;
        checkDone(DATA);
    });

    okcoin_public_client.getFutureTicker(function (err, response) {
        if(err) {
            console.log("ERROR: " + err);
        }
        
        DATA.OKCOIN.ticker = response;
        checkDone(DATA);
    }, 'btc_usd', 'quarter');

    okcoin_public_client.getFutureDepth(function (err, response) {
        if(err){
            console.log("ERROR: " + err);
        }
        
        DATA.OKCOIN.depth = response;
        checkDone(DATA);
    }, 'btc_usd', 'quarter');

    okcoin_public_client.getFutureTrades(function (err, response) {
        if(err) {
            console.log("ERROR: " + err);
        }
        
        DATA.OKCOIN.trades = response;
        checkDone(DATA);
    }, 'btc_usd', 'quarter');
}

function checkDone(DATA) {
    if(Object.keys(DATA.OKCOIN).length == 3 && 
        Object.keys(DATA.FUTURES796).length == 3) {
    
        performStrategy(DATA);
        
        setTimeout(getData, TTL * 1000);
    }
}

function getAverageSpread(ticker1, ticker2) {    
    return Math.abs(Math.abs(ticker1.high - ticker1.low) - Math.abs(ticker2.high - ticker2.low));
}

function performStrategy(DATA) {
        
    var currentSpread = DATA.OKCOIN.ticker.ticker.last - DATA.FUTURES796.ticker.ticker.last;
    var averageSpread = getAverageSpread(DATA.OKCOIN.ticker.ticker, DATA.FUTURES796.ticker.ticker);
    
    var okcoinAverageCost;
    var sum = 0;
    for(var i = 0; i < DATA.OKCOIN.trades.length; i++) { 
        sum += DATA.OKCOIN.trades[i].price;
    }
    if(DATA.OKCOIN.trades.length != 0) {
        okcoinAverageCost = sum / DATA.OKCOIN.trades.length;
    } else {
        okcoinAverageCost = DATA.OKCOIN.ticker.ticker.buy;
    }
    var okcoinLTP = DATA.OKCOIN.ticker.ticker.last;
    
    
    console.log("The current spread is: %s", currentSpread);
    console.log("The average spread is: %s", averageSpread);
    console.log("The okcoin average cost: %s", okcoinAverageCost);
    console.log("The okcoin LTP is: %s", okcoinLTP);

    
    longhedge(currentSpread, averageSpread, okcoinAverageCost, okcoinLTP, okcoin_holding, futures796_holding); 
    
}

function longhedge(currentSpread, avgSpread, okcAvgCost, okcLTP, okcoin_holding, futures796_holding)
{
    console.log("%s| Spread: %s | Avg Spread: %s | OKC Avg Cost: %s | OKC LTP: %s | OKC: %s | 796: %s",
        Date.now(), currentSpread.toFixed(2), avgSpread.toFixed(2), okcAvgCost.toFixed(2), okcLTP.toFixed(2), okcoin_holding, futures796_holding);
        
    if(okcoin_holding < MAX_COINS_TO_HEDGE && okcLTP < MAX_BUY_PRICE && currentSpread < avgSpread) {
        console.log("Buy 10 BTC Long from OKC @ %s", okcLTP);
        okc_holding += 10;
    }
    
    if(okcLTP > (okcAvgCost * 1.0125)) {
        if((INSURANCE_COVER_RATE * okc_holding) > futures796_holding) {
            console.log("Sell %s BTC Short from 796 @ %s", INSURANCE_COVER_RATE*futures796_holding,okcLTP);
            futures796_holding -= INSURANCE_COVER_RATE*futures796_holding;
        }

        if(okcLTP > (okcAvgCost * 1.025)) {
            if(okc_holding > 0) {
                console.log("Sell %s BTC Long from OKC @ %s", okc_holding / 2, okcLTP);
                okc_holding -= (okc_holding / 2);
            }
        }
        
        if(okcLTP > (okcAvgCost * 1.04)) {
            console.log("Buy %s BTC Short from 796 @ %s", (okc_holding*INSURANCE_COVER_RATE)/2, okcLTP);
            futures796_holding += (okc_holding*INSURANCE_COVER_RATE)/2;
        }
    }
    
    if(okcLTP < (okcAvgCost / 1.005)) {
        console.log("Close (Sell) %s BTC Long from OKC @ %s", okc_holding, okcLTP);
        okc_holding = 0;
    }
}