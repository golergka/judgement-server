/*jslint node: true */
"use strict";

require('../../config');

var storage		= require('../storage'),
	Sequelize	= require('sequelize');

module.exports = storage.db.define('User', {
	vendorIdHash:	Sequelize.STRING
});
