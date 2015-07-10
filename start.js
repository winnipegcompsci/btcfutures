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

var currentlyHedging = 0;                   // Amount Currently Being Hedged.
var PURCHASES = [];
var SALES = [];


var PAPERTRADE = true;                  // DEBUG TRADES BY HAND.
var DEBUG = false;
// var data = {};

function getStats() {
    //var activeExchanges = ["bitfinex", "bitstamp", "okcoin", "btce", "sevenninesix", "bitvc"];
    var activeExchanges = ['okcoin', 'sevenninesix', 'bitfinex', 'bitstamp', 'btce'];
    
    btcstats.exchanges(activeExchanges);
    var data = {};

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
    if(Object.keys(data).length == 8) {
        var numSeconds = 10;
        
        if(DEBUG) {
            console.log("Debug Calculated Data: " + util.inspect(data));
            console.log("Fetching data again in %s seconds", numSeconds);
        }
        
        console.log("\nAmount Invested: " + calcProfitLoss() + " USD || " + 
            PURCHASES.length + " purchases, " + SALES.length + " sales");
        
        setTimeout(getStats, numSeconds * 1000);
        setTimeout(getBuyAdvice(data), numSeconds * 1000);
        setTimeout(getSellAdvice(data), numSeconds * 1000);
    }
}


function getBuyAdvice(data) {

    var lastTradedPrice = 0;
    // Checking OKCOin  for Current Orders and Placing a New Order.
    publicClient = new OKCoin();
    privateClient = new OKCoin(okcoin_key, okcoin_secret);
    
    privateClient.getOrderInfo(function(err, resp) {
        if(err) {
            console.log("Error: " + err);
        }
    
        if(resp.result) {
            if(!PAPERTRADE) {
                currentlyHedging = 0;
            }
            
            for(var i = 0; i < resp.orders.length; i++) {
                currentlyHedging += resp.orders[i].amount;
            }

            if(currentlyHedging < MAX_COINS_TO_HEDGE && Number(data.average.price) < Number(MAX_BUY_PRICE)) {                
                thisAmount = ((Math.random()*6)) + 7;
                
                if(MAX_COINS_TO_HEDGE < currentlyHedging + thisAmount) {
                    thisAmount = MAX_COINS_TO_HEDGE - currentlyHedging;
                } else {
                    thisAmount = (Math.random() * 12) + 8;
                }
                
                if(PAPERTRADE) {
                    currentlyHedging += thisAmount; // DEBUG
                }
                
                publicClient.getTicker(function(err, resp) {
                    if(err) {
                        console.log("Error: " + err);
                    }
                    var lastTradedPrice = resp.ticker.buy;                    
                    console.log("BUY %s BTC from OKCOIN @ $ %s (Hedging %s / %s BTC)", 
                        thisAmount, resp.ticker.buy, currentlyHedging, MAX_COINS_TO_HEDGE);
                
                   
                    privateClient.addTrade(function(err, resp) {
                        if(resp.result) {
                            console.log("Your buy order for %s was successfully placed!", thisAmount)
                        } else {
                            console.log("Failed to place your order on okcoin: %s",
                                getErrorMessage(resp.error_code));
                        }
                    }, 'btc_usd', 'buy', thisAmount, lastTradedPrice );
                    PURCHASES.push({"amount": thisAmount, "price": lastTradedPrice, "sold" : false});
                }, 'btc_usd');
            }
        }
    }, 'btc_usd', '-1');
    
}

function getSellAdvice(data) {
        
    publicClient = new OKCoin();
    privateClient = new OKCoin(okcoin_key, okcoin_secret);

    publicClient.getTicker(function(err, resp) {
        if(err) {
            // Print Error.
            console.log("Error: " + err);
        }
        var lastTradedPrice = resp.ticker.sell;                    
        
        if(PURCHASES) {
            for(var i = 0; i < PURCHASES.length; i++) {
                if(!PURCHASES[i].sold == false && lastTradedPrice > PURCHASES[i].price * 1.00125 && (currentlyHedging - PURCHASES[i].amount) > 0 ) {                        
                    privateClient.addTrade(function(err, resp) {
                        if(resp.result) {
                            console.log("Your sell order for %s was successfully placed!", PURCHASES[i].amount)
                        } else {
                            console.log("Failed to place your order on okcoin: %s",
                                getErrorMessage(resp.error_code));
                        }
                    }, 'btc_usd', 'sell', PURCHASES[i].amount, lastTradedPrice );
                    
                    SALES.push({"amount": PURCHASES[i].amount, "price": lastTradedPrice});
                    
                    console.log("SELL %s BTC from OKCOIN @ $ %s (Hedging %s / %s BTC)",
                        PURCHASES[i].amount, lastTradedPrice, currentlyHedging - PURCHASES[i].amount, MAX_COINS_TO_HEDGE);
                    
                    if(PAPERTRADE) {
                        currentlyHedging -= PURCHASES[i].amount; // DEBUG
                        PURCHASES[i].sold = true;
                    }
                } else {
                    if(DEBUG) {
                        console.log("Current Price: %s, Not selling %s BTC bought at $ %s until the price gets to %s",
                            lastTradedPrice, PURCHASES[i].amount, PURCHASES[i].price, PURCHASES[i].price * 1.0125);
                    }
                }
            }
        }
        
    }, 'btc_usd');   
}

function calcProfitLoss() {
    var profitloss = 0;
    var totalBTCHolding = 0;
    
    if(PURCHASES) {
        for(var i = 0; i < PURCHASES.length; i++) {
            profitloss -= (PURCHASES[i].price * PURCHASES[i].amount);
            totalBTCHolding += PURCHASES[i].amount;
        }
    }

    if(SALES) {
        for(var j = 0; j < SALES.length; j++) {
            profitloss += (SALES[j].price * SALES[j].amount);
            totalBTCHolding -= SALES[j].amount;
        }
    }
    
    return "Profit/Loss: " + profitloss + " (holding: " + totalBTCHolding + " BTC) ";
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
        503: 'Too many requests (Http)'
    };
        
    if(!errorCodes[error_code]) {
        return "UNKNOWN ERROR CODE: " + error_code;
    } else {
        return errorCodes[error_code];
    }
}

getStats();