'use strict';

// Tickers controller
angular.module('tickers').controller('TickersController', ['$scope', '$stateParams', '$location', 'Authentication', 'Tickers',
	function($scope, $stateParams, $location, Authentication, Tickers) {
		$scope.authentication = Authentication;

		// Create new Ticker
		$scope.create = function() {
			// Create new Ticker object
			var ticker = new Tickers ({
				name: this.name
			});

			// Redirect after save
			ticker.$save(function(response) {
				$location.path('tickers/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Ticker
		$scope.remove = function(ticker) {
			if ( ticker ) { 
				ticker.$remove();

				for (var i in $scope.tickers) {
					if ($scope.tickers [i] === ticker) {
						$scope.tickers.splice(i, 1);
					}
				}
			} else {
				$scope.ticker.$remove(function() {
					$location.path('tickers');
				});
			}
		};

		// Update existing Ticker
		$scope.update = function() {
			var ticker = $scope.ticker;

			ticker.$update(function() {
				$location.path('tickers/' + ticker._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Tickers
		$scope.find = function() {
			$scope.tickers = Tickers.query();
		};

		// Find existing Ticker
		$scope.findOne = function() {
			$scope.ticker = Tickers.get({ 
				tickerId: $stateParams.tickerId
			});
		};
	}
]);