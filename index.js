/*jslint node: true */
"use strict";

var	http		= require("http"),
	url			= require("url"),
	Bookshelf	= require("Bookshelf"),
	nconf		= require("nconf");

//
// Configuration
//

nconf.argv().env();

nconf.file({ file: 'config.json' });
nconf.defaults({
	'http': {
		'port': 8080
	},
	'bookshelf': {
		client: 'pg',
		// Default local testing configuration
		// without any passwords, OBVIOUSLY
		connection: {
			host		: '127.0.0.1',
			user		: 'golergka',
			password	: '',
			database	: 'judgement',
			charset		: 'utf8'
		}
	}
});

//
// Database
//

Bookshelf.pg = Bookshelf.initialize(nconf.get('bookshelf'));

function getQuestions(callback) {
	// only temporary yet
	var questions = [
		{
			id: 1,
			text: "Will 2014 ever end?",
			date: new Date(2014,12,31)
		},
		{
			id: 2,
			text: "Will the Yellowstone erupt until 3 May, 2014?",
			date: new Date(2014,5,3)
		}
	];
	callback(questions);
}

//
// Starting server
//

var server = http.createServer(function(req,res) {
	var u = url.parse(req.url, true);
	
	res.writeHead(200, { 'Content-Type': 'application/json' });
	var result = {};

	if (u.pathname === '/getQuestions') {
		getQuestions(function (questions) {
			result.questions = questions;
			res.end(JSON.stringify(result));
		});
	} else {
		result.error = "Unknown url";
		res.end(JSON.stringify(result));
	}
});
server.listen(nconf.get('http:port'));
console.log("Listening on port " + nconf.get('http:port'));
