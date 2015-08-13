'use strict';

// Prices controller
angular.module('prices').controller('PricesController', ['$scope', '$stateParams', '$location', 'Authentication', 'Prices',
	function($scope, $stateParams, $location, Authentication, Prices) {
		$scope.authentication = Authentication;

		// Create new Price
		$scope.create = function() {
			// Create new Price object
			var price = new Prices ({
				name: this.name
			});

			// Redirect after save
			price.$save(function(response) {
				$location.path('prices/' + response._id);

				// Clear form fields
				$scope.name = '';
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Remove existing Price
		$scope.remove = function(price) {
			if ( price ) { 
				price.$remove();

				for (var i in $scope.prices) {
					if ($scope.prices [i] === price) {
						$scope.prices.splice(i, 1);
					}
				}
			} else {
				$scope.price.$remove(function() {
					$location.path('prices');
				});
			}
		};

		// Update existing Price
		$scope.update = function() {
			var price = $scope.price;

			price.$update(function() {
				$location.path('prices/' + price._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});
		};

		// Find a list of Prices
		$scope.find = function() {
			$scope.prices = Prices.query();
		};

		// Find existing Price
		$scope.findOne = function() {
			$scope.price = Prices.get({ 
				priceId: $stateParams.priceId
			});
		};
	}
]);

angular.module('prices').directive('script', function() {
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