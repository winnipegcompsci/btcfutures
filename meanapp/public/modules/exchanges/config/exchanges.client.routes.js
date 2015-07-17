'use strict';

//Setting up route
angular.module('exchanges').config(['$stateProvider',
	function($stateProvider) {
		// Exchanges state routing
		$stateProvider.
		state('listExchanges', {
			url: '/exchanges',
			templateUrl: 'modules/exchanges/views/list-exchanges.client.view.html'
		}).
		state('createExchange', {
			url: '/exchanges/create',
			templateUrl: 'modules/exchanges/views/create-exchange.client.view.html'
		}).
		state('viewExchange', {
			url: '/exchanges/:exchangeId',
			templateUrl: 'modules/exchanges/views/view-exchange.client.view.html'
		}).
		state('editExchange', {
			url: '/exchanges/:exchangeId/edit',
			templateUrl: 'modules/exchanges/views/edit-exchange.client.view.html'
		});
	}
]);