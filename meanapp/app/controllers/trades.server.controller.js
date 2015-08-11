'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Trade = mongoose.model('Trade'),
    Strategy = mongoose.model('Strategy'),
	_ = require('lodash');

/**
 * Create a Trade
 */
exports.create = function(req, res) {
	var trade = new Trade(req.body);
    
	trade.user = req.user;
    trade.exchange = req.exchange;
    
	trade.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(trade);
		}
	});
};

/**
 * Show the current Trade
 */
exports.read = function(req, res) {
	res.jsonp(req.trade);
};

/**
 * Update a Trade
 */
exports.update = function(req, res) {
	var trade = req.trade ;

	trade = _.extend(trade , req.body);

	trade.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(trade);
		}
	});
};

/**
 * Delete an Trade
 */
exports.delete = function(req, res) {
	var trade = req.trade ;

	trade.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(trade);
		}
	});
};

/**
 * List of Trades
 */
exports.list = function(req, res) { 
	Trade.find().sort('-created').populate('exchange', 'name').populate('user', 'displayName').exec(function(err, trades) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(trades);
		}
	});
};

/**
 * Trade middleware
 */
exports.tradeByID = function(req, res, next, id) { 
	Trade.findById(id).populate('user', 'displayName').exec(function(err, trade) {
		if (err) return next(err);
		if (! trade) return next(new Error('Failed to load Trade ' + id));
		req.trade = trade ;
		next();
	});
};

/**
 * Trade authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.trade.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
