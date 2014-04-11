/*jslint node: true */
"use strict";

var	http		= require("http"),
	url			= require("url"),
	nconf		= require("nconf"),
	Sequelize	= require("sequelize"),
	Q			= require("q");

//
// Configuration
//

nconf.argv().env();

nconf.file({ file: 'config.json' });
nconf.defaults({
	'http': {
		'port': 8080
	},
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

//
// Database
//
Sequelize.db = new Sequelize(
	nconf.get('sequelize:database'),
	nconf.get('sequelize:username'),
	nconf.get('sequelize:password'),
	nconf.get('sequelize:config')
);
Sequelize.db
	.authenticate()
	.complete(function(err) {
		if (!!err) {
			console.log('Unable to connect to the database: ' + err);
		} else {
			console.log('Establised database connection.');
		}
	});

// Users

Sequelize.db.user = Sequelize.db.define('User', {
	vendorIdHash:	Sequelize.STRING,
	loginMethod:	Sequelize.ENUM('iOSVendorId'),
	publicKey:		Sequelize.STRING
});

// Questions

Sequelize.db.question = Sequelize.db.define('Question', {
	text: Sequelize.STRING,
	date: Sequelize.DATE
});

// Syncing db

Sequelize.db
	.sync()
	.complete(function(err) {
		if (!!err) {
			console.log("Couldn't sync schemas: " + err);
		} else {
			console.log('Database schemas synced');
		}
	});

//
// Starting server
//

function Request(path, params, res) {
	this.path	= path;
	this.params = params;
	this.res	= res;
}

Request.prototype.getParameter = function getParameter(paramName) {
	var result = Q.defer();
	var param = this.params[paramName];
	if (!param) {
		result.reject({
			error: paramName + ' parameter required',
			errorCode: 1
		});
	} else {
		result.resolve(param);
	}
	return result.promise;
};

Request.prototype.validateSignature = function() {
	// function(publicKey) {
	var result = Q.defer();
	Q.resolve();
	// TODO actually implement signagure
	/*
	var checkParams = [];
	var signature;
	var message = "";

	for(var param in this.params) {
		if (this.params.hasOwnKey(param)) {
			if (param !== 'sig') {
				checkParams.push(param);
			} else {
				signature = this.params[param];
			}
		}
	}

	if (!signature) {
		result.reject({
			error: 'No signature found!',
			errorCode: 1
		});
	} else {
		checkParams.sort();
		for(var i = 0; i < checkParams.length; i++) {
			message += checkParams[i] + '=' + this.params[checkParams[i]];
		}
		var ursaPublicKey = ursa.createPublicKey(publicKey, 'utf-8');
		if (ursaPublicKey.hashAndVerify('sha256',message,signature,'utf-8')) {
			result.resolve();
		} else {
			result.reject({
				error: "Signature doesn't match",
				errorCode: 2
			});
		}
	}
	*/

	return result;
};

Request.prototype.registerUser = function() {
	return this.getParameter('public_key')
	.then(function(publicKey) {
		return this.validateSignature(publicKey)
		.then(this.getParameter('vendor_id_hash'))
		.then(function(vendorIdHash) {
			return Sequelize.db.user.create({
				vendorIdHash:	vendorIdHash,
				loginMethod:	'iOSVendorId',
				publicKey:		publicKey
			});
		});
	});
};

Request.prototype.getExistingUser = function() {
	return this.getParameter('vendor_id_hash')
	.then(function(vendorIdHash){
		return Sequelize.db.user.find({
			where: {
				loginMethod: 'iOSVendorId',
				vendorIdHash: vendorIdHash
			}
		})
		.then(function(user){
			if (!!user) {
				return user;
			} else {
				return Q.defer().reject({
					error: "Can't find user",
					errorCode: 3
				}).promise();
			}
		});
	});
};

Request.prototype.getUser = function() {
	return this.getParameter('method')
	.then(function(method) {
		if (method === 'register') {
			return this.registerUser();
		} else {
			return this.getExistingUser();
		}
	});
};

Request.prototype.reply = function(reply, code) {
	console.log('replying: ' + reply);
	this.res.writeHead(code, { 'Content-Type': 'application/json' });
	this.res.end(JSON.stringify(reply));
};

Request.prototype.replyOK = function(reply) {
	this.reply({ content: reply, errorCode: 0 }, 200);
};

Request.prototype.replyError = function(error) {
	this.reply(error,400);
};

Request.prototype.process = function() {
	console.log('processing request: ' + this.path);
	console.log('parameters:');
	var that = this;
	return that.getParameter('method')
	.then(function(method) {
		switch(method) {
			case 'getQuestions':
				return Sequelize.db.question.findAll();

			case 'register':
				return that.register();

			default:
				console.log('Unknown method' + method);
				return Q.defer().reject({
					error: 'Unknown method ' + method,
					errorCode: 4
				}).promise();
		}
	})
	.then(function(reply) {
		that.replyOK(reply);
	})
	.fail(function(error) {
		that.replyError(error);
	});
};

var server = http.createServer(function(req,res) {
	req.setEncoding('utf8');
	var parsedUrl = url.parse(req.url, true);
	var path = parsedUrl.pathname;
	new Request(path, parsedUrl.query, res).process();
});
server.listen(nconf.get('http:port'));
console.log("Listening on port " + nconf.get('http:port'));
