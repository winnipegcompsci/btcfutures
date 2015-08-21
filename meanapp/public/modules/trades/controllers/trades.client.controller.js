'use strict';

// Trades controller
angular.module('trades').controller('TradesController', ['$scope', '$http', '$rootScope', '$stateParams', '$location', 'Authentication', 'Trades',
	function($scope, $http, $rootScope, $stateParams, $location, Authentication, Trades) {
		$scope.authentication = Authentication;
        
		// Create new Trade
		$scope.create = function() {            
			// Create new Trade object            
			var trade = new Trades ({
                // name: this.name,
                price: this.price,
                amount: this.amount,
                exchange: $rootScope.exchange,
                type: this.type,
                lever_rate: this.lever_rate
            });
            
			// Redirect after save
			trade.$save(function(response) {
				$location.path('trades/' + response._id);

				// Clear form fields
				$scope.name = '';
                // $scope.newTrade = {};
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Trade
		$scope.remove = function(trade) {
			if ( trade ) { 
				trade.$remove();

				for (var i in $scope.trades) {
					if ($scope.trades [i] === trade) {
						$scope.trades.splice(i, 1);
					}
				}
			} else {
				$scope.trade.$remove(function() {
					$location.path('trades');
				});
			}
		};

		// Update existing Trade
		$scope.update = function() {
			var trade = $scope.trade;

			trade.$update(function() {
				$location.path('trades/' + trade._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Trades
		$scope.find = function() {
			$scope.trades = Trades.query();
            
            $scope.totalAmount = 0;
            $scope.totalLong = 0;
            $scope.totalShort = 0;
            
            $scope.totalDiff = 0;
            $scope.totalProfitLoss = 0;
            $scope.sumLTP = 0;
            $scope.sumBuy = 0;
            
            
            $scope.numChecked = 0;
		};
        
        //Find existing Trade
		$scope.findOne = function() {
			$scope.trade = Trades.get({ 
				tradeId: $stateParams.tradeId
			});
		};
               
        
        $scope.getExchangeValues = function(trade) {
            $http.get('exchanges/' + trade.exchange._id + '/getTicker')
                .success(function (data) {
                    trade.exchange.ltp = Number(data.last).toFixed(2);
                   
                    if(trade.bias === 'LONG') {
                        trade.curDiff = Number(trade.exchange.ltp - trade.price).toFixed(2);
                        trade.profitloss = Number(trade.curDiff * trade.amount).toFixed(2);
                    } else if (trade.bias === 'SHORT') {
                        trade.curDiff = Number(trade.price - trade.exchange.ltp).toFixed(2);
                        trade.profitloss = Number(trade.curDiff * trade.amount).toFixed(2);
                    }

                    if(trade.type === 'BUY') {
                        $scope.totalAmount += Number(trade.amount);
                        
                        if(trade.bias === 'LONG') {
                            $scope.totalLong += Number(trade.amount);  
                        } else if (trade.bias === 'SHORT') {
                            $scope.totalShort += Number(trade.amount);
                        }
                        
                    
                    } else if (trade.type === 'SELL') {
                        $scope.totalAmount -= Number(trade.amount);
                    
                        if(trade.bias === 'LONG') {
                            $scope.totalLong -= Number(trade.amount);
                        } else if (trade.bias === 'SHORT') {
                            $scope.totalShort -= Number(trade.amount);
                        }
                    
                    }

                    $scope.totalDiff += Number(trade.curDiff);
                    $scope.totalProfitLoss += Number(trade.profitloss);
                    
                    $scope.sumLTP += Number(trade.exchange.ltp);
                    $scope.sumBuy += Number(trade.price);

                });
            // End of HTTP GET Req.
        };
        
        
        $scope.hoverOnTrade = function(trade) {
            if(trade.type !== 'CHECKED') {
                trade.backup = trade.type;
                trade.type = 'HOVER';
            }
        };
        
        $scope.removeHoverOnTrade = function(trade) {
            if(trade.type !== 'CHECKED') {
                trade.type = trade.backup;
            }
        };
        
        $scope.checkClicked = function(trade) {                        
            if(trade.checked) {
                trade.type = 'CHECKED';
                $scope.numChecked++;
            } else {
                trade.type = trade.backup;
                $scope.numChecked--;
            }
        };
        
        $scope.orderByProfitLossFunction = function(trade) {
            trade.profitloss = parseFloat(trade.profitloss);
            return parseFloat(trade.profitloss);
        }
	}
]);