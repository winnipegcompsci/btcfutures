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
	name: {
		type: String,
		default: '',
		required: 'Please fill Trade name',
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

mongoose.model('Trade', TradeSchema);