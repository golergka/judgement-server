/*jslint node: true */
"use strict";

require('./config');

var Sequelize	= require('sequelize'),
	nconf		= require('nconf'),
	Q			= require('q');

var db = new Sequelize(
	nconf.get('sequelize:database'),
	nconf.get('sequelize:username'),
	nconf.get('sequelize:password'),
	nconf.get('sequelize:config')
);

exports.db = db;

exports.sync = function() {
	console.log('Syncing storage...');

	return Q.all([
			db.authenticate(),
			db.sync()
		])
		.then(function() {
			console.log('Database schemas synced');
		});

};
