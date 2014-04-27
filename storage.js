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

// Users

var User = db.define('User', {
	vendorIdHash:	Sequelize.STRING
});
exports.User = User;

// Questions

var Question = db.define('Question', {
	text:		Sequelize.STRING,
	deadline:	Sequelize.DATE
});

exports.Question = Question;

// Answer
var Answer = db.define('Answer', {
	value: Sequelize.BOOLEAN
});
Answer.belongsTo(User);
User.hasMany(Answer);
Answer.belongsTo(Question);

exports.Answer = Answer;

exports.sync = function() {
	console.log('Syncing storage...');

	return Q.all([
			db.authenticate(),
			db.sync({force: true})
		])
		.then(function() {
			console.log('Database schemas synced');
			// Test data
			Question.create({
				text: "Will I live to be 26?",
				deadline: new Date(2013, 6, 10)
			});
		});

};
