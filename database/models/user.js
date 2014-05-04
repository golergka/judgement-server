/*jslint node: true */
"use strict";

require('../../config');

var storage		= require('../storage'),
	Sequelize	= require('sequelize'),
	graph		= require('fbgraph'),
	Q			= require('q');

var User = storage.db.define(
	'User',
	{
		vendorIdHash			:	Sequelize.STRING,
		facebookId				:	Sequelize.STRING,
		facebookAccessToken		:	Sequelize.STRING
	},
	{
		instanceMethods: {
			validateFacebookAccessToken : function(t) {
				var that = this;
				var result = Q.defer();
				if (t === this.facebookAccessToken) {
					result.resolve();
				} else {
					graph.get("/me?access_token=" + t, function(err, res) {
						if (!!err) {
							console.log("Couldn't validate token:");
							console.log(err);
							result.reject(err);
						} else {
							if (!that.facebookId) {
								that.facebookId = res.id;
							} else if (that.facebookId !== res.id) {
								result.reject("Wrong facebook id!");
								return;
							}
							that.facebookAccessToken = t;
							that.save()
								.success(function() { result.resolve(); });
						}
					});
				}
				return result.promise;
			}
		}
	}
);

module.exports = User;
