'use strict';

//Setting up route
angular.module('tickers').config(['$stateProvider',
	function($stateProvider) {
		// Tickers state routing
		$stateProvider.
		state('listTickers', {
			url: '/tickers',
			templateUrl: 'modules/tickers/views/list-tickers.client.view.html'
		}).
		state('createTicker', {
			url: '/tickers/create',
			templateUrl: 'modules/tickers/views/create-ticker.client.view.html'
		}).
		state('viewTicker', {
			url: '/tickers/:tickerId',
			templateUrl: 'modules/tickers/views/view-ticker.client.view.html'
		}).
		state('editTicker', {
			url: '/tickers/:tickerId/edit',
			templateUrl: 'modules/tickers/views/edit-ticker.client.view.html'
		});
	}
]);