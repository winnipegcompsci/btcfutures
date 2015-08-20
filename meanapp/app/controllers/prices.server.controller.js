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
   
    Price.find({}, 'price timestamp exchange').sort('-timestamp').populate('exchange name').limit(30000).exec(function(err, prices) {
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

exports.getMinuteGraphPrices = function(req, res) {
    var startDate;
    var endDate;
        
    Price.findOne({}, 'price timestamp exchange')
    .sort('-timestamp')
    .exec(function(err, price) {
        endDate = price.timestamp;
        
        var startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);
        
        getResultsInRange(startDate, endDate);
    });
    
    // METHOD 2:
    function getResultsInRange(startDate, endDate) {
        if(typeof startDate !== 'undefined' && typeof endDate !== 'undefined') {
            console.log('Querying prices from %s until %s', startDate, endDate);
            
            Price.find({timestamp: {$gte: startDate, $lte: endDate}}, 'price timestamp exchange')
            .sort('timestamp')
            .populate('exchange')
            .exec(function(err, prices) {
                if(err) {
                    res.jsonp({'error': err});
                } else {
                    console.log('Returned %s prices... ', prices.length);
                    
                    var priceData = {};
                    
                    for(var i = 0; i < prices.length; i += 10) {
                        
                        if(typeof priceData[prices[i].exchange.name] === 'undefined') {
                            console.log('Creating Object for: %s', prices[i].exchange.name);
                            priceData[prices[i].exchange.name] = {
                                name: prices[i].exchange.name,
                                data: []
                            };
                            
                            priceData[prices[i].exchange.name].data.push([
                                prices[i].timestamp.getTime(),
                                prices[i].price
                            ]);
                        } else {                                
                            priceData[prices[i].exchange.name].data.push([
                                prices[i].timestamp.getTime(),
                                prices[i].price
                            ]);
                        }
                    }
                    
                    res.jsonp(priceData);
                }
            });
            
        }
    }   
}; // end getMinuteGraphPrices()



/**
 * Price authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.price.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};

