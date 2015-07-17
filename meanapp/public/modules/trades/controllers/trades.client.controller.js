'use strict';

// Trades controller
angular.module('trades').controller('TradesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Trades',
	function($scope, $stateParams, $location, Authentication, Trades) {
		$scope.authentication = Authentication;

		// Create new Trade
		$scope.create = function() {
			// Create new Trade object
			var trade = new Trades ({
				name: this.name
			});

			// Redirect after save
			trade.$save(function(response) {
				$location.path('trades/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Trade
		$scope.remove = function(trade) {
			if ( trade ) { 
				trade.$remove();

				for (var i in $scope.trades) {
					if ($scope.trades [i] === trade) {
						$scope.trades.splice(i, 1);
					}
				}
			} else {
				$scope.trade.$remove(function() {
					$location.path('trades');
				});
			}
		};

		// Update existing Trade
		$scope.update = function() {
			var trade = $scope.trade;

			trade.$update(function() {
				$location.path('trades/' + trade._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Trades
		$scope.find = function() {
			$scope.trades = Trades.query();
		};

		// Find existing Trade
		$scope.findOne = function() {
			$scope.trade = Trades.get({ 
				tradeId: $stateParams.tradeId
			});
		};
	}
]);