'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Price Schema
 */
var PriceSchema = new Schema({
    price:  {
        type: Number,
        min: 0,
        default: 0,
    },
	timestamp: {
		type: Date,
        index: true,
		default: Date.now
	},
	exchange: {
		type: Schema.ObjectId,
		ref: 'Exchange'
	}
});

mongoose.model('Price', PriceSchema);