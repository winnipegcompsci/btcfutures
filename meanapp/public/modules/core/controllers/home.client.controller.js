'use strict';


angular.module('core').controller('HomeController', ['$scope', '$http', 'Authentication',
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
            console.log("Getting price for " + exchange.name);  // DEBUG
            if(!exchange) {
                exchange = Exchanges.get({
                    exchangeId: $stateParams.exchangeId
                });
            }

            $http.get('exchanges/' + exchange._id + '/getTicker')
                .success(function(data) {
                    exchange.currentPrice = Number(data.last).toFixed(2); 
                });
        };
        
        $scope.countTrades = function(exchange) {
            $http.get('trades')
                .success(function(trades) {                   
                    exchange.numTrades = 0;
                    exchange.longAmount = 0;
                    exchange.shortAmount = 0;
                    
                    for(var i = 0; i < trades.length; i++) {
                        
                        if(trades[i].exchange._id == exchange._id) {
                            if(trades[i].type == "BUY") {
                                exchange.numTrades++;
                                
                                if(trades[i].bias == "LONG") {
                                    exchange.longAmount += trades[i].amount;
                                } else if (trades[i].bias == "SHORT") {
                                    exchange.shortAmount += trades[i].amount;
                                }
                               
                                
                            } else if(trades[i].type == "SELL") {
                                exchange.numTrades--;
                                
                                if(trades[i].bias == "LONG") {
                                    exchange.longAmount -= trades[i].amount;
                                } else if (trades[i].bias == "SHORT") {
                                    exchange.shortAmount -= trades[i].amount;
                                }
                            }
                        }
                    }
                });
        };
    }
   
]);

angular.module('core').directive('script', function() {
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