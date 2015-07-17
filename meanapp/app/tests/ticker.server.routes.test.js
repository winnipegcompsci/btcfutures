'use strict';

var should = require('should'),
	request = require('supertest'),
	app = require('../../server'),
	mongoose = require('mongoose'),
	User = mongoose.model('User'),
	Ticker = mongoose.model('Ticker'),
	agent = request.agent(app);

/**
 * Globals
 */
var credentials, user, ticker;

/**
 * Ticker routes tests
 */
describe('Ticker CRUD tests', function() {
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

		// Save a user to the test db and create new Ticker
		user.save(function() {
			ticker = {
				name: 'Ticker Name'
			};

			done();
		});
	});

	it('should be able to save Ticker instance if logged in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Ticker
				agent.post('/tickers')
					.send(ticker)
					.expect(200)
					.end(function(tickerSaveErr, tickerSaveRes) {
						// Handle Ticker save error
						if (tickerSaveErr) done(tickerSaveErr);

						// Get a list of Tickers
						agent.get('/tickers')
							.end(function(tickersGetErr, tickersGetRes) {
								// Handle Ticker save error
								if (tickersGetErr) done(tickersGetErr);

								// Get Tickers list
								var tickers = tickersGetRes.body;

								// Set assertions
								(tickers[0].user._id).should.equal(userId);
								(tickers[0].name).should.match('Ticker Name');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to save Ticker instance if not logged in', function(done) {
		agent.post('/tickers')
			.send(ticker)
			.expect(401)
			.end(function(tickerSaveErr, tickerSaveRes) {
				// Call the assertion callback
				done(tickerSaveErr);
			});
	});

	it('should not be able to save Ticker instance if no name is provided', function(done) {
		// Invalidate name field
		ticker.name = '';

		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Ticker
				agent.post('/tickers')
					.send(ticker)
					.expect(400)
					.end(function(tickerSaveErr, tickerSaveRes) {
						// Set message assertion
						(tickerSaveRes.body.message).should.match('Please fill Ticker name');
						
						// Handle Ticker save error
						done(tickerSaveErr);
					});
			});
	});

	it('should be able to update Ticker instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Ticker
				agent.post('/tickers')
					.send(ticker)
					.expect(200)
					.end(function(tickerSaveErr, tickerSaveRes) {
						// Handle Ticker save error
						if (tickerSaveErr) done(tickerSaveErr);

						// Update Ticker name
						ticker.name = 'WHY YOU GOTTA BE SO MEAN?';

						// Update existing Ticker
						agent.put('/tickers/' + tickerSaveRes.body._id)
							.send(ticker)
							.expect(200)
							.end(function(tickerUpdateErr, tickerUpdateRes) {
								// Handle Ticker update error
								if (tickerUpdateErr) done(tickerUpdateErr);

								// Set assertions
								(tickerUpdateRes.body._id).should.equal(tickerSaveRes.body._id);
								(tickerUpdateRes.body.name).should.match('WHY YOU GOTTA BE SO MEAN?');

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should be able to get a list of Tickers if not signed in', function(done) {
		// Create new Ticker model instance
		var tickerObj = new Ticker(ticker);

		// Save the Ticker
		tickerObj.save(function() {
			// Request Tickers
			request(app).get('/tickers')
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Array.with.lengthOf(1);

					// Call the assertion callback
					done();
				});

		});
	});


	it('should be able to get a single Ticker if not signed in', function(done) {
		// Create new Ticker model instance
		var tickerObj = new Ticker(ticker);

		// Save the Ticker
		tickerObj.save(function() {
			request(app).get('/tickers/' + tickerObj._id)
				.end(function(req, res) {
					// Set assertion
					res.body.should.be.an.Object.with.property('name', ticker.name);

					// Call the assertion callback
					done();
				});
		});
	});

	it('should be able to delete Ticker instance if signed in', function(done) {
		agent.post('/auth/signin')
			.send(credentials)
			.expect(200)
			.end(function(signinErr, signinRes) {
				// Handle signin error
				if (signinErr) done(signinErr);

				// Get the userId
				var userId = user.id;

				// Save a new Ticker
				agent.post('/tickers')
					.send(ticker)
					.expect(200)
					.end(function(tickerSaveErr, tickerSaveRes) {
						// Handle Ticker save error
						if (tickerSaveErr) done(tickerSaveErr);

						// Delete existing Ticker
						agent.delete('/tickers/' + tickerSaveRes.body._id)
							.send(ticker)
							.expect(200)
							.end(function(tickerDeleteErr, tickerDeleteRes) {
								// Handle Ticker error error
								if (tickerDeleteErr) done(tickerDeleteErr);

								// Set assertions
								(tickerDeleteRes.body._id).should.equal(tickerSaveRes.body._id);

								// Call the assertion callback
								done();
							});
					});
			});
	});

	it('should not be able to delete Ticker instance if not signed in', function(done) {
		// Set Ticker user 
		ticker.user = user;

		// Create new Ticker model instance
		var tickerObj = new Ticker(ticker);

		// Save the Ticker
		tickerObj.save(function() {
			// Try deleting Ticker
			request(app).delete('/tickers/' + tickerObj._id)
			.expect(401)
			.end(function(tickerDeleteErr, tickerDeleteRes) {
				// Set message assertion
				(tickerDeleteRes.body.message).should.match('User is not logged in');

				// Handle Ticker error error
				done(tickerDeleteErr);
			});

		});
	});

	afterEach(function(done) {
		User.remove().exec();
		Ticker.remove().exec();
		done();
	});
});