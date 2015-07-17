'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Exchange = mongoose.model('Exchange'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, exchange;

/**
 * Exchange routes tests
 */
describe('Exchange CRUD tests', function() {
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

		// Save a user to the test db and create new Exchange
		user.save(function() {
			exchange = {
				name: 'Exchange Name'
			};

			done();
		});
	});

	it('should be able to save Exchange instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Exchange
				agent.post('/exchanges')
					.send(exchange)
					.expect(200)
					.end(function(exchangeSaveErr, exchangeSaveRes) {
						// Handle Exchange save error
						if (exchangeSaveErr) done(exchangeSaveErr);

						// Get a list of Exchanges
						agent.get('/exchanges')
							.end(function(exchangesGetErr, exchangesGetRes) {
								// Handle Exchange save error
								if (exchangesGetErr) done(exchangesGetErr);

								// Get Exchanges list
								var exchanges = exchangesGetRes.body;

								// Set assertions
								(exchanges[0].user._id).should.equal(userId);
								(exchanges[0].name).should.match('Exchange Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Exchange instance if not logged in', function(done) {
		agent.post('/exchanges')
			.send(exchange)
			.expect(401)
			.end(function(exchangeSaveErr, exchangeSaveRes) {
				// Call the assertion callback
				done(exchangeSaveErr);
			});
	});

	it('should not be able to save Exchange instance if no name is provided', function(done) {
		// Invalidate name field
		exchange.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Exchange
				agent.post('/exchanges')
					.send(exchange)
					.expect(400)
					.end(function(exchangeSaveErr, exchangeSaveRes) {
						// Set message assertion
						(exchangeSaveRes.body.message).should.match('Please fill Exchange name');
						
						// Handle Exchange save error
						done(exchangeSaveErr);
					});
			});
	});

	it('should be able to update Exchange instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Exchange
				agent.post('/exchanges')
					.send(exchange)
					.expect(200)
					.end(function(exchangeSaveErr, exchangeSaveRes) {
						// Handle Exchange save error
						if (exchangeSaveErr) done(exchangeSaveErr);

						// Update Exchange name
						exchange.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Exchange
						agent.put('/exchanges/' + exchangeSaveRes.body._id)
							.send(exchange)
							.expect(200)
							.end(function(exchangeUpdateErr, exchangeUpdateRes) {
								// Handle Exchange update error
								if (exchangeUpdateErr) done(exchangeUpdateErr);

								// Set assertions
								(exchangeUpdateRes.body._id).should.equal(exchangeSaveRes.body._id);
								(exchangeUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Exchanges if not signed in', function(done) {
		// Create new Exchange model instance
		var exchangeObj = new Exchange(exchange);

		// Save the Exchange
		exchangeObj.save(function() {
			// Request Exchanges
			request(app).get('/exchanges')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Exchange if not signed in', function(done) {
		// Create new Exchange model instance
		var exchangeObj = new Exchange(exchange);

		// Save the Exchange
		exchangeObj.save(function() {
			request(app).get('/exchanges/' + exchangeObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', exchange.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Exchange instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Exchange
				agent.post('/exchanges')
					.send(exchange)
					.expect(200)
					.end(function(exchangeSaveErr, exchangeSaveRes) {
						// Handle Exchange save error
						if (exchangeSaveErr) done(exchangeSaveErr);

						// Delete existing Exchange
						agent.delete('/exchanges/' + exchangeSaveRes.body._id)
							.send(exchange)
							.expect(200)
							.end(function(exchangeDeleteErr, exchangeDeleteRes) {
								// Handle Exchange error error
								if (exchangeDeleteErr) done(exchangeDeleteErr);

								// Set assertions
								(exchangeDeleteRes.body._id).should.equal(exchangeSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Exchange instance if not signed in', function(done) {
		// Set Exchange user 
		exchange.user = user;

		// Create new Exchange model instance
		var exchangeObj = new Exchange(exchange);

		// Save the Exchange
		exchangeObj.save(function() {
			// Try deleting Exchange
			request(app).delete('/exchanges/' + exchangeObj._id)
			.expect(401)
			.end(function(exchangeDeleteErr, exchangeDeleteRes) {
				// Set message assertion
				(exchangeDeleteRes.body.message).should.match('User is not logged in');

				// Handle Exchange error error
				done(exchangeDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Exchange.remove().exec();
		done();
	});
});