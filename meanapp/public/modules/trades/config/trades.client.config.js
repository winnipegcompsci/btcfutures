'use strict';

// Configuring the Articles module
angular.module('trades').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Trades', 'trades', 'dropdown', '/trades(/create)?');
		Menus.addSubMenuItem('topbar', 'trades', 'List Trades', 'trades');
		Menus.addSubMenuItem('topbar', 'trades', 'New Trade', 'trades/create');
	}
]);