/*jslint node: true */
"use strict";

var nconf = require('nconf');

nconf.file({ file: 'config.json' });
nconf.defaults({
	'http': {
		'port': 8080
	},

	// The default config is for the developer machine configuration of a Postgres app
	// If you're a malicous attacker, you know that my nickname EVERY-fucking-WHERE is golergka. Duh.
	// If you're a developer: don't EVER put anything a bit more sensitive in source code. Duh^2.
	'sequelize' : {
		'database'	: 'judgement',
		'username'	: 'golergka',
		'password'	: '',
		'config'		: {
			'host'				: '127.0.0.1',
			'port'				: '5432',
			'dialect'			: 'postgres',
		}
	}
});

// Heroku port configuration
if (process.env.PORT) {
	nconf.set('http:port', process.env.PORT);
}

// Reading heroku database configuration from env variable
// http://sequelizejs.com/articles/heroku

if (process.env.DATABASE_URL) {
	// postgres://username:password@host:port/database
	var match = process.env.DATABASE_URL.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);

	nconf.set('sequelize:username',		match[1]);
	nconf.set('sequelize:password',		match[2]);
	nconf.set('sequelize:config:host',	match[3]);
	nconf.set('sequelize:config:port',	match[4]);
	nconf.set('sequelize:database',		match[5]);
}
