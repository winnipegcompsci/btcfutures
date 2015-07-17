'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	errorHandler = require('./errors.server.controller'),
	Strategy = mongoose.model('Strategy'),
	_ = require('lodash');

/**
 * Create a Strategy
 */
exports.create = function(req, res) {
	var strategy = new Strategy(req.body);
	strategy.user = req.user;

	strategy.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(strategy);
		}
	});
};

/**
 * Show the current Strategy
 */
exports.read = function(req, res) {
	res.jsonp(req.strategy);
};

/**
 * Update a Strategy
 */
exports.update = function(req, res) {
	var strategy = req.strategy ;

	strategy = _.extend(strategy , req.body);

	strategy.save(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(strategy);
		}
	});
};

/**
 * Delete an Strategy
 */
exports.delete = function(req, res) {
	var strategy = req.strategy ;

	strategy.remove(function(err) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(strategy);
		}
	});
};

/**
 * List of Strategies
 */
exports.list = function(req, res) { 
	Strategy.find().sort('-created').populate('user', 'displayName').exec(function(err, strategies) {
		if (err) {
			return res.status(400).send({
				message: errorHandler.getErrorMessage(err)
			});
		} else {
			res.jsonp(strategies);
		}
	});
};

/**
 * Strategy middleware
 */
exports.strategyByID = function(req, res, next, id) { 
	Strategy.findById(id).populate('user', 'displayName').exec(function(err, strategy) {
		if (err) return next(err);
		if (! strategy) return next(new Error('Failed to load Strategy ' + id));
		req.strategy = strategy ;
		next();
	});
};

/**
 * Strategy authorization middleware
 */
exports.hasAuthorization = function(req, res, next) {
	if (req.strategy.user.id !== req.user.id) {
		return res.status(403).send('User is not authorized');
	}
	next();
};
