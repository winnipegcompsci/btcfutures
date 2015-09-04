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
        
        $scope.getBalances = function(exchange) {
            $http.get('exchanges/' + exchange._id + '/balance')
                .success(function(data) {
                    exchange.balance = data;
                });
        };
        
        $scope.getPositions = function(exchange) {
            
            $http.get('exchanges/' + exchange._id + '/positions')
                .success(function(data) {
                    exchange.positions = data;
                });
            

        };
        
        $scope.getActiveOrders = function(exchange) {
           
            $http.get('exchanges/' + exchange._id + '/active_orders')
                .success(function(data) {
                    exchange.activeOrders = data;
                });
        };
        
        $scope.cancelOrder = function(exchange, order_id) {
            $http.get('exchanges/' + exchange._id + '/cancel_order/' + order_id)
                .success(function(data) {
                    console.log("DEBUG: ORDER CANCELLED");
                    alert(data);
                });
        };
        
        $scope.getTradeHistory = function(exchange) {
            $http.get('exchanges/' + exchange._id + '/trade_history')
                .success(function(data) {
                    exchange.trade_history = data;
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


