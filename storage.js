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
	text:			Sequelize.STRING,
	deadline:		Sequelize.DATE,
	answered:		{ type: Sequelize.BOOLEAN, defaultValue: false},
	rightAnswer:	{ type: Sequelize.BOOLEAN, defaultValue: false}
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

exports.sync = function(test) {
	console.log('Syncing storage...');

	return Q.all([
			db.authenticate(),
			db.sync({ force: test })
		])
		.then(function() {
			console.log('Database schemas synced');
			if (test) {
				return Q.All([
					Question.Create({
						text: "Will Sochi olimpics happen?",
						deadline: new Date(2014,3,1),
						answered: true,
						rightAnswer: true
					}),
					Questions.Create({
						text: "Will the summer be warm?",
						deadline: new Date(2014,9,1),
					})
				]).then(function() {
					console.log('Created test data');
				});
			}
		});

};
