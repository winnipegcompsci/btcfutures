'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Balance = mongoose.model('Balance'),
	_ = require('lodash');

/**
 * Create a Balance
 */
exports.create = function(req, res) {
	var balance = new Balance(req.body);
	balance.user = req.user;

	balance.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(balance);
		}
	});
};

/**
 * Show the current Balance
 */
exports.read = function(req, res) {
	res.jsonp(req.balance);
};

/**
 * Update a Balance
 */
exports.update = function(req, res) {
	var balance = req.balance ;

	balance = _.extend(balance , req.body);

	balance.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(balance);
		}
	});
};

/**
 * Delete an Balance
 */
exports.delete = function(req, res) {
	var balance = req.balance ;

	balance.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(balance);
		}
	});
};

/**
 * List of Balances
 */
exports.list = function(req, res) { 
	Balance.find().sort('-created').populate('user', 'displayName').exec(function(err, balances) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(balances);
		}
	});
};

/**
 * Balance middleware
 */
exports.balanceByID = function(req, res, next, id) { 
	Balance.findById(id).populate('user', 'displayName').exec(function(err, balance) {
		if (err) return next(err);
		if (! balance) return next(new Error('Failed to load Balance ' + id));
		req.balance = balance ;
		next();
	});
};

/**
 * Balance authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.balance.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};

/**
 * Display Blaances Graph.
 */

exports.getBalanceGraphData = function(req, res) {
    Balance.find({})
    .sort('created')
    .populate('exchange')
    .limit(30000)
    .exec(function(err, balances) {
        if(err) {
            res.jsonp({'error': err});
        } else {
            var balanceData = {};
            
            for(var i = 0; i < balances.length; i++) {
                console.log("Found balance: " + balances[i]);
                if(typeof balanceData[balances[i].exchange.name] === 'undefined') {
                    balanceData[balances[i].exchange.name] = {
                        name: balances[i].exchange.name,
                        data: [],
                    };
                    
                    balanceData[balances[i].exchange.name].data.push([
                        balances[i].created.getTime(),
                        balances[i].price * balances[i].balance
                    ]);
                } else {
                    balanceData[balances[i].exchange.name].data.push([
                        balances[i].created.getTime(),
                        balances[i].price * balances[i].balance
                    ]);
                }
            }
            
            res.jsonp(balanceData);
            
        }
    });
};

