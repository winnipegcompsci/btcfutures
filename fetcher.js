var btcstats = require('btc-stats');

// OKCOIN 
var OKCoin = require('okcoin');
var okcoin_key = process.argv[2] || 'a3df6a8b-2799-4988-9336-e4ce74b88408';
var okcoin_secret = process.argv[3] || 'C890A97000A0A5102CF6462F4F7BDCC1';

// DEBUG
var util = require('util');

// Trading Strategy Variables 
var MAX_COINS_TO_HEDGE = 100;               // Don't Hedge more than 100 BTC
var MAX_BUY_PRICE = 300;                // Max Buy Price of 300 USD / BTC
var INSURANCE_COVERAGE_RATE = 0.70;     // Target Insurance Coverage of 70% of Main Exchange
var PRIMARY_EXCHANGE = "okcoin";
var BIAS = 1;                           // BUY LONG
var SELL_BIAS = 3;                      // SELL LONG

var currentlyHedging = 0;                   // Amount Currently Being Hedged.
var PURCHASES = [];
var SALES = [];

var numCallBacks = 0;

var PAPERTRADE = true;                  // DEBUG TRADES BY HAND.
var DEBUG = true;


var data = {};

function getStats() {
    data = {};
    
    //var activeExchanges = ["bitfinex", "bitstamp", "okcoin", "btce", "sevenninesix", "bitvc"];
    var activeExchanges = ['okcoin', 'sevenninesix', 'bitfinex', 'bitstamp', 'btce'];
    
    btcstats.exchanges(activeExchanges);


    var MongoClient = require('mongodb').MongoClient;
    
    btcstats.avg(function(error, resp) {
        if(!error) {
            
            data.average = resp;
            resp.timestamp = Math.floor(Date.now() / 1000);
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('average_prices').insert(resp);
                db.close();
            });
        }
        
        checkdoneFetch(data);
    });

    btcstats.weightedAvg(function(error, resp) {
        if(!error) {
            
            data.vwap = resp.price;
            resp.timestamp = Math.floor(Date.now() / 1000);
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('vwap_prices').insert(resp);
                db.close();
            });
        }
        
        checkdoneFetch(data);
    });
    
    btcstats.min(function(error, resp) {
        if(!error) {
            
            data.minPrice = resp;
            resp.timestamp = Math.floor(Date.now()/1000);
            
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('min_prices').insert(resp);
                db.close();
            });
        }
        
        checkdoneFetch(data);
    });
    
    btcstats.max(function(error, resp) {
        if(!error) {
            
            data.maxPrice = resp;
            resp.timestamp = Math.floor(Date.now()/1000);
            
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('max_prices').insert(resp);
                db.close();
            });
        }
        
        checkdoneFetch(data);
    });

    btcstats.minSpread(function(error, resp) {
        if(!error) {
            
            data.minSpread = resp;
            resp.timestamp = Math.floor(Date.now() / 1000);
            
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('min_spread').insert(resp);
                db.close();
            });
        }
        
        checkdoneFetch(data);
    });
    
    btcstats.maxSpread(function(error, resp) {
        if(!error) {
            
            data.maxSpread = resp;
            resp.timestamp = Math.floor(Date.now() / 1000);
            
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('max_spread').insert(resp);
                db.close();
            });
        }
        
        checkdoneFetch(data);
    });    
    
    btcstats.minVolume(function(error, resp) {
        if(!error) {
            
            data.minVolume = resp;
            resp.timestamp = Math.floor(Date.now() / 1000);
            
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('min_volume').insert(resp);
                db.close();
            });
        }
        
        checkdoneFetch(data);
    });
    
    btcstats.maxVolume(function(error, resp) {
        if(!error) {            
        
            data.maxVolume = resp;
            resp.timestamp = Math.floor(Date.now() / 1000);
            
            MongoClient.connect("mongodb://localhost:27017/btcstats", function(err, db) {
                db.collection('max_volume').insert(resp);
                db.close();
            });
        }
        
        checkdoneFetch(data);
    });
    
}

function checkdoneFetch(data) {   
    var targetLength = 8;  
    numCallBacks++;
    
    if(numCallBacks == targetLength) {
        numCallBacks = 0;
        
        var numSeconds = 10;
        
        if(DEBUG) {
            // console.log("Debug Calculated Data: " + util.inspect(data));
            console.log("Fetching data again in %s seconds", numSeconds);
        }       

        // setTimeout(getLongFutureBuyAdvice(data), numSeconds * 1000);   
        // setTimeout(getLongFutureSellAdvice(data), numSeconds * 1000);
        setTimeout(getStats, (numSeconds*2) * 1000);    
    
    } else {
        if(DEBUG) {
            console.log("Received callback %s / %s", numCallBacks, targetLength);
        }
    }
}

function getErrorMessage(error_code) {
    var errorCodes = {
        10000: 'Required parameter can not be null',
        10001: 'Requests are too frequent',
        10002: 'System Error',
        10003: 'Restricted list request, please try again later',
        10004: 'IP restriction',
        10005: 'Key does not exist',
        10006: 'User does not exist',
        10007: 'Signatures do not match',
        10008: 'Illegal parameter',
        10009: 'Order does not exist',
        10010: 'Insufficient balance',
        10011: 'Order is less than minimum trade amount',
        10012: 'Unsupported symbol (not btc_usd or ltc_usd)',
        10013: 'This interface only accepts https requests',
        10014: 'Order price must be between 0 and 1,000,000',
        10015: 'Order price differs from current market price too much',
        10016: 'Insufficient coins balance',
        10017: 'API authorization error',
        10026: 'Loan (including reserved loan) and margin cannot be withdrawn',
        10027: 'Cannot withdraw within 24 hrs of authentication information modification',
        10028: 'Withdrawal amount exceeds daily limit',
        10029: 'Account has unpaid loan, please cancel/pay off the loan before withdraw',
        10031: 'Deposits can only be withdrawn after 6 confirmations',
        10032: 'Please enabled phone/google authenticator',
        10033: 'Fee higher than maximum network transaction fee',
        10034: 'Fee lower than minimum network transaction fee',
        10035: 'Insufficient BTC/LTC',
        10036: 'Withdrawal amount too low',
        10037: 'Trade password not set',
        10040: 'Withdrawal cancellation fails',
        10041: 'Withdrawal address not approved',
        10042: 'Admin password error',
        10100: 'User account frozen',
        10216: 'Non-available API',
        20001: 'User does not exist',
        20002: 'User is frozen',
        20003: 'Frozen due to mandatory liquidation',
        20004: 'Future account frozen',
        20005: 'User future account does not exist',
        20006: 'Required field is null',
        20007: 'Illegal parameter',
        20008: 'Future account fund balance is zero',
        20009: 'Future contract status error',
        20010: 'Marginal Rate Illegal',
        20011: 'Marginal Rate < 90%',
        20012: 'Marginal Rate < 90%',
        20013: 'Temporarily No Counter Party Price',
        20014: 'OKCOIN System Error',
        20015: 'Order Does Not Exist',
        20016: 'Liquidation Quantity Bigger Than Current  Holding',
        20017: 'Not Authorized / Illegal Order ID',
        20018: 'Order Price Higher Than 105% or Lower Than 95% of last minute',
        20019: 'This IP cannot use this resource',
        20020: 'Secret Key Does Not Exist',
        20021: 'Index Information Does Not Exist',
        20022: 'API Invoke Error',
        
        503: 'Too many requests (Http)'
    };
        
    if(!errorCodes[error_code]) {
        return "UNKNOWN ERROR CODE: " + error_code;
    } else {
        return errorCodes[error_code];
    }
}

getStats();

// getFutureBuyAdvice();
// getFutureSellAdvice();