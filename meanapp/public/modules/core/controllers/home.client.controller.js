'use strict';


angular.module('core').controller('HomeController', ['$scope', 'Authentication',
	function($scope, Authentication) {
		// This provides Authentication context.
		$scope.authentication = Authentication;    
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