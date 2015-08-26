'use strict';

(function() {
	// Balances Controller Spec
	describe('Balances Controller Tests', function() {
		// Initialize global variables
		var BalancesController,
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

			// Initialize the Balances controller.
			BalancesController = $controller('BalancesController', {
				$scope: scope
			});
		}));

		it('$scope.find() should create an array with at least one Balance object fetched from XHR', inject(function(Balances) {
			// Create sample Balance using the Balances service
			var sampleBalance = new Balances({
				name: 'New Balance'
			});

			// Create a sample Balances array that includes the new Balance
			var sampleBalances = [sampleBalance];

			// Set GET response
			$httpBackend.expectGET('balances').respond(sampleBalances);

			// Run controller functionality
			scope.find();
			$httpBackend.flush();

			// Test scope value
			expect(scope.balances).toEqualData(sampleBalances);
		}));

		it('$scope.findOne() should create an array with one Balance object fetched from XHR using a balanceId URL parameter', inject(function(Balances) {
			// Define a sample Balance object
			var sampleBalance = new Balances({
				name: 'New Balance'
			});

			// Set the URL parameter
			$stateParams.balanceId = '525a8422f6d0f87f0e407a33';

			// Set GET response
			$httpBackend.expectGET(/balances\/([0-9a-fA-F]{24})$/).respond(sampleBalance);

			// Run controller functionality
			scope.findOne();
			$httpBackend.flush();

			// Test scope value
			expect(scope.balance).toEqualData(sampleBalance);
		}));

		it('$scope.create() with valid form data should send a POST request with the form input values and then locate to new object URL', inject(function(Balances) {
			// Create a sample Balance object
			var sampleBalancePostData = new Balances({
				name: 'New Balance'
			});

			// Create a sample Balance response
			var sampleBalanceResponse = new Balances({
				_id: '525cf20451979dea2c000001',
				name: 'New Balance'
			});

			// Fixture mock form input values
			scope.name = 'New Balance';

			// Set POST response
			$httpBackend.expectPOST('balances', sampleBalancePostData).respond(sampleBalanceResponse);

			// Run controller functionality
			scope.create();
			$httpBackend.flush();

			// Test form inputs are reset
			expect(scope.name).toEqual('');

			// Test URL redirection after the Balance was created
			expect($location.path()).toBe('/balances/' + sampleBalanceResponse._id);
		}));

		it('$scope.update() should update a valid Balance', inject(function(Balances) {
			// Define a sample Balance put data
			var sampleBalancePutData = new Balances({
				_id: '525cf20451979dea2c000001',
				name: 'New Balance'
			});

			// Mock Balance in scope
			scope.balance = sampleBalancePutData;

			// Set PUT response
			$httpBackend.expectPUT(/balances\/([0-9a-fA-F]{24})$/).respond();

			// Run controller functionality
			scope.update();
			$httpBackend.flush();

			// Test URL location to new object
			expect($location.path()).toBe('/balances/' + sampleBalancePutData._id);
		}));

		it('$scope.remove() should send a DELETE request with a valid balanceId and remove the Balance from the scope', inject(function(Balances) {
			// Create new Balance object
			var sampleBalance = new Balances({
				_id: '525a8422f6d0f87f0e407a33'
			});

			// Create new Balances array and include the Balance
			scope.balances = [sampleBalance];

			// Set expected DELETE response
			$httpBackend.expectDELETE(/balances\/([0-9a-fA-F]{24})$/).respond(204);

			// Run controller functionality
			scope.remove(sampleBalance);
			$httpBackend.flush();

			// Test array after successful delete
			expect(scope.balances.length).toBe(0);
		}));
	});
}());