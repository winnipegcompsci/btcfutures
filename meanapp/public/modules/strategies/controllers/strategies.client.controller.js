'use strict';

// Strategies controller
angular.module('strategies').controller('StrategiesController', ['$scope', '$http', '$stateParams', '$location', 'Authentication', 'Strategies',
	function($scope, $http, $stateParams, $location, Authentication, Strategies) {
		$scope.authentication = Authentication;

        $scope.primaryExchanges = [];
        $scope.insuranceExchanges = [];
        
        $scope.primaryCounter = $scope.primaryExchanges.length;
        $scope.insuranceCounter = $scope.insuranceExchanges.length;
        
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
        
        $scope.getExchangesList = function() {
            $http.get('exchanges')
                .success(function (exchanges) {
                    $scope.exchanges = exchanges;
                });
        };
        
        $scope.getCurrentHolding = function(exchange, position, $index) {
            $http.get('exchanges/' + exchange.exchange + '/getCurrentHolding')
                .success(function (holding)  {
                   
                    if(!$scope.strategy.primaryExchanges[$index]) {
                        $scope.strategy.primaryExchanges[$index] = $scope.strategy.insuranceExchanges[$index];
                    }
                   
                   
                    if (position === 'long') {
                        $scope.strategy.primaryExchanges[$index].holding_long = holding.long;
                    } else if (position === 'short') {
                        $scope.strategy.primaryExchanges[$index].holding_short = holding.short;
                    } else {
                        console.log('Position: ' + position + ' can not be found');
                    }
                })
                .error(function (err) {
                    console.log('ERROR: ' + err);
                });
            
            // $scope.holding = "ERROR";
        };
        
        $scope.getTradesForStrategy = function() {
            console.log('The strategy ID is: ' + $stateParams.strategyId);  // DEBUG
            
            $http.get('trades')
                .success(function (trades) {
                    $scope.strategytrades = [];
                    
                    for(var i = 0; i < trades.length; i++) {
                        if(trades[i].strategy === $stateParams.strategyId) {
                            $scope.strategytrades.push(trades[i]);
                        }
                    }
                });
            
            
        };
	}
]);

angular.module('strategies').directive('script', function() {
    return {
        restrict: 'E',
        scope: true,
        link: function(scope, elem, attr) 
        {
            if (attr.type==='text/javascript-lazy') 
            {
                var s = document.createElement('script');
                s.type = 'text/javascript';                
                var src = elem.attr('src');
                if(src!==undefined) {
                    s.src = src;
                } else {
                    var code = elem.text();
                    s.text = code;                    
                }
                document.head.appendChild(s);
                elem.remove();
            }
        }
    };  
});