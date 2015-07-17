'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

/**
 * Exchange Schema
 */
var ExchangeSchema = new Schema({
	name: {
		type: String,
		default: '',
		required: 'Please fill Exchange name',
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

mongoose.model('Exchange', ExchangeSchema);