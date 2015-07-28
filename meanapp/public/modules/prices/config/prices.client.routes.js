'use strict';

//Setting up route
angular.module('prices').config(['$stateProvider',
	function($stateProvider) {
		// Prices state routing
		$stateProvider.
		state('listPrices', {
			url: '/prices',
			templateUrl: 'modules/prices/views/list-prices.client.view.html'
		}).
		state('createPrice', {
			url: '/prices/create',
			templateUrl: 'modules/prices/views/create-price.client.view.html'
		}).
		state('viewPrice', {
			url: '/prices/:priceId',
			templateUrl: 'modules/prices/views/view-price.client.view.html'
		}).
		state('editPrice', {
			url: '/prices/:priceId/edit',
			templateUrl: 'modules/prices/views/edit-price.client.view.html'
		});
	}
]);