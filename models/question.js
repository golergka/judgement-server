/*jslint node: true */
"use strict";

require('../config');

var Sequelize	= require('sequelize'),
	storage		= require('../storage'),
	User		= require('./user');

var Question = storage.db.define('Question', {
	text:			Sequelize.STRING,
	deadline:		Sequelize.DATE,
	answered:		{ type: Sequelize.BOOLEAN, defaultValue: false},
	rightAnswer:	{ type: Sequelize.BOOLEAN, defaultValue: false}
});
Question.belongsTo(User, {as: 'Author'});

module.exports = Question;
