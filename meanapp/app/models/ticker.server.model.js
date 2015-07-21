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
	exchange: {
		type: Schema.ObjectId,
		ref: 'Exchange'
	},
	date: {
		type: Date,
		default: Date.now,
	},
	last: {
		type: Number
	},
	buy: {
		type: Number
	},
	sell: {
		type: Number
	},
	high: {
		type: Number
	},
	low: {
		type: Number
	}, 
	volume: {
		type: Number
	},
	contract_id: {
		type: String,
		default: '',
		trim: true
	}
});

mongoose.model('Ticker', TickerSchema);