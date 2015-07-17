'use strict';

//Strategies service used to communicate Strategies REST endpoints
angular.module('strategies').factory('Strategies', ['$resource',
	function($resource) {
		return $resource('strategies/:strategyId', { strategyId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);