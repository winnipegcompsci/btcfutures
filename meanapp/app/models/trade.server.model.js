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
	amount: {
		type: Number,
		default: ''
	},
    type: {
        type: String,
        default: ''
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
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Trade', TradeSchema);