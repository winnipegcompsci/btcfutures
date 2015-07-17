'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var exchanges = require('../../app/controllers/exchanges.server.controller');

	// Exchanges Routes
	app.route('/exchanges')
		.get(exchanges.list)
		.post(users.requiresLogin, exchanges.create);

	app.route('/exchanges/:exchangeId')
		.get(exchanges.read)
		.put(users.requiresLogin, exchanges.hasAuthorization, exchanges.update)
		.delete(users.requiresLogin, exchanges.hasAuthorization, exchanges.delete);

	// Finish by binding the Exchange middleware
	app.param('exchangeId', exchanges.exchangeByID);
};
