'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
    okcoin = require('okcoin'),
    futures796 = require('futures796');
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
	apikey: {
		type: String,
		default: '',
		required: 'Please fill API Key',
		trim: true
	},
	secretkey: {
		type: String,
		default: '',
		required: 'Please enter secret key',
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