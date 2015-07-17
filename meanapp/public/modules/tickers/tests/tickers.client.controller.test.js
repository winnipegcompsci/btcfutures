'use strict';

(function() {
	// Tickers Controller Spec
	describe('Tickers Controller Tests', function() {
		// Initialize global variables
		var TickersController,
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

			// Initialize the Tickers controller.
			TickersController = $controller('TickersController', {
				$scope: scope
			});
		}));

		it('$scope.find() should create an array with at least one Ticker object fetched from XHR', inject(function(Tickers) {
			// Create sample Ticker using the Tickers service
			var sampleTicker = new Tickers({
				name: 'New Ticker'
			});

			// Create a sample Tickers array that includes the new Ticker
			var sampleTickers = [sampleTicker];

			// Set GET response
			$httpBackend.expectGET('tickers').respond(sampleTickers);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.tickers).toEqualData(sampleTickers);
		}));

		it('$scope.findOne() should create an array with one Ticker object fetched from XHR using a tickerId URL parameter', inject(function(Tickers) {
			// Define a sample Ticker object
			var sampleTicker = new Tickers({
				name: 'New Ticker'
			});

			// Set the URL parameter
			$stateParams.tickerId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/tickers\/([0-9a-fA-F]{24})$/).respond(sampleTicker);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.ticker).toEqualData(sampleTicker);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Tickers) {
			// Create a sample Ticker object
			var sampleTickerPostData = new Tickers({
				name: 'New Ticker'
			});

			// Create a sample Ticker response
			var sampleTickerResponse = new Tickers({
				_id: '525cf20451979dea2c000001',
				name: 'New Ticker'
			});

			// Fixture mock form input values
			scope.name = 'New Ticker';

			// Set POST response
			$httpBackend.expectPOST('tickers', sampleTickerPostData).respond(sampleTickerResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Ticker was created
			expect($location.path()).toBe('/tickers/' + sampleTickerResponse._id);
		}));

		it('$scope.update() should update a valid Ticker', inject(function(Tickers) {
			// Define a sample Ticker put data
			var sampleTickerPutData = new Tickers({
				_id: '525cf20451979dea2c000001',
				name: 'New Ticker'
			});

			// Mock Ticker in scope
			scope.ticker = sampleTickerPutData;

			// Set PUT response
			$httpBackend.expectPUT(/tickers\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/tickers/' + sampleTickerPutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid tickerId and remove the Ticker from the scope', inject(function(Tickers) {
			// Create new Ticker object
			var sampleTicker = new Tickers({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Tickers array and include the Ticker
			scope.tickers = [sampleTicker];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/tickers\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleTicker);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.tickers.length).toBe(0);
		}));
	});
}());