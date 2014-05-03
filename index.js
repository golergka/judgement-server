/*jslint node: true */
"use strict";

require('./config');

var url			= require("url"),
	nconf		= require("nconf"),
	express		= require("express"),
	Request		= require("./request"),
	storage		= require("./database/storage");

storage.sync()
	.then(function() {
		var app = express();

		app.use('/api', function(req,res) {
			req.setEncoding('utf8');
			var parsedUrl = url.parse(req.url, true);
			var path = parsedUrl.pathname;
			new Request(path, parsedUrl.query, res).process();
		});
		app.listen(nconf.get('http:port'));
	})
	.fail(function(e) {
		console.log('Failed to initialize');
		console.log(e);
	});
