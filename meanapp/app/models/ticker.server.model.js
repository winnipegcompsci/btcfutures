'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Ticker Schema
 */
var TickerSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Ticker name',
		trim: true
	},
	created: {
		type: Date,
		default: Date.now
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Ticker', TickerSchema);