'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Balance = mongoose.model('Balance'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, balance;

/**
 * Balance routes tests
 */
describe('Balance CRUD tests', function() {
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

		// Save a user to the test db and create new Balance
		user.save(function() {
			balance = {
				name: 'Balance Name'
			};

			done();
		});
	});

	it('should be able to save Balance instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Balance
				agent.post('/balances')
					.send(balance)
					.expect(200)
					.end(function(balanceSaveErr, balanceSaveRes) {
						// Handle Balance save error
						if (balanceSaveErr) done(balanceSaveErr);

						// Get a list of Balances
						agent.get('/balances')
							.end(function(balancesGetErr, balancesGetRes) {
								// Handle Balance save error
								if (balancesGetErr) done(balancesGetErr);

								// Get Balances list
								var balances = balancesGetRes.body;

								// Set assertions
								(balances[0].user._id).should.equal(userId);
								(balances[0].name).should.match('Balance Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Balance instance if not logged in', function(done) {
		agent.post('/balances')
			.send(balance)
			.expect(401)
			.end(function(balanceSaveErr, balanceSaveRes) {
				// Call the assertion callback
				done(balanceSaveErr);
			});
	});

	it('should not be able to save Balance instance if no name is provided', function(done) {
		// Invalidate name field
		balance.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Balance
				agent.post('/balances')
					.send(balance)
					.expect(400)
					.end(function(balanceSaveErr, balanceSaveRes) {
						// Set message assertion
						(balanceSaveRes.body.message).should.match('Please fill Balance name');
						
						// Handle Balance save error
						done(balanceSaveErr);
					});
			});
	});

	it('should be able to update Balance instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Balance
				agent.post('/balances')
					.send(balance)
					.expect(200)
					.end(function(balanceSaveErr, balanceSaveRes) {
						// Handle Balance save error
						if (balanceSaveErr) done(balanceSaveErr);

						// Update Balance name
						balance.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Balance
						agent.put('/balances/' + balanceSaveRes.body._id)
							.send(balance)
							.expect(200)
							.end(function(balanceUpdateErr, balanceUpdateRes) {
								// Handle Balance update error
								if (balanceUpdateErr) done(balanceUpdateErr);

								// Set assertions
								(balanceUpdateRes.body._id).should.equal(balanceSaveRes.body._id);
								(balanceUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Balances if not signed in', function(done) {
		// Create new Balance model instance
		var balanceObj = new Balance(balance);

		// Save the Balance
		balanceObj.save(function() {
			// Request Balances
			request(app).get('/balances')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Balance if not signed in', function(done) {
		// Create new Balance model instance
		var balanceObj = new Balance(balance);

		// Save the Balance
		balanceObj.save(function() {
			request(app).get('/balances/' + balanceObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', balance.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Balance instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Balance
				agent.post('/balances')
					.send(balance)
					.expect(200)
					.end(function(balanceSaveErr, balanceSaveRes) {
						// Handle Balance save error
						if (balanceSaveErr) done(balanceSaveErr);

						// Delete existing Balance
						agent.delete('/balances/' + balanceSaveRes.body._id)
							.send(balance)
							.expect(200)
							.end(function(balanceDeleteErr, balanceDeleteRes) {
								// Handle Balance error error
								if (balanceDeleteErr) done(balanceDeleteErr);

								// Set assertions
								(balanceDeleteRes.body._id).should.equal(balanceSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Balance instance if not signed in', function(done) {
		// Set Balance user 
		balance.user = user;

		// Create new Balance model instance
		var balanceObj = new Balance(balance);

		// Save the Balance
		balanceObj.save(function() {
			// Try deleting Balance
			request(app).delete('/balances/' + balanceObj._id)
			.expect(401)
			.end(function(balanceDeleteErr, balanceDeleteRes) {
				// Set message assertion
				(balanceDeleteRes.body.message).should.match('User is not logged in');

				// Handle Balance error error
				done(balanceDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Balance.remove().exec();
		done();
	});
});