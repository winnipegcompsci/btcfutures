'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Trade Schema
 */
 
 //OKCOIN: date, price, amount, tid, type
 
 //796: num, price, ptype, 
var TradeSchema = new Schema({
	exchange: {
		type: Schema.ObjectId,
		ref: 'Exchange'
	},
	price: {
		type: Number,
		default: ''
	},
	amount: {
		type: Number,
		default: ''
	},
	tid: {
		type: String,
		default: '',
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

mongoose.model('Trade', TradeSchema);