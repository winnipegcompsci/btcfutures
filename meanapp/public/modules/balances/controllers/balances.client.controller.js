'use strict';

// Balances controller
angular.module('balances').controller('BalancesController', ['$scope', '$http', '$stateParams', '$location', 'Authentication', 'Balances',
	function($scope, $http, $stateParams, $location, Authentication, Balances) {
		$scope.authentication = Authentication;

		// Create new Balance
		$scope.create = function() {
			// Create new Balance object
			var balance = new Balances ({
				name: this.name
			});

			// Redirect after save
			balance.$save(function(response) {
				$location.path('balances/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Balance
		$scope.remove = function(balance) {
			if ( balance ) { 
				balance.$remove();

				for (var i in $scope.balances) {
					if ($scope.balances [i] === balance) {
						$scope.balances.splice(i, 1);
					}
				}
			} else {
				$scope.balance.$remove(function() {
					$location.path('balances');
				});
			}
		};

		// Update existing Balance
		$scope.update = function() {
			var balance = $scope.balance;

			balance.$update(function() {
				$location.path('balances/' + balance._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Balances
		$scope.find = function() {
			$scope.balances = Balances.query();
		};

		// Find existing Balance
		$scope.findOne = function() {
			$scope.balance = Balances.get({ 
				balanceId: $stateParams.balanceId
			});
		};
        
        
        $scope.getBalanceChart = function() {
            
            $http.get('/balances/graph/exchange')
                .success(function(balanceData) {
                    $scope.balanceChartConfig = {
                        options: {
                            chart: {
                                zoomType: 'x'
                            },
                            rangeSelector: {
                                enabled: true
                            },
                            navigator: {
                                enabled: true
                            },
                            tooltip: {
                                valueDecimals: 2,
                                valuePrefix: '$',
                                valueSuffix: ' USD'
                            },
                            lang: {
                                noData: 'Loading Data... '
                            }
                        },
                        series: [],
                        title: {
                            text: 'Balance over Time by Exchange'
                        },
                        useHighStocks: true
                    };
                    
                    for(var series in balanceData) {
                        console.log("SERIES::: " + series);
                        $scope.balanceChartConfig.series.push(balanceData[series]);
                    }
                });
        };
        
	}
]);