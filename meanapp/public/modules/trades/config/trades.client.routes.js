'use strict';

//Setting up route
angular.module('trades').config(['$stateProvider',
	function($stateProvider) {
		// Trades state routing
		$stateProvider.
		state('listTrades', {
			url: '/trades',
			templateUrl: 'modules/trades/views/list-trades.client.view.html'
		}).
		state('createTrade', {
			url: '/trades/create',
			templateUrl: 'modules/trades/views/create-trade.client.view.html'
		}).
		state('viewTrade', {
			url: '/trades/:tradeId',
			templateUrl: 'modules/trades/views/view-trade.client.view.html'
		}).
		state('editTrade', {
			url: '/trades/:tradeId/edit',
			templateUrl: 'modules/trades/views/edit-trade.client.view.html'
		});
	}
]);