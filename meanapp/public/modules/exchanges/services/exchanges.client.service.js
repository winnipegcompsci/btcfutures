'use strict';

//Exchanges service used to communicate Exchanges REST endpoints
angular.module('exchanges').factory('Exchanges', ['$resource',
	function($resource) {
		return $resource('exchanges/:exchangeId', { exchangeId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);