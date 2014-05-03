/*jslint node: true */
"use strict";

require('../../config');

var Sequelize	= require('sequelize'),
	storage		= require('../storage'),
	User		= require('./user'),
	Question	= require('./question');

var Answer = storage.db.define('Answer', {
	value: Sequelize.BOOLEAN
});
Answer.belongsTo(User);
User.hasMany(Answer);
Answer.belongsTo(Question);

module.exports = Answer;
