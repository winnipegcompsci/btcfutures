'use strict';

//Tickers service used to communicate Tickers REST endpoints
angular.module('tickers').factory('Tickers', ['$resource',
	function($resource) {
		return $resource('tickers/:tickerId', { tickerId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);