'use strict';

(function() {
	// Strategies Controller Spec
	describe('Strategies Controller Tests', function() {
		// Initialize global variables
		var StrategiesController,
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

			// Initialize the Strategies controller.
			StrategiesController = $controller('StrategiesController', {
				$scope: scope
			});
		}));

		it('$scope.find() should create an array with at least one Strategy object fetched from XHR', inject(function(Strategies) {
			// Create sample Strategy using the Strategies service
			var sampleStrategy = new Strategies({
				name: 'New Strategy'
			});

			// Create a sample Strategies array that includes the new Strategy
			var sampleStrategies = [sampleStrategy];

			// Set GET response
			$httpBackend.expectGET('strategies').respond(sampleStrategies);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.strategies).toEqualData(sampleStrategies);
		}));

		it('$scope.findOne() should create an array with one Strategy object fetched from XHR using a strategyId URL parameter', inject(function(Strategies) {
			// Define a sample Strategy object
			var sampleStrategy = new Strategies({
				name: 'New Strategy'
			});

			// Set the URL parameter
			$stateParams.strategyId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/strategies\/([0-9a-fA-F]{24})$/).respond(sampleStrategy);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.strategy).toEqualData(sampleStrategy);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Strategies) {
			// Create a sample Strategy object
			var sampleStrategyPostData = new Strategies({
				name: 'New Strategy'
			});

			// Create a sample Strategy response
			var sampleStrategyResponse = new Strategies({
				_id: '525cf20451979dea2c000001',
				name: 'New Strategy'
			});

			// Fixture mock form input values
			scope.name = 'New Strategy';

			// Set POST response
			$httpBackend.expectPOST('strategies', sampleStrategyPostData).respond(sampleStrategyResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Strategy was created
			expect($location.path()).toBe('/strategies/' + sampleStrategyResponse._id);
		}));

		it('$scope.update() should update a valid Strategy', inject(function(Strategies) {
			// Define a sample Strategy put data
			var sampleStrategyPutData = new Strategies({
				_id: '525cf20451979dea2c000001',
				name: 'New Strategy'
			});

			// Mock Strategy in scope
			scope.strategy = sampleStrategyPutData;

			// Set PUT response
			$httpBackend.expectPUT(/strategies\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/strategies/' + sampleStrategyPutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid strategyId and remove the Strategy from the scope', inject(function(Strategies) {
			// Create new Strategy object
			var sampleStrategy = new Strategies({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Strategies array and include the Strategy
			scope.strategies = [sampleStrategy];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/strategies\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleStrategy);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.strategies.length).toBe(0);
		}));
	});
}());