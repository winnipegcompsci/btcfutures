'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Price = mongoose.model('Price'),
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

/**
 * Price authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.price.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
