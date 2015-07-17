'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var tickers = require('../../app/controllers/tickers.server.controller');

	// Tickers Routes
	app.route('/tickers')
		.get(tickers.list)
		.post(users.requiresLogin, tickers.create);

	app.route('/tickers/:tickerId')
		.get(tickers.read)
		.put(users.requiresLogin, tickers.hasAuthorization, tickers.update)
		.delete(users.requiresLogin, tickers.hasAuthorization, tickers.delete);

	// Finish by binding the Ticker middleware
	app.param('tickerId', tickers.tickerByID);
};
