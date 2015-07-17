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
	created: {
		type: Date,
		default: Date.now
	},
	user: {
		type: Schema.ObjectId,
		ref: 'User'
	}
});

mongoose.model('Strategy', StrategySchema);