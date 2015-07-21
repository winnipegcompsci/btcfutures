'use strict';

// Exchanges controller
angular.module('exchanges').controller('ExchangesController', ['$scope', '$rootScope', '$stateParams', '$location', '$http', 'Authentication', 'Exchanges',
	function($scope, $rootScope, $stateParams, $location, $http, Authentication, Exchanges) {
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
		
		$scope.getCurrentPrice = function(exchange) {
            if(!exchange) {
                var exchange = Exchanges.get({
                    exchangeId: $stateParams.exchangeId
                });
            }
            
			$http.get('exchanges/' + exchange._id + '/getTicker')
                .success(function (data) {
                    exchange.current_price = '$' + Number(data.last).toFixed(2) + ' USD';
                    
                    data.last = Number(data.last).toFixed(2);
                    data.high = Number(data.high).toFixed(2);
                    data.low = Number(data.low).toFixed(2);
                    data.buy = Number(data.buy).toFixed(2);
                    data.sell = Number(data.sell).toFixed(2);
                    
                    exchange.tickerRes = data;
                });
		}
		
	}
]);