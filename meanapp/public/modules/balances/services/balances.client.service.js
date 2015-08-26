'use strict';

//Balances service used to communicate Balances REST endpoints
angular.module('balances').factory('Balances', ['$resource',
	function($resource) {
		return $resource('balances/:balanceId', { balanceId: '@_id'
		}, {
			update: {
				method: 'PUT'
			}
		});
	}
]);