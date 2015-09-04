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
		.put(users.requiresLogin, /*exchanges.hasAuthorization, */ exchanges.update)
		.delete(users.requiresLogin, /*exchanges.hasAuthorization, */ exchanges.delete);

	app.route('/exchanges/:exchangeId/getTicker')
		.get(exchanges.getCurrentPrice);
         
    
    // New Functions
    app.route('/exchanges/:exchangeId/positions')
        .get(exchanges.getPositions);
        
    app.route('/exchanges/:exchangeId/balance')
        .get(exchanges.getBalance);
        
    app.route('/exchanges/:exchangeId/active_orders')
        .get(exchanges.getActiveOrders);
    
    // app.route('/exchanges/:exchangeId/trade_history')
        // .get(exchanges.getTradeHistory);
    
    app.route('/exchanges/:exchangeId/cancel_order/:orderId')
        .get(exchanges.cancelOrder);


        
    
	// Finish by binding the Exchange middleware
	app.param('exchangeId', exchanges.exchangeByID);
};
