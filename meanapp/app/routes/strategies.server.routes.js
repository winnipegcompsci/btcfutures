'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var strategies = require('../../app/controllers/strategies.server.controller');

	// Strategies Routes
	app.route('/strategies')
		.get(strategies.list)
		.post(users.requiresLogin, strategies.create);

	app.route('/strategies/:strategyId')
		.get(strategies.read)
		.put(users.requiresLogin, strategies.hasAuthorization, strategies.update)
		.delete(users.requiresLogin, strategies.hasAuthorization, strategies.delete);

	// Finish by binding the Strategy middleware
	app.param('strategyId', strategies.strategyByID);
};
