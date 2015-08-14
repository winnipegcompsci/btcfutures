'use strict';

var myapp = angular.module('core');

myapp.controller('HomeController', ['$scope', '$http', 'Authentication',
	function($scope, $http, Authentication) {
		// This provides Authentication context.
		$scope.authentication = Authentication;

        $scope.getExchanges = function() {
            $http.get('exchanges')
                .success(function(data) {
                    $scope.exchanges = data;
                });
        };
        
        $scope.getLastPrice = function(exchange) {
            if(!exchange) {
                exchange.currentPrice = 'N/F';
            }

            $http.get('exchanges/' + exchange._id + '/getTicker')
                .success(function(data) {
                    exchange.currentPrice = Number(data.last).toFixed(2); 
                });
        };
        
        $scope.getGraphPrices = function() {
            $http.get('/prices/graph/day')
                .success(function(graphData) {
                    $scope.chartConfig = {
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
                            }
                        },
                        series: [],
                        title: {
                            text: 'Last Traded Price By Exchange'
                        },
                        useHighStocks: true
                    };
                                        
                    for(var exchangeData in graphData) {
                        // console.log("Series: " + JSON.stringify(graphData[exchangeData]));                       
                        $scope.chartConfig.series.push(graphData[exchangeData]);
                    }
                    
                }) // end success.
                .error(function(err) {
                    console.log('Caught Error: ' + JSON.stringify(err));
                });
        };
        
        $scope.countTrades = function(exchange) {
            $http.get('trades')
                .success(function(trades) {                   
                    exchange.numTrades = 0;
                    exchange.longAmount = 0;
                    exchange.shortAmount = 0;
                    
                    for(var i = 0; i < trades.length; i++) {
                        
                        if(trades[i].exchange._id === exchange._id) {
                            if(trades[i].type === 'BUY') {
                                exchange.numTrades = exchange.numTrades + 1;
                                
                                if(trades[i].bias === 'LONG') {
                                    exchange.longAmount += trades[i].amount;
                                } else if (trades[i].bias === 'SHORT') {
                                    exchange.shortAmount += trades[i].amount;
                                }
                               
                                
                            } else if(trades[i].type === 'SELL') {
                                exchange.numTrades = exchange.numTrades - 1;
                                
                                if(trades[i].bias === 'LONG') {
                                    exchange.longAmount -= trades[i].amount;
                                } else if (trades[i].bias === 'SHORT') {
                                    exchange.shortAmount -= trades[i].amount;
                                }
                            }
                        }
                    }
                });
        };
    }
   
]);

myapp.directive('script', function() {
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