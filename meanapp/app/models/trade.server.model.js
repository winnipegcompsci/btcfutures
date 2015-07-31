'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Trade Schema
 */
 
var TradeSchema = new Schema({
	exchange: {
		type: Schema.ObjectId,
		ref: 'Exchange'
	},
	price: {
		type: Number,
		default: ''
	},
    close_price: {
        type: Number,
        default: 0
    },
	amount: {
		type: Number,
		default: ''
	},
    type: {
        type: String,
        default: ''
    },
    bias: {
        type: String,
        default: '',
    },
    lever_rate: {
        type: String,
        default: ''
    },
	tid: {
		type: String,
		default: ''
	},
	created: {
		type: Date,
		default: Date.now
	},
    status: {
        type: Number, 
        default: 0,
    },
    strategy: {
        type: Schema.ObjectId,
        ref: 'Strategy',
    },
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

function getClosingPrice() {
    return "GET CLOSING PRICE()";
}

mongoose.model('Trade', TradeSchema);