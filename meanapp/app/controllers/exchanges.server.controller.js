'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Exchange = mongoose.model('Exchange'),
	okcoin  = require('okcoin'),
	futures796 = require('futures796'),
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
	
	var currentPrice = 'Price from: ' + thisName;
	res.send({'current_price': currentPrice});
};

exports.getCurrentTrades = function(req, res) {

};

exports.buyLong = function (req, res) {
	
};

exports.buyShort = function (req, res) {

};

exports.sellLong = function (req, res) {

};

exports.sellShort = function (req, res) {

};