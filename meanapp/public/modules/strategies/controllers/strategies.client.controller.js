'use strict';

// Strategies controller
angular.module('strategies').controller('StrategiesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Strategies',
	function($scope, $stateParams, $location, Authentication, Strategies) {
		$scope.authentication = Authentication;

		// Create new Strategy
		$scope.create = function() {
			// Create new Strategy object
			var strategy = new Strategies ({
				name: this.name
			});

			// Redirect after save
			strategy.$save(function(response) {
				$location.path('strategies/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Strategy
		$scope.remove = function(strategy) {
			if ( strategy ) { 
				strategy.$remove();

				for (var i in $scope.strategies) {
					if ($scope.strategies [i] === strategy) {
						$scope.strategies.splice(i, 1);
					}
				}
			} else {
				$scope.strategy.$remove(function() {
					$location.path('strategies');
				});
			}
		};

		// Update existing Strategy
		$scope.update = function() {
			var strategy = $scope.strategy;

			strategy.$update(function() {
				$location.path('strategies/' + strategy._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Strategies
		$scope.find = function() {
			$scope.strategies = Strategies.query();
		};

		// Find existing Strategy
		$scope.findOne = function() {
			$scope.strategy = Strategies.get({ 
				strategyId: $stateParams.strategyId
			});
		};
	}
]);