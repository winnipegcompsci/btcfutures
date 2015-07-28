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
			// $scope.exchanges = Exchanges.query();
            
            Exchanges.query().$promise.then(function(result) {
                $scope.exchanges = result;
                
                for(var i = 0; i < result.length; i++) {
                    var thisName = result[i].name.toLowerCase().replace(" ", "");
                                       
                    if(thisName === 'okcoin') {
                        $scope.exchanges[i].logo_url = "/img/okcoin.png";
                    } else if (thisName === '796' || thisName === 'futures796') {
                        $scope.exchanges[i].logo_url = "/img/796.jpg";
                    } else if (thisName === 'bitvc') {
                        $scope.exchanges[i].logo_url = '/img/bitvc.png';                        
                    } else {
                        console.log("Exchange: " + thisName + " -- has no logo on record");
                    }
                }
                
                $scope.exchanges = result;
            });
            
		};

		// Find existing Exchange
		$scope.findOne = function() {
			$scope.exchange = Exchanges.get({ 
				exchangeId: $stateParams.exchangeId
			});
        };
		
                
		$scope.getCurrentPrice = function(exchange) {
            if(!exchange) {
                exchange = Exchanges.get({
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
		};
        
        $scope.getLastPrice = function(exchange) {
            if(!exchange) {
                exchange = Exchanges.get({
                    exchangeId: $stateParams.exchangeId
                });
            }

            $http.get('exchanges/' + exchange._id + '/getTicker')
                .success(function(data) {
                    return Number(data.last).toFixed(2); 
                });
        };
        
        $scope.sendTrade = function(exchange, trade) {
            if(!exchange) {
                exchange = Exchanges.get({
                    exchangeId: $stateParams.exchangeId
                });
            }
            
            $http.post('exchanges/' + exchange._id + '/makeTrade')
                .success(function(data) {
                    
                });
        };
        
        $scope.getTrades = function() {
            $http.get('exchanges/' + $stateParams.exchangeId + '/getTrades')
                .success(function(data) {
                    $scope.trades = data;
                });
        };
        
        $scope.getUserInfo = function() {
            $http.get('exchanges/' + $stateParams.exchangeId + '/getUserInfo')
                .success(function(data) {
                    $scope.userinfo = data;
                });
        };

        $scope.getPricesFromDB = function(exchange_id) {
            var thisID; 
            
            if(!$scope.chartData) {
                $scope.chartData = [];
            }
            
            if(exchange_id) {
                thisID = exchange_id;
            } else {
                thisID = $stateParams.exchangeId;
            }
            
            $stateParams.exchangeId;
            $http.get('exchanges/' + thisID + '/getPricesFromDB')
                .success(function(data) {
                    $scope.chartData = data; 
                });
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