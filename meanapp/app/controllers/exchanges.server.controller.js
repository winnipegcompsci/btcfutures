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

exports.getBalance = function(req, res, next) {
    
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        var client = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        
        client.getFixedUserInfo(function(err, resp) {
            if(err) {
                console.log("ERROR: " + err);
            }           
            
            var currentTotal = resp.info.btc.balance;
            var currentAvailable = resp.info.btc.balance;
                        
            resp.info.btc.contracts.forEach(function(contract) {
                currentAvailable -= contract.freeze;
            });
                        
            return res.send({
                total: currentTotal,
                available: currentAvailable
            });
        });
        
    } else if (thisName === '796' || thisName === 'futures796') {
        return res.send({
            total: 0,
            available: 0
        });
    } else if (thisName === 'bitvc') {
        return res.send({
            total: 0,
            available: 0
        });
    } else if (thisName === 'btc-e') {
        return res.send({
            total: 0,
            available: 0
        });
    } else if (thisName === 'bitmex') {
        var client = new BitMEX(req.exchange.apikey, req.exchange.secretkey);
        
        client.getUserMargin(function(err, resp) {
            if(err) {
                console.log("ERROR: " + err);
            }
            
            return res.send({
                total: resp.marginBalance * 1e-8,
                available: resp.availableMargin * 1e-8
            });
        });        
    }
    
};

exports.getActiveOrders = function(req, res, next) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        
    } else if (thisName === '796' || thisName === 'futures796') {
        
    } else if (thisName === 'bitvc') {
        
    } else if (thisName === 'btc-e') {
        
    } else if (thisName === 'bitmex') {
        var client = new BitMEX(req.exchange.apikey, req.exchange.secretkey);
        
        client.getOrders(function(err, resp) {
            if(err) {
                console.log("ERROR: " + err);
            }
                        
            var orders = [];
            
            resp.forEach(function(order) {
                if(order.ordStatus === 'New') {
                    orders.push({
                        id: order.orderID,
                        symbol: order.symbol,
                        status: order.ordStatus,
                        side: order.side,
                        quantity: order.orderQty,
                        price: order.price,
                        filled: order.cumQty                    
                    });
                }
            });
            
            res.send(orders);
            
            
        });
    }
};

exports.cancelOrder = function(req, res, next) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        
    } else if (thisName === '796' || thisName === 'futures796') {
        
    } else if (thisName === 'bitvc') {
        
    } else if (thisName === 'btc-e') {
        
    } else if (thisName === 'bitmex') {
        var client = new BitMEX(req.exchange.apikey, req.exchange.secretkey);
        
        client.cancelOrder(function(err, resp) {
            if(err) {
                res.send("ERROR: " + err);
            }
            
            res.send(resp);
        });
            
            
        
    }
};

exports.getTradeHistory = function(req, res, next) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        
    } else if (thisName === '796' || thisName === 'futures796') {
        
    } else if (thisName === 'bitvc') {
        
    } else if (thisName === 'btc-e') {
        
    } else if (thisName === 'bitmex') {
        var client = new BitMEX(req.exchange.apikey, req.exchange.secretkey);
        
        client.getExecutionTradeHistory(function(err, resp) {
            if(err) {
                res.send("ERROR: " + err);
            }
                        
            var trades = [];
            
            console.log("TRADE HISTORY: " + util.inspect(resp));
            
            res.send(trades);
        });
    }
};


exports.getPositions = function(req, res, next) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        var client = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        
        var contract_types = ['this_week', 'next_week', 'quarter'];
        
        var positions = [];
        
        contract_types.forEach(function(contract_type) {
            positions.push({
                symbol: 'BTC (' + contract_type.replace('_', ' ') + ')',
                expires: null,
                size: null,
                currentValue: null,
                entryPrice: null,
                currentPrice: null,
                unrealizedPL: null,
                realizedPL: null
            });  
        });
        
        res.send(positions);
        
        
    } else if (thisName === '796' || thisName === 'futures796') {
        var client = new Futures796(req.exchange.apikey, req.exchange.secretkey);
        
        var positions = [];
        
        positions.push({
            symbol: 'BTC (weekly)',
            expires: null,
            size: null,
            currentValue: null,
            entryPrice: null,
            currentPrice: null,
            unrealizedPL: null,
            realizedPL: null,
        });
        
        
        res.send(positions);
        
        
    } else if (thisName === 'bitvc') {
        var client = new BitVC(req.exchange.apikey, req.exchange.secretkey);
        
        var contract_types = ['this_week', 'next_week', 'quarter'];
        
        var positions = [];
        
        contract_types.forEach(function(contract_type) {
            positions.push({
                symbol: 'BTC (' + contract_type.replace('_', ' ') + ')',
                expires: null,
                size: null,
                currentValue: null,
                entryPrice: null,
                currentPrice: null,
                unrealizedPL: null,
                realizedPL: null
            });  
        });
        
        res.send(positions);
        
        
    } else if (thisName === 'btc-e') {
        
        var positions = [];
        
        positions.push({
            symbol: 'BTC',
            expires: null,
            size: null,
            currentValue: null,
            entryPrice: null,
            currentPrice: null,
            unrealizedPL: null,
            realizedPL: null,
        });
                
        res.send(positions);
        
    } else if (thisName === 'bitmex') {
        var client = new BitMEX(req.exchange.apikey, req.exchange.secretkey);
        
        client.getPositions(function(err, resp) {
            if(err) {
                console.log("Error: " + err);
            } else {            
                var positions = [];
                
                resp.forEach(function(position) {
                    // GET POSITION EXPIRY DATE FROM INSTRUMENT.
                    
                    positions.push({
                        symbol: position.symbol,
                        expires: position.currentTimestamp,
                        size: position.currentQty,
                        currentValue: Math.abs(position.markValue*1e-8).toFixed(4) + " BTC ($" + position.simpleValue + ")",
                        entryPrice: position.avgEntryPrice,
                        currentPrice: position.markPrice,
                        unrealizedPL: position.unrealisedPnl * 1e-8,
                        realizedPL: position.realisedPnl * 1e-8
                    });
                });
                
                res.send(positions);
            }
        });
    }
}


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

exports.getObligatedVsHolding = function(req, res) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        var privateClient = new OKCoin(req.exchange.apikey, req.exchange.secretkey);
        
        privateClient.future_userinfo_fixed(function(err, resp) {
            if(err) {
                res.status(500).send(err);
            }
            
            var data = {};
            
            for(var i = 0; i < resp.btc.contracts.length; i++) {
                var name = resp.btc.contracts[i].contract_id;
                
                data.push({
                    'contract': resp.btc.contracts[i].contract_id,
                    'available': resp.btc.contracts[i].available,
                    'obligated': resp.btc.contracts[i].freeze,
                    'profit': resp.btc.contracts[i].profit,
                    'unprofit': resp.btc.contracts[i].unprofit
                });
            }
            
            return data;
        });
    }
    
    if(thisName === '796') {
        var privateClient = new Futures796(req.exchange.apikey, req.exchange.secretkey);
        
        privateClient.getAssets(function(err, resp) {
            if(err) {
                res.status(500).send(err);
            }
            
            var data = {};
            
            
        });
    }
    
    if(thisName === 'bitvc') {
        var privateClient = new BitVC(req.exchange.apikey, req.exchange.secretkey);
        
        privateClient.getUserPositions(function(err, resp) {
            if(err) {
                res.status(500).send(err);
            }
            
            if(resp) {
                var data = {};
                
                // Populate Data Object.
                
                   
                res.jsonp(data);
            }
            
        });
        
    }
    
    if(thisName === 'btc-e') {
        var privateClient = new BTCe(req.exchange.apikey, req.exchange.secretkey);
    }
    
    if(thisName === 'bitmex') {
        var privateClient = new BitMEX(req.exchange.apikey, req.exchange.secretkey);
    }
}



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