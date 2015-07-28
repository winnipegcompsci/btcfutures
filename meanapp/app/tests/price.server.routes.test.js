'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Price = mongoose.model('Price'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, price;

/**
 * Price routes tests
 */
describe('Price CRUD tests', function() {
	beforeEach(function(done) {
		// Create user credentials
		credentials = {
			username: 'username',
			password: 'password'
		};

		// Create a new user
		user = new User({
			firstName: 'Full',
			lastName: 'Name',
			displayName: 'Full Name',
			email: 'test@test.com',
			username: credentials.username,
			password: credentials.password,
			provider: 'local'
		});

		// Save a user to the test db and create new Price
		user.save(function() {
			price = {
				name: 'Price Name'
			};

			done();
		});
	});

	it('should be able to save Price instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Price
				agent.post('/prices')
					.send(price)
					.expect(200)
					.end(function(priceSaveErr, priceSaveRes) {
						// Handle Price save error
						if (priceSaveErr) done(priceSaveErr);

						// Get a list of Prices
						agent.get('/prices')
							.end(function(pricesGetErr, pricesGetRes) {
								// Handle Price save error
								if (pricesGetErr) done(pricesGetErr);

								// Get Prices list
								var prices = pricesGetRes.body;

								// Set assertions
								(prices[0].user._id).should.equal(userId);
								(prices[0].name).should.match('Price Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Price instance if not logged in', function(done) {
		agent.post('/prices')
			.send(price)
			.expect(401)
			.end(function(priceSaveErr, priceSaveRes) {
				// Call the assertion callback
				done(priceSaveErr);
			});
	});

	it('should not be able to save Price instance if no name is provided', function(done) {
		// Invalidate name field
		price.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Price
				agent.post('/prices')
					.send(price)
					.expect(400)
					.end(function(priceSaveErr, priceSaveRes) {
						// Set message assertion
						(priceSaveRes.body.message).should.match('Please fill Price name');
						
						// Handle Price save error
						done(priceSaveErr);
					});
			});
	});

	it('should be able to update Price instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Price
				agent.post('/prices')
					.send(price)
					.expect(200)
					.end(function(priceSaveErr, priceSaveRes) {
						// Handle Price save error
						if (priceSaveErr) done(priceSaveErr);

						// Update Price name
						price.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Price
						agent.put('/prices/' + priceSaveRes.body._id)
							.send(price)
							.expect(200)
							.end(function(priceUpdateErr, priceUpdateRes) {
								// Handle Price update error
								if (priceUpdateErr) done(priceUpdateErr);

								// Set assertions
								(priceUpdateRes.body._id).should.equal(priceSaveRes.body._id);
								(priceUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Prices if not signed in', function(done) {
		// Create new Price model instance
		var priceObj = new Price(price);

		// Save the Price
		priceObj.save(function() {
			// Request Prices
			request(app).get('/prices')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Price if not signed in', function(done) {
		// Create new Price model instance
		var priceObj = new Price(price);

		// Save the Price
		priceObj.save(function() {
			request(app).get('/prices/' + priceObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', price.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Price instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Price
				agent.post('/prices')
					.send(price)
					.expect(200)
					.end(function(priceSaveErr, priceSaveRes) {
						// Handle Price save error
						if (priceSaveErr) done(priceSaveErr);

						// Delete existing Price
						agent.delete('/prices/' + priceSaveRes.body._id)
							.send(price)
							.expect(200)
							.end(function(priceDeleteErr, priceDeleteRes) {
								// Handle Price error error
								if (priceDeleteErr) done(priceDeleteErr);

								// Set assertions
								(priceDeleteRes.body._id).should.equal(priceSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Price instance if not signed in', function(done) {
		// Set Price user 
		price.user = user;

		// Create new Price model instance
		var priceObj = new Price(price);

		// Save the Price
		priceObj.save(function() {
			// Try deleting Price
			request(app).delete('/prices/' + priceObj._id)
			.expect(401)
			.end(function(priceDeleteErr, priceDeleteRes) {
				// Set message assertion
				(priceDeleteRes.body.message).should.match('User is not logged in');

				// Handle Price error error
				done(priceDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Price.remove().exec();
		done();
	});
});