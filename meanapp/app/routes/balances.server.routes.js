'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var balances = require('../../app/controllers/balances.server.controller');

	// Balances Routes
	app.route('/balances')
		.get(balances.list)
		.post(users.requiresLogin, balances.create);

	app.route('/balances/:balanceId')
		.get(balances.read)
		.put(users.requiresLogin, balances.hasAuthorization, balances.update)
		.delete(users.requiresLogin, balances.hasAuthorization, balances.delete);

    app.route('/balances/graph/exchange')
        .get(balances.getBalanceGraphData);
        
        
	// Finish by binding the Balance middleware
	app.param('balanceId', balances.balanceByID);
};
