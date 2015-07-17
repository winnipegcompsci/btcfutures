'use strict';

//Trades service used to communicate Trades REST endpoints
angular.module('trades').factory('Trades', ['$resource',
	function($resource) {
		return $resource('trades/:tradeId', { tradeId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);