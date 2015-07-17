'use strict';

//Setting up route
angular.module('strategies').config(['$stateProvider',
	function($stateProvider) {
		// Strategies state routing
		$stateProvider.
		state('listStrategies', {
			url: '/strategies',
			templateUrl: 'modules/strategies/views/list-strategies.client.view.html'
		}).
		state('createStrategy', {
			url: '/strategies/create',
			templateUrl: 'modules/strategies/views/create-strategy.client.view.html'
		}).
		state('viewStrategy', {
			url: '/strategies/:strategyId',
			templateUrl: 'modules/strategies/views/view-strategy.client.view.html'
		}).
		state('editStrategy', {
			url: '/strategies/:strategyId/edit',
			templateUrl: 'modules/strategies/views/edit-strategy.client.view.html'
		});
	}
]);