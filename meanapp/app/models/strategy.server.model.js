'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Strategy Schema
 */
var StrategySchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Strategy name',
		trim: true
	},
	primaryExchanges: [{
        exchange: {
            type: Schema.ObjectId,
            ref: 'Exchange'
        }, 
        ratio: {
            type: Number,
            default: 0,
        }
    }],
	insuranceExchanges: [{
		type: Schema.ObjectId,
		ref: 'Exchange'
	}],
    totalCoins: {
        type: Number,
        default: 100,
    },
    maxBuyPrice: {
        type: Number,
        default: 300.00
    },
    insuranceCoverage: {
        type: Number,
        default: 0.70
    },
	created: {
		type: Date,
		default: Date.now
	},
    enabled: {
        type: Boolean,
        default: true,
    },
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Strategy', StrategySchema);