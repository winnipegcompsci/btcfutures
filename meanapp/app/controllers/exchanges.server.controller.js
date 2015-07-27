'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Exchange = mongoose.model('Exchange'),
	OKCoin  = require('okcoin'),
	Futures796 = require('futures796'),
	_ = require('lodash');

	
var okcoin_public = new OKCoin();
var okcoin_private = new OKCoin();

var futures796_public = new Futures796();
var futures796_private = new Futures796();
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
    } else {
        
    }
};

exports.getFuturePositions = function(req, res) {
    
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
        
    } else {
        res.status(500).send('ERROR: ' + thisName + ' Function GetUserInfo() -- Not Found');
    }
};

exports.getCurrentHolding = function(req, res) {
    var thisName = req.exchange.name.toLowerCase().replace(' ', '');
    
    if(thisName === 'okcoin') {
        return {
            'long': 10,
            'short': 5
        };
    } else if (thisName === '796' || thisName === 'futures796') {
        return {
            'long': 8,
            'short': 15
        }
    } else {
       res.status(500).send('ERROR: ' + thisName + ' Function getCurrentHolding() -- Not Found');
    }
};



