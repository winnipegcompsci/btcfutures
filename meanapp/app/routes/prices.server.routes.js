'use strict';

module.exports = function(app) {
	var users = require('../../app/controllers/users.server.controller');
	var prices = require('../../app/controllers/prices.server.controller');

	// Prices Routes
	app.route('/prices')
		.get(prices.list)
		.post(users.requiresLogin, prices.create);

	app.route('/prices/:priceId')
		.get(prices.read)
		.put(users.requiresLogin, prices.hasAuthorization, prices.update)
		.delete(users.requiresLogin, prices.hasAuthorization, prices.delete);

    app.route('/prices/graphData/:exchangeId/:priceDate')
        .get(prices.getPriceOnExchangeByDate);
        
	// Finish by binding the Price middleware
	app.param('priceId', prices.priceByID);
    app.param('exchangeId', prices.exchangeByID);
    app.param('priceDate', prices.dateFromTimestamp);
};
