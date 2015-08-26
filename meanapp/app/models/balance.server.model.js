'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Balance Schema
 */
var BalanceSchema = new Schema({
	balance: {
		type: Number,
		default: 0,
		required: 'Pleaes enter balance'
	},
    price: {
        type: Number,
        default: 0,
        required: 'Please enter price'
    },
    exchange: {
        type: Schema.ObjectId,
        ref: 'Exchange'
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

mongoose.model('Balance', BalanceSchema);