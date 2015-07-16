// Requires.
var btcstats = require('btc-stats');
var http = require('http');
var async = require('async');
var Q = require('q');
var clc = require('cli-color');
var fs = require('fs');


// OKCOIN 
var OKCoin = require('okcoin');
var okcoin_key = process.argv[2] || 'a3df6a8b-2799-4988-9336-e4ce74b88408';
var okcoin_secret = process.argv[3] || 'C890A97000A0A5102CF6462F4F7BDCC1';

var TTL = 10;               // Number of Seconds to Wait.

// Prompt for These Variables
var MAX_COINS_TO_HEDGE = process.argv[4] || 100;
var MAX_BUY_PRICE = process.argv[5] || 350;
var INSURANCE_COVER_RATE = process.argv[6] || 0.70;

// Other Calculated Vars
var COINS_PER_TX = 10;

var TOTAL_CURRENT_LONG;
var TOTAL_CURRENT_SHORT;

var CURRENT_SPREAD;
var AVERAGE_SPREAD;
var PAST_SPREADS = [];

var OKCOIN_AVERAGE_COST;
var OKCOIN_LTP;

// OKCoin API Clients.

var publicClient = new OKCoin();
var privateClient = new OKCoin(okcoin_key, okcoin_secret);

// Papertrading Variables
var PAPERTRADE = true;
var PAPERTRADE_LONG = 0;
var PAPERTRADE_SHORT = 0;
var PAPERTRADE_COSTS = [];

function getCurrentValues() {
    // TOTAL_CURRENT_LONG && TOTAL_CURRENT_SHORT && OKCOIN_AVERAGE_COST
    // OKCOIN_LTP
    
    publicClient.getFutureTicker(function(err, ticker_resp) {
        TOTAL_CURRENT_LONG = 0;
        TOTAL_CURRENT_SHORT = 0;
        OKCOIN_AVERAGE_COST = 0;        
        
        if(err) {
            console.log("ERROR: " + err);
        } else {
            OKCOIN_LTP = ticker_resp.ticker.last;
            
            CURRENT_SPREAD = Math.abs(ticker_resp.ticker.buy - ticker_resp.ticker.sell);
            
            publicClient.getFutureKline(function (err, candles_resp) {
                if(err) {
                    console.log("ERROR: " + err);
                } else {
                    candles = candles_resp;
                    
                    var sum = 0;
                    for(i = 0; i < candles.length; i++) {
                        sum += Math.abs(candles[i][1] - candles[i][2]);
                    }
                    
                    AVERAGE_SPREAD = (sum / candles.length) * 1.1;
                    
                    privateClient.getFixedFuturePositions(function(err, resp) {
                        if(err) {
                            console.log("Error: " + err);
                        }

                        if(resp.result) {
                    
                            for(var i = 0; i < resp.holding.length; i++) {
                                TOTAL_CURRENT_LONG += resp.holding[i].buy_amount;
                                TOTAL_CURRENT_SHORT += resp.holding[i].sell_amount;
                                OKCOIN_AVERAGE_COST = resp.holding[i].buy_price_avg;
                            }
                
                            if(PAPERTRADE) {
                                TOTAL_CURRENT_LONG = PAPERTRADE_LONG;
                                TOTAL_CURRENT_SHORT = PAPERTRADE_SHORT;
                                OKCOIN_AVERAGE_COST = papertrade_getavgprice();
                            }
                
                            doStrategy();
                        } 
                    }, 'btc_usd', 'quarter', 1);
                    
                }
            }, 'btc_usd', '1hour', 'quarter', null, Math.round(new Date().getTime() / 1000) - (3 * 3600));
           
        } // end else 
    }, 'btc_usd', 'quarter');
}
                      
function doStrategy() {
    // Print Vars.
    console.log("\OKCoin LTP: %s || Avg. Cost: %s || Spread: %s vs. (3Hr Spread): %s || Long: %s BTC || Short: %s BTC\n",
        OKCOIN_LTP.toFixed(2), OKCOIN_AVERAGE_COST.toFixed(2), CURRENT_SPREAD.toFixed(2), AVERAGE_SPREAD.toFixed(2), TOTAL_CURRENT_LONG.toFixed(2), TOTAL_CURRENT_SHORT.toFixed(2));
    
    longhedge();  
    // shorthedge();
    setTimeout(getCurrentValues, TTL * 1000);
}

function papertrade(amount, price, bias, type) {
    console.log(clc.green("PAPERTRADE:" + type + " - " + bias + " - " + amount + " @ " + price));
    
    fs.appendFile("papertrade_trades.txt", 
        "\r\n" + Math.floor(Date.now()) + "," + type + ", " + bias + ", " + amount + ", " + price + ";"
        , function(err) {
            if(err) {
                console.log("Error Writing Papertrade Log: " + err);
            }
        });
    
    if(bias == "LONG") {
        if(type == "BUY") {
            PAPERTRADE_LONG += amount;
        } else if (type == "SELL") {
            PAPERTRADE_LONG -= amount;
        }
    }
    
    if(bias == "SHORT") {
        if(type == "BUY") {
            PAPERTRADE_SHORT += amount;
        } else if (type == "SELL") {
            PAPERTRADE_SHORT -= amount;
        }       
    }
    
    PAPERTRADE_COSTS.push(price);
}

function papertrade_getavgprice() {
    var sum = 0;
    for(var i = 0; i < PAPERTRADE_COSTS.length; i++) {
        sum += PAPERTRADE_COSTS[i];
    }
    
    if(PAPERTRADE_COSTS.length != 0) {
        return sum / PAPERTRADE_COSTS.length;
    } else {
        return 0;
    }
}

function longhedge() {
    // Check if We Should Buy
    COINS_PER_TX = Math.random() * (14 - 6) + 6;
    
    if(TOTAL_CURRENT_LONG + COINS_PER_TX > MAX_COINS_TO_HEDGE) {
        COINS_PER_TX = MAX_COINS_TO_HEDGE - TOTAL_CURRENT_LONG;
    }
    
    if((COINS_PER_TX > 0) && (OKCOIN_LTP < MAX_BUY_PRICE) && (TOTAL_CURRENT_LONG + COINS_PER_TX <= MAX_COINS_TO_HEDGE) && (CURRENT_SPREAD < AVERAGE_SPREAD)) {
        var order_type = 1;     // 1: Open Long Position, 2: Open Short, 3: Close Long, 4: Close Short
        var match_price = 1;    // 0: NO, 1: YES (Ignore Price)
        var lever_rate = 10;    // Leverage Rate, 10 or 20.
        
        if(PAPERTRADE) {
            papertrade(COINS_PER_TX, OKCOIN_LTP, "LONG", "BUY");
        } else {
            privateClient.addFutureTrade(function(buyError, buyResp) {
                
                if(buyResp.result) {
                    console.log("Placed Long Order on OKCoin for %s BTC @ %s", COINS_PER_TX, OKCOIN_LTP);
                } else {
                    console.log(clc.red("Error Buying Long Order: " + getErrorMessage(buyResp.error_code)));
                }
            }, 'btc_usd', 'quarter', COINS_PER_TX, OKCOIN_LTP, order_type, match_price, lever_rate );
        }
    } else {
        if(!PAPERTRADE) {
            console.log("No Long Position to Buy");
        }
    }
    
    // Check if We Should Sell
    var order_type = 4;     // Close Short
    var match_price = 1;
    var lever_rate = 10;
    
    if(OKCOIN_LTP > (OKCOIN_AVERAGE_COST * 1.0125)) {
        
        // Sell Insurance
        if((INSURANCE_COVER_RATE*TOTAL_CURRENT_SHORT) > 0) {
            if(PAPERTRADE) {
                papertrade(INSURANCE_COVER_RATE*TOTAL_CURRENT_SHORT, OKCOIN_LTP, 'SHORT', "SELL");
            } else {
                lever_rate = 20;
                
                privateClient.addFutureTrade(function(buyError, buyResp) {
                    if(buyResp.result) {
                        console.log("Sold Insurance");
                    } else {
                        console.log(clc.red("Error Selling Insurance: " + getErrorMessage(buyResp.error_code)));
                    }
                }, 'btc_usd', 'quarter', (INSURANCE_COVER_RATE*TOTAL_CURRENT_SHORT), OKCOIN_LTP, order_type, match_price, lever_rate );
            }
        } else {
            console.log("No Short Position to Sell");
        }
        
        if(OKCOIN_LTP > (OKCOIN_AVERAGE_COST * 1.0250)) {
            var order_type = 3;
            var lever_rate = 10;
            
            if(TOTAL_CURRENT_LONG / 2 > 0) {
                // Sell Half of Current Long
                if(PAPERTRADE) {
                    papertrade(TOTAL_CURRENT_LONG / 2, OKCOIN_LTP, "LONG", "SELL");
                } else {                
                    privateClient.addFutureTrade(function(buyError, buyResp) {               
                        if(buyResp.result) {
                            console.log("Sold Half of Current Long Position");
                        } else {
                            console.log(clc.red("Error Selling Half of Current Long Position: " + getErrorMessage(buyResp.error_code)));
                        }   
                    }, 'btc_usd', 'quarter', (TOTAL_CURRENT_LONG / 2), OKCOIN_LTP, order_type, match_price, lever_rate );
                }
            } else {
                console.log("No Long Position to Sell");
            }
        }
        
        if(OKCOIN_LTP > (OKCOIN_AVERAGE_COST * 1.04)) {
            var order_type = 2;
            var lever_rate = 20;
            
            if((TOTAL_CURRENT_LONG * INSURANCE_COVER_RATE) / 2 > 0) {
                // Buy Insurance
                if(PAPERTRADE) {
                    papertrade((TOTAL_CURRENT_LONG * INSURANCE_COVER_RATE) / 2, OKCOIN_LTP, "SHORT", "BUY");
                } else {
                    privateClient.addFutureTrade(function(buyError, buyResp) {                    
                        if(buyResp.result) {
                            console.log("Bought Insurance");
                        } else {
                            console.log(clc.red("Error Buying Insurance: " + getErrorMessage(buyResp.error_code)));
                        }   
                    }, 'btc_usd', 'quarter', ((TOTAL_CURRENT_LONG * INSURANCE_COVER_RATE) / 2), OKCOIN_LTP, order_type, match_price, lever_rate );
                }
            } else {
                console.log("No Short Position to Buy");
            }
        }
    }
    
    if(OKCOIN_LTP < (OKCOIN_AVERAGE_COST/1.005)) {
        var order_type = 3;
        var lever_rate = 10;
        
        if(TOTAL_CURRENT_LONG > 0) {
        // Close Out Position
            if(PAPERTRADE) {
                papertrade(TOTAL_CURRENT_LONG, OKCOIN_LTP, "LONG", "SELL")
            } else {
                privateClient.addFutureTrade(function(buyError, buyResp) {           
                    if(buyResp.result) {
                        console.log("Closing Long Position");
                    } else {
                        console.log(clc.red("Error Closing Position: " + getErrorMessage(buyResp.error_code)));
                    }   
                }, 'btc_usd', 'quarter', (TOTAL_CURRENT_LONG), OKCOIN_LTP, order_type, match_price, lever_rate );
            }
        } else {
            console.log("No Long Position to Close");
        }
    }
    
    if(OKCOIN_LTP < (OKCOIN_AVERAGE_COST/1.0125) && (TOTAL_CURRENT_LONG*INSURANCE_COVER_RATE) > TOTAL_CURRENT_SHORT) {
        var order_type = 2;
        var lever_rate = 20;
        var steps = [10,20,30,35,40,45,50,55,60,65,70,75,80,85,90]; // Percentage steps. (/100)
        
        if(TOTAL_CURRENT_LONG * INSURANCE_COVER_RATE > 0) {
            if(PAPERTRADE) {
                papertrade(TOTAL_CURRENT_LONG*INSURANCE_COVER_RATE, OKCOIN_LTP, "SHORT", "BUY");
            } else {
                privateClient.addFutureTrade(function(buyError, buyResp) {           
                    if(buyResp.result) {
                        console.log("Bought Insurance");
                    } else {
                        console.log(clc.red("Error Buying Insurance: " + getErrorMessage(buyResp.error_code)));
                    }   
                }, 'btc_usd', 'quarter', (TOTAL_CURRENT_LONG * INSURANCE_COVER_RATE), OKCOIN_LTP, order_type, match_price, lever_rate );
            }
        }
    }
    
    console.log("Checking prices again in %s seconds", TTL);
} // end of longhedge.

function shorthedge() {
    
}

///////////// INIT ///////////////////////////////////////////////////////////////
console.log("Using OKCoin API Key: %s", okcoin_key);
console.log("Using MAX Coins to Hedge: %s", MAX_COINS_TO_HEDGE);
console.log("Using MAX Buy Price of:   %s", MAX_BUY_PRICE);
console.log("Using Insurance Coverage Rate of: %s", INSURANCE_COVER_RATE);
console.log("Using Papertrade: %s\n", PAPERTRADE);

// If Papertrade
if(fs.existsSync('papertrade_trades.txt')) {
    if(PAPERTRADE) {
        fs.readFile('papertrade_trades.txt', function read(err, data) {
            if(err) {
                throw err;
            }
            entries = data.toString().split(";");
            
            for(var i = 0; i < entries.length; i++) {
                entries[i] = entries[i].trim();
                

                parts = entries[i].split(",");
                
                if(parts.length >= 4) {
                    console.log("Papertrade Loaded: " + entries[i]);
                    bias = parts[2].trim();
                    type = parts[1].trim(); 
                    amount = parts[3].trim();
                    price = parts[4].trim();
                    
                    
                    if(bias == "LONG") {
                        if(type == "BUY") {
                            PAPERTRADE_LONG += Number(amount);
                        } else if (type == "SELL") {
                            PAPERTRADE_LONG -= Number(amount);
                        }
                        
                    }
        
                    if(bias == "SHORT") {
                        if(type == "BUY") {
                            PAPERTRADE_SHORT += Number(amount);
                        } else if (type == "SELL") {
                            PAPERTRADE_SHORT -= Number(amount);
                        }
                        
                    }
                    
                    PAPERTRADE_COSTS.push(Number(price));
                }
                
            } // end foreach over past papertrades.
        });  
    }    
}
getCurrentValues();

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
        return "Unknown Error Code: " + error_code;
    } else {
        return errorCodes[error_code];
    }
}
// <EOF>