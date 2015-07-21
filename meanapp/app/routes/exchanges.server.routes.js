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

	app.route('/exchanges/:exchangeId/getTicker')
		.get(exchanges.getCurrentPrice);
        
    // app.route('/exchanges/:exchangeId/getTrades')
        // .get(exchanges.getCurrentTrades);
        
    // app.route('/exchanges/:exchangeId/getDepth')
        // .get(exchanges.getCurrentDepth);
    
		
	// Finish by binding the Exchange middleware
	app.param('exchangeId', exchanges.exchangeByID);
};
