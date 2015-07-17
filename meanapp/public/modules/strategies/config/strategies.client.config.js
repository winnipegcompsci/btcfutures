'use strict';

// Configuring the Articles module
angular.module('strategies').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Strategies', 'strategies', 'dropdown', '/strategies(/create)?');
		Menus.addSubMenuItem('topbar', 'strategies', 'List Strategies', 'strategies');
		Menus.addSubMenuItem('topbar', 'strategies', 'New Strategy', 'strategies/create');
	}
]);