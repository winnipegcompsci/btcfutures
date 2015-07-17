'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Trade = mongoose.model('Trade'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, trade;

/**
 * Trade routes tests
 */
describe('Trade CRUD tests', function() {
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

		// Save a user to the test db and create new Trade
		user.save(function() {
			trade = {
				name: 'Trade Name'
			};

			done();
		});
	});

	it('should be able to save Trade instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Trade
				agent.post('/trades')
					.send(trade)
					.expect(200)
					.end(function(tradeSaveErr, tradeSaveRes) {
						// Handle Trade save error
						if (tradeSaveErr) done(tradeSaveErr);

						// Get a list of Trades
						agent.get('/trades')
							.end(function(tradesGetErr, tradesGetRes) {
								// Handle Trade save error
								if (tradesGetErr) done(tradesGetErr);

								// Get Trades list
								var trades = tradesGetRes.body;

								// Set assertions
								(trades[0].user._id).should.equal(userId);
								(trades[0].name).should.match('Trade Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Trade instance if not logged in', function(done) {
		agent.post('/trades')
			.send(trade)
			.expect(401)
			.end(function(tradeSaveErr, tradeSaveRes) {
				// Call the assertion callback
				done(tradeSaveErr);
			});
	});

	it('should not be able to save Trade instance if no name is provided', function(done) {
		// Invalidate name field
		trade.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Trade
				agent.post('/trades')
					.send(trade)
					.expect(400)
					.end(function(tradeSaveErr, tradeSaveRes) {
						// Set message assertion
						(tradeSaveRes.body.message).should.match('Please fill Trade name');
						
						// Handle Trade save error
						done(tradeSaveErr);
					});
			});
	});

	it('should be able to update Trade instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Trade
				agent.post('/trades')
					.send(trade)
					.expect(200)
					.end(function(tradeSaveErr, tradeSaveRes) {
						// Handle Trade save error
						if (tradeSaveErr) done(tradeSaveErr);

						// Update Trade name
						trade.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Trade
						agent.put('/trades/' + tradeSaveRes.body._id)
							.send(trade)
							.expect(200)
							.end(function(tradeUpdateErr, tradeUpdateRes) {
								// Handle Trade update error
								if (tradeUpdateErr) done(tradeUpdateErr);

								// Set assertions
								(tradeUpdateRes.body._id).should.equal(tradeSaveRes.body._id);
								(tradeUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Trades if not signed in', function(done) {
		// Create new Trade model instance
		var tradeObj = new Trade(trade);

		// Save the Trade
		tradeObj.save(function() {
			// Request Trades
			request(app).get('/trades')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Trade if not signed in', function(done) {
		// Create new Trade model instance
		var tradeObj = new Trade(trade);

		// Save the Trade
		tradeObj.save(function() {
			request(app).get('/trades/' + tradeObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', trade.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Trade instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Trade
				agent.post('/trades')
					.send(trade)
					.expect(200)
					.end(function(tradeSaveErr, tradeSaveRes) {
						// Handle Trade save error
						if (tradeSaveErr) done(tradeSaveErr);

						// Delete existing Trade
						agent.delete('/trades/' + tradeSaveRes.body._id)
							.send(trade)
							.expect(200)
							.end(function(tradeDeleteErr, tradeDeleteRes) {
								// Handle Trade error error
								if (tradeDeleteErr) done(tradeDeleteErr);

								// Set assertions
								(tradeDeleteRes.body._id).should.equal(tradeSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Trade instance if not signed in', function(done) {
		// Set Trade user 
		trade.user = user;

		// Create new Trade model instance
		var tradeObj = new Trade(trade);

		// Save the Trade
		tradeObj.save(function() {
			// Try deleting Trade
			request(app).delete('/trades/' + tradeObj._id)
			.expect(401)
			.end(function(tradeDeleteErr, tradeDeleteRes) {
				// Set message assertion
				(tradeDeleteRes.body.message).should.match('User is not logged in');

				// Handle Trade error error
				done(tradeDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Trade.remove().exec();
		done();
	});
});