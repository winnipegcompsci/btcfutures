'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Strategy = mongoose.model('Strategy'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, strategy;

/**
 * Strategy routes tests
 */
describe('Strategy CRUD tests', function() {
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

		// Save a user to the test db and create new Strategy
		user.save(function() {
			strategy = {
				name: 'Strategy Name'
			};

			done();
		});
	});

	it('should be able to save Strategy instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Strategy
				agent.post('/strategies')
					.send(strategy)
					.expect(200)
					.end(function(strategySaveErr, strategySaveRes) {
						// Handle Strategy save error
						if (strategySaveErr) done(strategySaveErr);

						// Get a list of Strategies
						agent.get('/strategies')
							.end(function(strategiesGetErr, strategiesGetRes) {
								// Handle Strategy save error
								if (strategiesGetErr) done(strategiesGetErr);

								// Get Strategies list
								var strategies = strategiesGetRes.body;

								// Set assertions
								(strategies[0].user._id).should.equal(userId);
								(strategies[0].name).should.match('Strategy Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Strategy instance if not logged in', function(done) {
		agent.post('/strategies')
			.send(strategy)
			.expect(401)
			.end(function(strategySaveErr, strategySaveRes) {
				// Call the assertion callback
				done(strategySaveErr);
			});
	});

	it('should not be able to save Strategy instance if no name is provided', function(done) {
		// Invalidate name field
		strategy.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Strategy
				agent.post('/strategies')
					.send(strategy)
					.expect(400)
					.end(function(strategySaveErr, strategySaveRes) {
						// Set message assertion
						(strategySaveRes.body.message).should.match('Please fill Strategy name');
						
						// Handle Strategy save error
						done(strategySaveErr);
					});
			});
	});

	it('should be able to update Strategy instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Strategy
				agent.post('/strategies')
					.send(strategy)
					.expect(200)
					.end(function(strategySaveErr, strategySaveRes) {
						// Handle Strategy save error
						if (strategySaveErr) done(strategySaveErr);

						// Update Strategy name
						strategy.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Strategy
						agent.put('/strategies/' + strategySaveRes.body._id)
							.send(strategy)
							.expect(200)
							.end(function(strategyUpdateErr, strategyUpdateRes) {
								// Handle Strategy update error
								if (strategyUpdateErr) done(strategyUpdateErr);

								// Set assertions
								(strategyUpdateRes.body._id).should.equal(strategySaveRes.body._id);
								(strategyUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Strategies if not signed in', function(done) {
		// Create new Strategy model instance
		var strategyObj = new Strategy(strategy);

		// Save the Strategy
		strategyObj.save(function() {
			// Request Strategies
			request(app).get('/strategies')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Strategy if not signed in', function(done) {
		// Create new Strategy model instance
		var strategyObj = new Strategy(strategy);

		// Save the Strategy
		strategyObj.save(function() {
			request(app).get('/strategies/' + strategyObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', strategy.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Strategy instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Strategy
				agent.post('/strategies')
					.send(strategy)
					.expect(200)
					.end(function(strategySaveErr, strategySaveRes) {
						// Handle Strategy save error
						if (strategySaveErr) done(strategySaveErr);

						// Delete existing Strategy
						agent.delete('/strategies/' + strategySaveRes.body._id)
							.send(strategy)
							.expect(200)
							.end(function(strategyDeleteErr, strategyDeleteRes) {
								// Handle Strategy error error
								if (strategyDeleteErr) done(strategyDeleteErr);

								// Set assertions
								(strategyDeleteRes.body._id).should.equal(strategySaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Strategy instance if not signed in', function(done) {
		// Set Strategy user 
		strategy.user = user;

		// Create new Strategy model instance
		var strategyObj = new Strategy(strategy);

		// Save the Strategy
		strategyObj.save(function() {
			// Try deleting Strategy
			request(app).delete('/strategies/' + strategyObj._id)
			.expect(401)
			.end(function(strategyDeleteErr, strategyDeleteRes) {
				// Set message assertion
				(strategyDeleteRes.body.message).should.match('User is not logged in');

				// Handle Strategy error error
				done(strategyDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Strategy.remove().exec();
		done();
	});
});