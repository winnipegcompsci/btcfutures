'use strict';

// Configuring the Articles module
angular.module('tickers').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		// Menus.addMenuItem('topbar', 'Tickers', 'tickers', 'dropdown', '/tickers(/create)?');
		// Menus.addSubMenuItem('topbar', 'tickers', 'List Tickers', 'tickers');
		// Menus.addSubMenuItem('topbar', 'tickers', 'New Ticker', 'tickers/create');
	}
]);

