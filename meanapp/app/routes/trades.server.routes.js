'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var trades = require('../../app/controllers/trades.server.controller');

	// Trades Routes
	app.route('/trades')
		.get(trades.list)
		.post(users.requiresLogin, trades.create);

	app.route('/trades/:tradeId')
		.get(trades.read)
		.put(users.requiresLogin, trades.hasAuthorization, trades.update)
		.delete(users.requiresLogin, trades.hasAuthorization, trades.delete);

	// Finish by binding the Trade middleware
	app.param('tradeId', trades.tradeByID);
};
