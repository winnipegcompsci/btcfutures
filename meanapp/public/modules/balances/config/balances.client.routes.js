'use strict';

//Setting up route
angular.module('balances').config(['$stateProvider',
	function($stateProvider) {
		// Balances state routing
		$stateProvider.
		state('listBalances', {
			url: '/balances',
			templateUrl: 'modules/balances/views/list-balances.client.view.html'
		}).
		state('createBalance', {
			url: '/balances/create',
			templateUrl: 'modules/balances/views/create-balance.client.view.html'
		}).
		state('viewBalance', {
			url: '/balances/:balanceId',
			templateUrl: 'modules/balances/views/view-balance.client.view.html'
		}).
		state('editBalance', {
			url: '/balances/:balanceId/edit',
			templateUrl: 'modules/balances/views/edit-balance.client.view.html'
		});
	}
]);