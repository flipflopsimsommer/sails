//
//
// TODO
// =================
// Merge with appHelper.js!
//
//



var fs = require('fs-extra');
var wrench = require('wrench');
var _ = require('lodash');
var exec = require('child_process').exec;
var path = require('path');
var sailsBin = path.resolve('./bin/sails.js');
var spawn = require('child_process').spawn;
var _ioClient = require('./sails.io')(require('socket.io-client'));
var Sails = require('../../../lib/app');

// Make existsSync not crash on older versions of Node
fs.existsSync = fs.existsSync || path.existsSync;

/**
 * Uses the Sails binary to create a namespaced test app
 * If no appName is given use 'testApp'
 *
 * It copies all the files in the fixtures folder into their
 * respective place in the test app so you don't need to worry
 * about setting up the fixtures.
 */

module.exports.build = function( /* [appName], done */ ) {
	var args = Array.prototype.slice.call(arguments),
		done = args.pop(),
		appName = 'testApp';

	// Allow App Name to be optional
	if (args.length > 0) appName = args[0];

	// Cleanup old test fixtures
	if (fs.existsSync(appName)) {
		wrench.rmdirSyncRecursive(path.resolve('./', appName));
	}

	exec(sailsBin + ' new ' + appName, function(err) {
		if (err) return done(err);

		var fixtures = wrench.readdirSyncRecursive('./test/integration/fixtures/sampleapp');
		if (fixtures.length < 1) return done();

		// If fixtures copy them to the test app
		fixtures.forEach(function(file) {
			var filePath = path.resolve('./test/integration/fixtures/sampleapp', file);

			// Check if file is a directory
			var stat = fs.statSync(filePath);

			// Ignore directories
			if (stat.isDirectory()) return;

			// Copy File to Test App
			var data = fs.readFileSync(filePath);

			// Create file and any missing parent directories in its path
			fs.createFileSync(path.resolve('./', appName, file), data);
			fs.writeFileSync(path.resolve('./', appName, file), data);
		});

		process.chdir(appName);
		return done();
	});
};

/**
 * Remove a Test App
 */

module.exports.teardown = function(appName) {
	appName = appName ? appName : 'testApp';
	var dir = path.resolve('./', appName);
	if (fs.existsSync(dir)) {
		wrench.rmdirSyncRecursive(dir);
	}
};

module.exports.lift = function(options, callback) {

	delete process.env.NODE_ENV;

	if (typeof options == 'function') {
		callback = options;
		options = null;
	}

	options = options || {};
	_.defaults(options, {
		port: 1342
	});

	Sails().lift(options, function(err, sails) {
		if (err) return callback(err);
		sails.kill = sails.lower;
		return callback(null, sails);
	});

};

module.exports.buildAndLift = function(appName, options, callback) {
	if (typeof options == 'function') {
		callback = options;
		options = null;
	}
	module.exports.build(appName, function() {
		module.exports.lift(options, callback);
	});
};

module.exports.liftWithTwoSockets = function(options, callback) {
	if (typeof options == 'function') {
		callback = options;
		options = null;
	}
	module.exports.lift(options, function(err, sails) {
		if (err) {return callback(err);}
		var socket1 = _ioClient.connect('http://localhost:1342',{'force new connection': true});
		socket1.on('connect', function() {
			var socket2 = _ioClient.connect('http://localhost:1342',{'force new connection': true});
			socket2.on('connect', function() {
				callback(null, sails, socket1, socket2);
			});
		});
	});
};

module.exports.buildAndLiftWithTwoSockets = function(appName, options, callback) {
	if (typeof options == 'function') {
		callback = options;
		options = null;
	}
	module.exports.build(appName, function() {
		module.exports.liftWithTwoSockets(options, callback);
	});
};