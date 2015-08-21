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
                    var thisName = result[i].name.toLowerCase().replace(' ', '');
                                       
                    if(thisName === 'okcoin') {
                        $scope.exchanges[i].logo_url = '/img/okcoin.png';
                    } else if (thisName === '796' || thisName === 'futures796') {
                        $scope.exchanges[i].logo_url = '/img/796.jpg';
                    } else if (thisName === 'bitvc') {
                        $scope.exchanges[i].logo_url = '/img/bitvc.png';                        
                    } else {
                        console.log('Exchange: ' + thisName + ' -- has no logo on record');
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
            
            $http.get('exchanges/' + thisID + '/getPricesFromDB')
                .success(function(data) {
                    $scope.chartData = data; 
                });
        };
        
        // New Function to Load API Data        
        $scope.getExchangeData = function() {            
            var exchange_id = $stateParams.exchangeId;
            
            $http.get('exchanges/' + exchange_id + '/future_ticker')
                .success(function(data) {
                    $scope.future_ticker = data;
                });
            
            $http.get('exchanges/' + exchange_id + '/future_depth')
                .success(function(data) {
                    $scope.future_depth = data;
                });
                
            $http.get('exchanges/' + exchange_id + '/future_trades')
                .success(function(data) {
                    $scope.future_trades = data;
                    
                    $scope.tradeChartConfig = {
                        options: {
                            chart: {
                                zoomType: 'x'
                            },
                            rangeSelector: {
                                enabled: false
                            },
                            navigator: {
                                enabled: false
                            },
                            tooltip: {
                                shared: false,
                                formatter: function() {
                                    var text = 'Amount: ' + this.y + ' BTC';
                                    return text;
                                }
                            },
                            lang: {
                                noData: 'Loading Data... '
                            }
                        },
                        series: [],
                        title: {
                            text: 'Recent Trade Volumes'
                        },
                        useHighStocks: true
                    };
                                        
                    // Generate Series Data.                    
                    var prices = {
                        name: 'Price',
                        data: []
                    };
                    
                    var amounts = {
                        name: 'Amounts',
                        data: []
                    };
                    
                    for(var i = 0; i < data.length; i++) {                       
                        prices.data.push([
                            data[i].date,
                            data[i].price
                        ]);
                        
                        amounts.data.push([
                            data[i].date,
                            data[i].amount
                        ]);
                        
                    }
                    
                    // $scope.tradeChartConfig.series.push(prices);
                    $scope.tradeChartConfig.series.push(amounts);
                    
                });
                
            $http.get('exchanges/' + exchange_id + '/future_index')
                .success(function(data) {
                    $scope.future_index = data;
                });
                
            $http.get('exchanges/' + exchange_id + '/exchange_rate')
                .success(function(data) {
                    $scope.exchange_rate = data;
                });
                
            $http.get('exchanges/' + exchange_id + '/future_estimated_price')
                .success(function(data) {
                    $scope.future_estimated_price = data;
                });
                
            $http.get('exchanges/' + exchange_id + '/future_kline')
                .success(function(data) {
                    $scope.future_kline = data;
                    
                    $scope.klineChartConfig = {
                        options: {
                            chart: {
                                zoomType: 'x'
                            },
                            rangeSelector: {
                                enabled: false
                            },
                            navigator: {
                                enabled: false
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
                            text: 'Candlestick Data'
                        },
                        useHighStocks: true
                    };
                    
                    var openPrices = {
                        name: 'Open',
                        data: []
                    };
                    
                    var highPrices = {
                        name: 'High',
                        data: []
                    };
                    
                    var lowPrices = {
                        name: 'Low',
                        data: []
                    };
                    
                    var closePrices = {
                        name: 'Close',
                        data: []
                    }
                    
                    for(var i = 0; i < data.length; i++) {
                        openPrices.data.push([
                            data[i][0],
                            data[i][1]
                        ]);
                        
                        highPrices.data.push([
                            data[i][0],
                            data[i][2]
                        ]);
                        
                        lowPrices.data.push([
                            data[i][0],
                            data[i][3]
                        ]);
                        
                        closePrices.data.push([
                            data[i][0],
                            data[i][4]
                        ]);
                    }
                    
                    $scope.klineChartConfig.series.push(openPrices);
                    $scope.klineChartConfig.series.push(highPrices);
                    $scope.klineChartConfig.series.push(lowPrices);
                    $scope.klineChartConfig.series.push(closePrices);
                    
                });
                
            $http.get('exchanges/' + exchange_id + '/future_hold_amount')
                .success(function(data) {
                    $scope.future_hold_amount = data;
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