'use strict';

// Exchanges controller
angular.module('exchanges').controller('ExchangesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Exchanges',
	function($scope, $stateParams, $location, Authentication, Exchanges) {
		$scope.authentication = Authentication;

		// Create new Exchange
		$scope.create = function() {
			// Create new Exchange object
			var exchange = new Exchanges ({
				name: this.name
			});

			// Redirect after save
			exchange.$save(function(response) {
				$location.path('exchanges/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Exchange
		$scope.remove = function(exchange) {
			if ( exchange ) { 
				exchange.$remove();

				for (var i in $scope.exchanges) {
					if ($scope.exchanges [i] === exchange) {
						$scope.exchanges.splice(i, 1);
					}
				}
			} else {
				$scope.exchange.$remove(function() {
					$location.path('exchanges');
				});
			}
		};

		// Update existing Exchange
		$scope.update = function() {
			var exchange = $scope.exchange;

			exchange.$update(function() {
				$location.path('exchanges/' + exchange._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Exchanges
		$scope.find = function() {
			$scope.exchanges = Exchanges.query();
		};

		// Find existing Exchange
		$scope.findOne = function() {
			$scope.exchange = Exchanges.get({ 
				exchangeId: $stateParams.exchangeId
			});
		};
	}
]);