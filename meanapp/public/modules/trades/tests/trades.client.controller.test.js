'use strict';

(function() {
	// Trades Controller Spec
	describe('Trades Controller Tests', function() {
		// Initialize global variables
		var TradesController,
		scope,
		$httpBackend,
		$stateParams,
		$location;

		// The $resource service augments the response object with methods for updating and deleting the resource.
		// If we were to use the standard toEqual matcher, our tests would fail because the test values would not match
		// the responses exactly. To solve the problem, we define a new toEqualData Jasmine matcher.
		// When the toEqualData matcher compares two objects, it takes only object properties into
		// account and ignores methods.
		beforeEach(function() {
			jasmine.addMatchers({
				toEqualData: function(util, customEqualityTesters) {
					return {
						compare: function(actual, expected) {
							return {
								pass: angular.equals(actual, expected)
							};
						}
					};
				}
			});
		});

		// Then we can start by loading the main application module
		beforeEach(module(ApplicationConfiguration.applicationModuleName));

		// The injector ignores leading and trailing underscores here (i.e. _$httpBackend_).
		// This allows us to inject a service but then attach it to a variable
		// with the same name as the service.
		beforeEach(inject(function($controller, $rootScope, _$location_, _$stateParams_, _$httpBackend_) {
			// Set a new global scope
			scope = $rootScope.$new();

			// Point global variables to injected services
			$stateParams = _$stateParams_;
			$httpBackend = _$httpBackend_;
			$location = _$location_;

			// Initialize the Trades controller.
			TradesController = $controller('TradesController', {
				$scope: scope
			});
		}));

		it('$scope.find() should create an array with at least one Trade object fetched from XHR', inject(function(Trades) {
			// Create sample Trade using the Trades service
			var sampleTrade = new Trades({
				name: 'New Trade'
			});

			// Create a sample Trades array that includes the new Trade
			var sampleTrades = [sampleTrade];

			// Set GET response
			$httpBackend.expectGET('trades').respond(sampleTrades);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.trades).toEqualData(sampleTrades);
		}));

		it('$scope.findOne() should create an array with one Trade object fetched from XHR using a tradeId URL parameter', inject(function(Trades) {
			// Define a sample Trade object
			var sampleTrade = new Trades({
				name: 'New Trade'
			});

			// Set the URL parameter
			$stateParams.tradeId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/trades\/([0-9a-fA-F]{24})$/).respond(sampleTrade);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.trade).toEqualData(sampleTrade);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Trades) {
			// Create a sample Trade object
			var sampleTradePostData = new Trades({
				name: 'New Trade'
			});

			// Create a sample Trade response
			var sampleTradeResponse = new Trades({
				_id: '525cf20451979dea2c000001',
				name: 'New Trade'
			});

			// Fixture mock form input values
			scope.name = 'New Trade';

			// Set POST response
			$httpBackend.expectPOST('trades', sampleTradePostData).respond(sampleTradeResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Trade was created
			expect($location.path()).toBe('/trades/' + sampleTradeResponse._id);
		}));

		it('$scope.update() should update a valid Trade', inject(function(Trades) {
			// Define a sample Trade put data
			var sampleTradePutData = new Trades({
				_id: '525cf20451979dea2c000001',
				name: 'New Trade'
			});

			// Mock Trade in scope
			scope.trade = sampleTradePutData;

			// Set PUT response
			$httpBackend.expectPUT(/trades\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/trades/' + sampleTradePutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid tradeId and remove the Trade from the scope', inject(function(Trades) {
			// Create new Trade object
			var sampleTrade = new Trades({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Trades array and include the Trade
			scope.trades = [sampleTrade];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/trades\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleTrade);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.trades.length).toBe(0);
		}));
	});
}());