'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Exchange = mongoose.model('Exchange'),
    Price = mongoose.model('Price'),
    Trade = mongoose.model('Trade'),
	OKCoin  = require('okcoin'),
	Futures796 = require('futures796'),
    BitVC = require('bitvc'),
    BTCe = require('btce'),
    BitMEX = require('bitmex'),
    util = require('util'),
	_ = require('lodash');

	
var okcoin_public = new OKCoin();
var okcoin_private = new OKCoin();

var futures796_public = new Futures796();
var futures796_private = new Futures796();

var bitvc_public = new BitVC();

var btce_public = new BTCe();

var bitmex_public = new BitMEX();

/**
 * Create a Exchange
 */
exports.create = function(req, res) {
	var exchange = new Exchange(req.body);
	exchange.user = req.user;

	exchange.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(exchange);
		}
	});
};

/**
 * Show the current Exchange
 */
exports.read = function(req, res) {
	res.jsonp(req.exchange);
};

/**
 * Update a Exchange
 */
exports.update = function(req, res) {
	var exchange = req.exchange ;

	exchange = _.extend(exchange , req.body);

	exchange.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(exchange);
		}
	});
};

/**
 * Delete an Exchange
 */
exports.delete = function(req, res) {
	var exchange = req.exchange ;

	exchange.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(exchange);
		}
	});
};

/**
 * List of Exchanges
 */
exports.list = function(req, res) { 
	Exchange.find().sort('-created').populate('user', 'displayName').exec(function(err, exchanges) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(exchanges);
		}
	});
};

/**
 * Exchange middleware
 */
exports.exchangeByID = function(req, res, next, id) { 
	Exchange.findById(id).populate('user', 'displayName').exec(function(err, exchange) {
		if (err) return next(err);
		if (! exchange) return next(new Error('Failed to load Exchange ' + id));
		req.exchange = exchange ;
		next();
	});
};

/**
 * Exchange authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.exchange.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};

exports.getCurrentPrice = function(req, res) {
	var thisName = req.exchange.name.toLowerCase().replace(' ', '');
	
    if(thisName === 'okcoin') {
        okcoin_public.getFutureTicker(function(err, ticker_resp) {
            if(err) {
                return res.status(500).send(err);
            }
            
            return res.send(ticker_resp.ticker);
        }, 'btc_usd', 'quarter');
        
    } else if (thisName === '796' || thisName === 'futures796') {
        futures796_public.getTicker(function(err, ticker_resp) {
            if(err) {
                return res.status(500).send(err);
            }
            
            return res.send(ticker_resp.ticker);
        });
    } else if (thisName === 'bitvc') {
        bitvc_public.getTicker(function(err, ticker_resp) {
            if(err) {
                return res.status(500).send(err);
            } 

            bitvc_public.getExchangeRate(function(err, exchange_rate) {
                if(err) {
                    return res.status(500).send(err);
                }
                
                if(exchange_rate) {
                    ticker_resp.last = ticker_resp.last / exchange_rate.rate;
                    ticker_resp.high = ticker_resp.high / exchange_rate.rate;
                    ticker_resp.low = ticker_resp.low / exchange_rate.rate;
                    ticker_resp.buy = ticker_resp.buy / exchange_rate.rate;
                    ticker_resp.sell = ticker_resp.sell / exchange_rate.rate;
                }
                return res.send(ticker_resp);
            });
            
            
            
        });
    } else if (thisName === 'btc-e') {
        btce_public.getTicker(function(err, ticker_resp) {
            if(err) {
                return res.status(500).send(err);
            }

            return res.send(ticker_resp.btc_usd);
            
        });
    
    } else if (thisName === 'bitmex') { 
        bitmex_public.getActiveIndices(function(err, ticker_resp) {
            if(err) {
                return res.status(500).send(err);
            }           
            
            for(var i = 0; i < ticker_resp.length; i++) {
            
                if(ticker_resp[i].symbol === 'XBTZ15') {
                    return res.send({
                        last: ticker_resp[i].lastPrice,
                        high: ticker_resp[i].highPrice,
                        low: ticker_resp[i].lowPrice,
                        buy: ticker_resp[i].bidPrice,
                        sell: ticker_resp[i].askPrice                        
                    });
                }
            }
            
            return res.send(ticker_resp);
        });
    
    } else {
        res.status(500).send('ERROR: ' + thisName + ' Function GetCurrentPrice() -- Not Found');
    }
};


exports.addTrade = function(req, res) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');

    var amount = req.amount;
    var price = req.price;
    var type = req.type;
    var match_price = req.match_price;
    var lever_rate = req.lever_rate;
    
    if(thisName === 'okcoin') {
        okcoin_private.addFutureTrade(function (err, newTrade_resp) {
            
            res.send(newTrade_resp);
        }, 'btc_usd', 'quarter', amount, price, type, match_price, lever_rate);
        
    } else if (thisName === '796' || thisName === 'futures796') {        
        futures796_private.openBuy(function (err, newTrade_resp) {
            res.send(newTrade_resp);
        }, '0.10', '10', price, 'A');
    } else {
        res.status(500).send('ERROR: ' + thisName + ' Function AddTrade() -- Not Found');
    }
    
    var trade = req.trade;
};

exports.getCurrentTrades = function(req, res) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        okcoin_public.getFutureTrades(function(err, trades_resp) {
            res.send(trades_resp);
        }, 'btc_usd', 'quarter');
    } else if(thisName === '796' || thisName === 'futures796') {
        futures796_public.getTrades(function(err, trades_resp) {
            res.send(trades_resp);
        });
    } else {
        res.status(500).send('ERROR: ' + thisName + ' Function GetCurrentTrades() -- Not Found');
    }
};



exports.getFutureCandles = function(req, res) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        okcoin_public.getFutureKline(function(err, candles_resp) {
           res.send(candles_resp); 
        }, 'btc_usd', '1hour', 'weekly');
    } else if (thisName === '796' || thisName === 'futures796') {
        res.status(500).send('ERROR: 796s API does not provide Candlestick data');
    } else if (thisName === 'bitvc') {
        res.status(500).send('ERROR: BitVCs API does not provide Candlestick data');
    }    
};

exports.getUserInfo = function(req, res) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        okcoin_private = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        okcoin_private.getFixedUserInfo(function(err, user_resp) {
            if(err) {
                res.send(err);
            } else {
                res.send(user_resp);
            }
        });
           
    } else if (thisName === '796' || thisName === 'futures796') {
        res.status(500).send('ERROR: ' + thisName + ' Function GetUserInfo() -- Not Found');
    } else {
        res.status(500).send('ERROR: ' + thisName + ' Function GetUserInfo() -- Not Found');
    }
};

exports.getPricesFromDB = function(req, res) {
    var exchange = req.exchange;
    
    Price.find({'exchange':exchange._id}, function(err, prices) {
        var prices_arr = [];
        var times_arr = [];
        
        for(var i = 0; i < prices.length; i++) {
            prices_arr.push(prices[i].price);
            times_arr.push(prices[i].timestamp);
        }
        res.send({'prices': prices_arr, 'timestamps': times_arr});
    });
    
};


exports.getCurrentHolding = function(req, res) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    
    if(process.env.NODE_ENV === 'development') {
        Trade.find({}, function(err, trades) {
            if(err) {
                res.send(err);
            } else {
                var thisLongAmount = 0;
                var thisShortAmount = 0;
                                
                for(var i = 0; i < trades.length; i++) {                    
                    if(trades[i].exchange._id.toString() === req.exchange._id.toString()) {
                        if(trades[i].type === 'BUY') {
                            if(trades[i].bias === 'LONG') {
                                thisLongAmount += trades[i].amount;
                            } else if (trades[i].bias === 'SHORT') {
                                thisShortAmount += trades[i].amount;
                            }                            
                        } else if (trades[i].type === 'SELL') {
                            if(trades[i].bias === 'LONG') {
                                thisLongAmount -= trades[i].amount;
                            } else if (trades[i].bias === 'SHORT') {
                                thisShortAmount -= trades[i].amount;
                            }
                        }
                        
                    }
                }
                
                // Development Mode.
                res.send({
                    'long': thisLongAmount,
                    'short': thisShortAmount,
                });
                
            }
        }).populate('exchange');
    } else {

        if(thisName === 'okcoin') {
            okcoin_private = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
            okcoin_private.getFixedFuturePositions(function(err, pos_resp) {
                if(err) {
                    res.send(err);
                } else {
                    var thisLongAmount = 0;
                    var thisShortAmount = 0;
                    
                    for(var i = 0; i < pos_resp.holding.length; i++) {
                        thisLongAmount += pos_resp.holding[i].buy_amount;
                        thisShortAmount += pos_resp.holding[i].sell_amount;
                    }
                    
                    res.send({
                       'long': thisLongAmount,
                       'short': thisShortAmount
                    });
                }
            }, 'btc_usd', 'quarter', 1);
            
        } else if (thisName === '796' || thisName === 'futures796') {      
                
            futures796_private = new Futures796(req.exchange.apikey, req.exchange.secretkey);
            futures796_private.getPositions(function(err, pos_resp) {
                
                var thisLongAmount = 0;
                var thisShortAmount = 0;
                
                var $STRING = '10';
                
                if(pos_resp.data.A) {
                    thisLongAmount = pos_resp.data.A.buy.$STRING.total;
                }
                
                if(pos_resp.data.B) {
                    thisShortAmount = pos_resp.data.B.buy.$STRING.total;
                }
                
                res.send({
                    'long': thisLongAmount,
                    'short': thisShortAmount
                });

            });
            
        } else if (thisName === 'bitvc') {
            res.send({
                'long': 0,
                'short': 0
            });
            
            
        } else {
           res.status(500).send('ERROR: ' + thisName + ' Function getCurrentHolding() -- Not Found');
        }
    }
};

/* 
API Functions
*/

// Future Price Functions (Public Client -- GET Requests)
exports.future_ticker = function(req, res) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        var publicClient = new OKCoin();
        
        publicClient.getFutureTicker(function(err, ticker_resp) {
            if(err) {
                return res.status(500).send(err);
            }
            
            return res.send(ticker_resp.ticker);
        }, 'btc_usd', 'quarter');
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }
    
};

exports.future_depth = function(req, res) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');

    if(thisName === 'okcoin') {
        var publicClient = new OKCoin();
        
        publicClient.getFutureDepth(function(err, depth_resp) {
            if(err) {
                return res.status(500).send(err);
            }
            
            return res.send(depth_resp);
        }, 'btc_usd', 'quarter', 5);
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }    
    
};

exports.future_trades = function(req, res) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        var publicClient = new OKCoin();
        
        publicClient.getFutureTrades(function(err, trades_resp) {
            if(err) {
                return res.status(500).send(err);
            }
            
            return res.send(trades_resp);          
        }, 'btc_usd', 'quarter');
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

};

exports.future_index = function(req, res) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        var publicClient = new OKCoin();
        
        publicClient.getFutureIndex(function(err, index_resp) {
            if(err) {
                return res.status(500).send(err);
            }
            
            return res.send(index_resp);
        }, 'btc_usd');
       
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

};

exports.exchange_rate = function(req, res) {
	var thisName = req.exchange.name.toLowerCase().replace(' ', '');    

    if(thisName === 'okcoin') {
        var publicClient = new OKCoin();
        
        publicClient.getExchangeRate(function(err, exchange_resp) {
            if(err) {
                return res.status(500).send(err);
            }
            
            return res.send(exchange_resp);
        });
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

};

exports.future_estimated_price = function(req, res) {
	var thisName = req.exchange.name.toLowerCase().replace(' ', '');  

    if(thisName === 'okcoin') {
        var publicClient = new OKCoin();
        
        publicClient.getFutureEstimatedPrice(function(err, estimated_price_resp) {
            if(err) {
                return res.status(500).send(err);
            }
            
            return res.send(estimated_price_resp);
        }, 'btc_usd');
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }
    
};

exports.future_kline = function(req, res) {
	var thisName = req.exchange.name.toLowerCase().replace(' ', '');    
    
    if(thisName === 'okcoin') {
        var publicClient = new OKCoin();
        
        publicClient.getFutureKline(function(err, kline_resp) {
            if(err) {
                res.status(500).send(err);
            }
            
            return res.send(kline_resp);
            
        }, 'btc_usd', '1min', 'quarter'); 
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

};

exports.future_hold_amount = function(req, res) {
	var thisName = req.exchange.name.toLowerCase().replace(' ', '');    
    
    if(thisName === 'okcoin') {
        var publicClient = new OKCoin();
        
        publicClient.getFutureHoldAmount(function(err, holding_resp) {
            if(err) {
                return res.status(500).send(err);
            }
            
            return res.send(holding_resp);
        }, 'btc_usd', 'quarter');
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

};

// Futures Trade Functions (Private Client --> POST Requests)
exports.future_userinfo = function(req, res) {
	var thisName = req.exchange.name.toLowerCase().replace(' ', '');    
    
    if(thisName === 'okcoin') {
        var privateClient = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

};

exports.future_position = function(req, res) {
	var thisName = req.exchange.name.toLowerCase().replace(' ', '');

    if(thisName === 'okcoin') {
        var privateClient = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        
       
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }
    
};

exports.future_trade = function(req, res) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        var privateClient = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

};

exports.future_trades_history = function(req, res) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        var privateClient = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        
        
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

};

exports.future_batch_trade = function(req, res) {
	var thisName = req.exchange.name.toLowerCase().replace(' ', '');    
    
    if(thisName === 'okcoin') {
        var privateClient = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

};

exports.future_cancel = function(req, res) {
	var thisName = req.exchange.name.toLowerCase().replace(' ', '');    
    
    if(thisName === 'okcoin') {
        var privateClient = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

};

exports.future_order_info = function(req, res) {
	var thisName = req.exchange.name.toLowerCase().replace(' ', '');    
    
    if(thisName === 'okcoin') {
        var privateClient = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        
        
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

    
};

exports.future_orders_info = function(req, res) {
	var thisName = req.exchange.name.toLowerCase().replace(' ', '');    
    
    if(thisName === 'okcoin') {
        var privateClient = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

};

exports.future_userinfo_fixed = function(req, res) {
	var thisName = req.exchange.name.toLowerCase().replace(' ', '');    
    
    if(thisName === 'okcoin') {
        var privateClient = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

};

exports.future_position_fixed = function(req, res) {
	var thisName = req.exchange.name.toLowerCase().replace(' ', '');    
    
    if(thisName === 'okcoin') {
        var privateClient = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

};

exports.future_explosive = function(req, res) {
	var thisName = req.exchange.name.toLowerCase().replace(' ', '');    
    
    if(thisName === 'okcoin') {
        var privateClient = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        
        
    } else {
        res.send({error: 'This function has not been implemented yet for ' + req.exchange.name});
    }

};