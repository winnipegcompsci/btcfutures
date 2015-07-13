var btcstats = require('btc-stats');
var http = require('http');
var async = require('async');

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
var CURRENT_AMOUNT_INSURED;

var CURRENT_SPREAD;
var AVERAGE_SPREAD;

var OKCOIN_AVERAGE_COST;
var OKCOIN_LTP;


function setCurrentValues() {
    TOTAL_CURRENT_LONG = 0;
    
    publicClient = new OKCoin();
    privateClient = new OKCoin(okcoin_key, okcoin_secret);
    
    publicClient.getFutureTrades(function(err, resp) {
        if(resp) {
            var buyAmount;
            var numBuy = 0;
            
            var sellAmount;
            var numSell = 0; 
            
            resp.forEach(function (item) {
                if(item.type == "buy") {
                    buyAmount += item.price;
                    numBuy++;
                } else if (item.type == "sell") {
                    sellAmount += item.price;
                    numSell++;
                }
            });
            AVERAGE_SPREAD = (buyAmount / numBuy) - (sellAmount / numSell);  
            
                    
            privateClient.getFixedFuturePositions(function(err, resp) {
                if(resp.result) {
                    
                    
                    for(var i = 0; i < resp.holding.length; i++) {
                        TOTAL_CURRENT_LONG += resp.holding[i].buy_amount;
                        TOTAL_CURRENT_SHORT += resp.holding[i].sell_amount;
                        OKCOIN_AVERAGE_COST = resp.holding[i].buy_price_avg;
                    }
                
                    // GET OKCOIN _LTP
                    publicClient.getFutureTicker(function(err, ticker_resp) {
                        if(err) {
                           console.log("ERROR: " + err);
                        } else {
                            OKCOIN_LTP = ticker_resp.ticker.last;
                            
                            // GET SPREADS
                            var buffer = "";
                            http.get('http://api.796.com/v3/futures/ticker.html?type=weekly', function(res) {
                                res.on('data', function(d) {
                                    buffer += d;
                                });
                                
                                res.on('end', function() {
                                    var sevenTicker = JSON.parse(buffer);
                                    
                                    AVERAGE_SPREAD = Math.abs(sevenTicker.ticker.high - ticker_resp.ticker.high);
                                    CURRENT_SPREAD = Math.abs(sevenTicker.ticker.last - OKCOIN_LTP);

                                    checkForAdvice();
                                });
                            });
                            
                            // checkForAdvice();
                        }
                        
                        // checkForAdvice();
                        
                    }, 'btc_usd', 'quarter');
                }
                // checkForAdvice();
            }, 'btc_usd', 'quarter', 1);             
        }
    }, 'btc_usd', 'quarter');
}

function checkForAdvice() {
    console.log();
    
    console.log("Checking for advice: ");
    console.log("Current OKCoin LTP: " + OKCOIN_LTP);
    console.log("Average Cost of OKCOIN: " + OKCOIN_LTP);
    console.log("Total Current Long: " + TOTAL_CURRENT_LONG);
    console.log("Current Spread: " + CURRENT_SPREAD);
    console.log("Average Spread: " + AVERAGE_SPREAD);

    setTimeout(getBuyAdvice, TTL * 1000);
    setTimeout(getSellAdvice, TTL * 1000);
}

function getBuyAdvice() {
    var order_type = 1;     // Open Long Position
    var match_price = 1;    // 0: NO, 1: YES (Ignore Price)
    var lever_rate = 10;    // Leverage Rate, 10 or 20.
    
    if(OKCOIN_LTP < MAX_BUY_PRICE && TOTAL_CURRENT_LONG < MAX_COINS_TO_HEDGE && CURRENT_SPREAD < AVERAGE_SPREAD) {
        privateClient.addFutureTrade(function(buyError, buyResp) {
            if(buyResp.result) {
                console.log("Placed Long Order on OKCoin");
            } else {
                console.log("Error Placing Purchase Order: " + getErrorMessage(buyResp.error_code));
            }
        }, 'btc_usd', 'quarter', COINS_PER_TX, OKCOIN_LTP, order_type, match_price, lever_rate );
    } else {
        console.log("Not Placing Buy Order");
    }
    
    setTimeout(setCurrentValues, TTL * 1000);
}

function getSellAdvice() {
    var order_type = 2;     // Open Long Position
    var match_price = 1;    // 0: NO, 1: YES (Ignore Price)
    var lever_rate = 10;    // Leverage Rate, 10 or 20.
    
    if(OKCOIN_LTP > (OKCOIN_AVERAGE_COST*1.0125) ) {
        privateClient.addFutureTrade(function(buyError, buyResp) {
            if(buyResp.result) {
                console.log("Placed Short Order on OKCoin");
            } else {
                console.log("Error Placing Short Order: " + getErrorMessage(buyResp.error_code));
            }
        }, 'btc_usd', 'quarter', CURRENT_AMOUNT_INSURED * INSURANCE_COVER_RATE , OKCOIN_LTP, order_type, match_price, lever_rate );
    }
    
    if(OKCOIN_LTP > (OKCOIN_AVERAGE_COST*1.025) ) {
        privateClient.addFutureTrade(function(buyError, buyResp) {
            if(buyResp.result) {
                console.log("Sold Half of Current Long Position Held");
            } else {
                console.log("Error Selling 1/2 Current Long: " + getErrorMessage(buyResp.error_code));
            }
        }, 'btc_usd', 'quarter', TOTAL_CURRENT_LONG / 2, OKCOIN_LTP, 3, match_price, lever_rate);
    }
    
    if(OKCOIN_LTP < (OKCOIN_AVERAGE_COST*1.0125)) {
        privateClient.addFutureTrade(function(buyError, buyResp) {
            if(buyResp.result) {
                console.log("Closed Out Long Position on OKCoin @ %s", OKCOIN_LTP);
            } else {
                console.log("Error Closing Out Current Long Position on OKCoin @ %s: %s", OKCOIN_LTP, getErrorMessage(buyResp.error_code));
            }
        }, 'btc_usd', 'quarter', TOTAL_CURRENT_LONG, OKCOIN_LTP, 3, match_price, lever_rate);
    }
    
    if(OKCOIN_LTP < (OKCOIN_AVERAGE_COST/1.0125)) {
        privateClient.addFutureTrade(function(buyError, buyResp) {
            if(buyResp.result) {
                console.log("Bought Additional Insurance from OKCoin");
            } else {
                console.log("Error Buying Additional Insurance from OKCoin");
            }
        }, 'btc_usd', 'quarter', TOTAL_CURRENT_LONG * INSURANCE_COVER_RATE, OKCOIN_LTP, 2, match_price, lever_rate);
    }
}

///////////// INIT ///////////////////////////////////////////////////////////////

setCurrentValues();


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
