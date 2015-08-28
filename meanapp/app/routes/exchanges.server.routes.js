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
    

    app.route('/exchanges/:exchangeId/makeTrade')
        .post(exchanges.addTrade);
        
        
    app.route('/exchanges/:exchangeId/getTrades')
        .get(exchanges.getCurrentTrades);
        
    app.route('/exchanges/:exchangeId/getFutureCandles')
        .get(exchanges.getFutureCandles);
                
    app.route('/exchanges/:exchangeId/getUserInfo')
        .get(exchanges.getUserInfo);

    app.route('/exchanges/:exchangeId/getCurrentHolding')
        .get(exchanges.getCurrentHolding);

    app.route('/exchanges/:exchangeId/getPricesFromDB')
        .get(exchanges.getPricesFromDB);
    
    app.route('/exchanges/:exchangeId/getObligatedVsHolding')
        .get(exchanges.getObligatedVsHolding);

    // New (Public) Functions
    app.route('/exchanges/:exchangeId/future_ticker')
        .get(exchanges.future_ticker);
    
    app.route('/exchanges/:exchangeId/future_depth')
        .get(exchanges.future_depth);
        
    app.route('/exchanges/:exchangeId/future_trades')
        .get(exchanges.future_trades);
    
    app.route('/exchanges/:exchangeId/future_index')
        .get(exchanges.future_index);
        
    app.route('/exchanges/:exchangeId/exchange_rate')
        .get(exchanges.exchange_rate);
        
    app.route('/exchanges/:exchangeId/future_estimated_price')
        .get(exchanges.future_estimated_price);
        
    app.route('/exchanges/:exchangeId/future_kline')
        .get(exchanges.future_kline);
        
    app.route('/exchanges/:exchangeId/future_hold_amount')
        .get(exchanges.future_hold_amount);
    
    
    // New (Private) Functions 
    
    
    
	// Finish by binding the Exchange middleware
	app.param('exchangeId', exchanges.exchangeByID);
};
