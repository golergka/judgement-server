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

var User = Sequelize.db.define('User', {
	vendorIdHash:	Sequelize.STRING
});

// Questions

var Question = Sequelize.db.define('Question', {
	text: Sequelize.STRING,
	date: Sequelize.DATE
});

// Answer
var Answer = Sequelize.db.define('Answer', {
	value: Sequelize.BOOLEAN
});
Answer.belongsTo(User);
User.hasMany(Answer);
Answer.belongsTo(Question);

// Test data
Question.create({
	text: "Will I live to be 26?",
	date: new Date(2014, 6, 10)
});

// Syncing db

Sequelize.db
	.sync({force: true})
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
	// TODO actually check something
	var result = Q.defer();
	Q.resolve();
	return result;
};

Request.prototype.registerUser = function() {
	return this.getParameter('vendorIdHash')
		.then(function(vendorIdHash) {
			return User.create({
				vendorIdHash: vendorIdHash
			});
		});
};

Request.prototype.getExistingUser = function() {
	return this.getParameter('vendorIdHash')
		.then(function(vendorIdHash){
			return User.find({
				where: {
					vendorIdHash: vendorIdHash
				}
			});
		})
		.then(function(user) {
			if (!!user) {
				return user;
			} else {
				return Q.defer().reject({
					error: "Can't find user",
					errorCode: 3
				}).promise();
			}
		});
};

Request.prototype.getUser = function() {
	var that = this;
	return this.getParameter('method')
	.then(function(method) {
		if (method === 'register') {
			return that.registerUser();
		} else {
			return that.getExistingUser();
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
				return Question.findAll();

			case 'register':
				return that.registerUser();

			case 'getAnswer':
				return Q.all([
					that.getUser(),
					that.getParameter('questionId')
				])
				.spread(function(user, questionId) {
					return Answer.find({
						where: {
							QuestionsId : questionId,
							UserId		: user.id
						},
						order: 'updatedAt DESC',
						limit: 1
					});
				});

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
