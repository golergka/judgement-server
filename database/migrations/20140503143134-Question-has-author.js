/*jslint node: true */
"use strict";

module.exports = {
	up: function(migration, DataTypes, done) {
		migration.addColumn(
			'Questions',
			'AuthorId',
			DataTypes.INTEGER
		).complete(done);
	},
	down: function(migration, DataTypes, done) {
		migration.removeColumn(
			'Questions',
			'AuthorId'
		).complete(done);
	}
};
