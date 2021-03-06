'use strict';

(function() {
	// Prices Controller Spec
	describe('Prices Controller Tests', function() {
		// Initialize global variables
		var PricesController,
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

			// Initialize the Prices controller.
			PricesController = $controller('PricesController', {
				$scope: scope
			});
		}));

		it('$scope.find() should create an array with at least one Price object fetched from XHR', inject(function(Prices) {
			// Create sample Price using the Prices service
			var samplePrice = new Prices({
				name: 'New Price'
			});

			// Create a sample Prices array that includes the new Price
			var samplePrices = [samplePrice];

			// Set GET response
			$httpBackend.expectGET('prices').respond(samplePrices);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.prices).toEqualData(samplePrices);
		}));

		it('$scope.findOne() should create an array with one Price object fetched from XHR using a priceId URL parameter', inject(function(Prices) {
			// Define a sample Price object
			var samplePrice = new Prices({
				name: 'New Price'
			});

			// Set the URL parameter
			$stateParams.priceId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/prices\/([0-9a-fA-F]{24})$/).respond(samplePrice);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.price).toEqualData(samplePrice);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Prices) {
			// Create a sample Price object
			var samplePricePostData = new Prices({
				name: 'New Price'
			});

			// Create a sample Price response
			var samplePriceResponse = new Prices({
				_id: '525cf20451979dea2c000001',
				name: 'New Price'
			});

			// Fixture mock form input values
			scope.name = 'New Price';

			// Set POST response
			$httpBackend.expectPOST('prices', samplePricePostData).respond(samplePriceResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Price was created
			expect($location.path()).toBe('/prices/' + samplePriceResponse._id);
		}));

		it('$scope.update() should update a valid Price', inject(function(Prices) {
			// Define a sample Price put data
			var samplePricePutData = new Prices({
				_id: '525cf20451979dea2c000001',
				name: 'New Price'
			});

			// Mock Price in scope
			scope.price = samplePricePutData;

			// Set PUT response
			$httpBackend.expectPUT(/prices\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/prices/' + samplePricePutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid priceId and remove the Price from the scope', inject(function(Prices) {
			// Create new Price object
			var samplePrice = new Prices({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Prices array and include the Price
			scope.prices = [samplePrice];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/prices\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(samplePrice);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.prices.length).toBe(0);
		}));
	});
}());