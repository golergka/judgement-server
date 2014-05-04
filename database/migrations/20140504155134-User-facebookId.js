/*jslint node: true */
"use strict";

module.exports = {
	up: function(migration, DataTypes, done) {
		migration.addColumn(
			'Users',
			'facebookId',
			DataTypes.STRING
		).complete(done);
	},
	down: function(migration, DataTypes, done) {
		migration.removeColumn(
			'Users',
			'facebookId',
			DataTypes.STRING
		).complete(done);
	}
};
