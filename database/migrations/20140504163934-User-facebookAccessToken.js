/*jslint node: true */
"use strict";

module.exports = {
	up: function(migration, DataTypes, done) {
		migration.addColumn(
			'Users',
			'facebookAccessToken',
			DataTypes.STRING
		).complete(done);
	},
	down: function(migration, DataTypes, done) {
		migration.removeColumn(
			'Users',
			'facebookAccessToken',
			DataTypes.STRING
		).complete(done);
	}
};
