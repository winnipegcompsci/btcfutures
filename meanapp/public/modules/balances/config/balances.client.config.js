'use strict';

// Configuring the Articles module
angular.module('balances').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Balances', 'balances', 'dropdown', '/balances(/create)?');
		Menus.addSubMenuItem('topbar', 'balances', 'List Balances', 'balances');
		Menus.addSubMenuItem('topbar', 'balances', 'New Balance', 'balances/create');
	}
]);