'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Ticker = mongoose.model('Ticker'),
	_ = require('lodash');

/**
 * Create a Ticker
 */
exports.create = function(req, res) {
	var ticker = new Ticker(req.body);
	ticker.user = req.user;

	ticker.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(ticker);
		}
	});
};

/**
 * Show the current Ticker
 */
exports.read = function(req, res) {
	res.jsonp(req.ticker);
};

/**
 * Update a Ticker
 */
exports.update = function(req, res) {
	var ticker = req.ticker ;

	ticker = _.extend(ticker , req.body);

	ticker.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(ticker);
		}
	});
};

/**
 * Delete an Ticker
 */
exports.delete = function(req, res) {
	var ticker = req.ticker ;

	ticker.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(ticker);
		}
	});
};

/**
 * List of Tickers
 */
exports.list = function(req, res) { 
	Ticker.find().sort('-created').populate('user', 'displayName').exec(function(err, tickers) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(tickers);
		}
	});
};

/**
 * Ticker middleware
 */
exports.tickerByID = function(req, res, next, id) { 
	Ticker.findById(id).populate('user', 'displayName').exec(function(err, ticker) {
		if (err) return next(err);
		if (! ticker) return next(new Error('Failed to load Ticker ' + id));
		req.ticker = ticker ;
		next();
	});
};

/**
 * Ticker authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.ticker.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
