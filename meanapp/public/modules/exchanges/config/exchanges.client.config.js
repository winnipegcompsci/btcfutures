'use strict';

// Configuring the Articles module
angular.module('exchanges').run(['Menus',
	function(Menus) {
		// Set top bar menu items
		Menus.addMenuItem('topbar', 'Exchanges', 'exchanges', 'dropdown', '/exchanges(/create)?');
		Menus.addSubMenuItem('topbar', 'exchanges', 'List Exchanges', 'exchanges');
		Menus.addSubMenuItem('topbar', 'exchanges', 'New Exchange', 'exchanges/create');
	}
]);