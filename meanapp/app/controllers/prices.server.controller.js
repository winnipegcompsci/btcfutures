'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Price = mongoose.model('Price'),
    Exchange = mongoose.model('Exchange'),
    util = require('util'),
	_ = require('lodash');

/**
 * Create a Price
 */
exports.create = function(req, res) {
	var price = new Price(req.body);
	price.user = req.user;

	price.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(price);
		}
	});
};

/**
 * Show the current Price
 */
exports.read = function(req, res) {
	res.jsonp(req.price);
};

/**
 * Update a Price
 */
exports.update = function(req, res) {
	var price = req.price ;

	price = _.extend(price , req.body);

	price.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(price);
		}
	});
};

/**
 * Delete an Price
 */
exports.delete = function(req, res) {
	var price = req.price ;

	price.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(price);
		}
	});
};

/**
 * List of Prices
 */
exports.list = function(req, res) { 
	Price.find().sort('-created').populate('user', 'displayName').exec(function(err, prices) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(prices);
		}
	});
};

/**
 * Price middleware
 */
exports.priceByID = function(req, res, next, id) { 
	Price.findById(id).populate('user', 'displayName').exec(function(err, price) {
		if (err) return next(err);
		if (! price) return next(new Error('Failed to load Price ' + id));
		req.price = price ;
		next();
	});
};

exports.exchangeByID = function(req, res, next, id) {
    Exchange.findById(id).exec(function(err, exchange) {
        if(err) return next(err);
        if( !exchange) return next(new Error('Failed to load Exchange ' + id));
        
        req.exchange = exchange;
        next();
    });
};

exports.dateFromTimestamp = function (req, res, next, timestamp) {
    var queryDate = new Date (timestamp*1000);
    req.queryDate = queryDate;
    next();
};

exports.getGraphPrices = function(req, res) {
    /*
    var seriesData = [];

    Exchange.find().exec(function (err, exchanges) {
        if(err) {
            return res.status(400).send({
               message: errorHandler.getErrorMessage(err) 
            });
        } else {
            var seriesData = [];
            
            for(var i = 0; i < exchanges.length; i++) {
                
                var newSeries = {
                    id: exchanges[i].name,
                    data: []
                };
                                
                var xchgPrices = Price.find({
                        "$where": "this.price.exchange._id == this.exchanges[i]._id"
                }, {
                        "created": 1,
                        "price": 1
                }).exec();
                
                console.log("xchgPrices: " + util.inspect(xchgPrices));
                
                seriesData.push(newSeries);
            
            }
                
            res.jsonp(seriesData);
        }
	});
    */
    
    Price.find({}).sort('-timestamp').populate('exchange name').limit(40000).exec(function(err, prices) {
		var exchangePrices = [];
        
        if (err) {            
            return res.status(400).send({
                error: err,
				message: errorHandler.getErrorMessage(err)
			});
		} else {
            var priceData = {};
            
            for(var p = prices.length - 1; p > 0; p--) {
                if(typeof prices[p].exchange.name !== 'undefined' && prices[p].price !== null) {
                    if(typeof priceData[prices[p].exchange.name] === 'undefined') {
                        priceData[prices[p].exchange.name] = {
                            name: prices[p].exchange.name,
                            data: [],
                        };
                    }
                    
                    priceData[prices[p].exchange.name].data.push([
                        prices[p].timestamp.getTime(), 
                        Number(Math.round(prices[p].price + 'e2')+'e-2')
                    ]);
                }
            }
                        
            res.jsonp(priceData);

		}
	});
    

};

/**
 * Price authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.price.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};

