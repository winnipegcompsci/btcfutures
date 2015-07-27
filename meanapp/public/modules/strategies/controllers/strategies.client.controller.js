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
        
        $scope.getCurrentHolding = function(exchange, position) {
            console.log("Checking %s for %s", position, exchange.exchange);
            
            
            $http.get('exchanges/' + exchange.exchange + '/getCurrentHolding')
                .success(function (holding)  {
                    console.log("SUCCESS");
                    if (position === 'long') {
                        $scope.holding = holding.long;
                    } else if (position === 'short') {
                        $scope.holding = holding.short;
                    }
                })
                .error(function (err) {
                    console.log("ERROR: " + err);
                });
            
            $scope.holding = "ERROR";
        };
	}
]);

angular.module('exchanges').directive('script', function() {
    return {
        restrict: 'E',
        scope: true,
        link: function(scope, elem, attr) 
        {
            if (attr.type==='text/javascript-lazy') 
            {
                var s = document.createElement("script");
                s.type = "text/javascript";                
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
    }  
});