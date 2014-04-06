/*jslint node: true */
"use strict";

var	http		= require("http"),
	url			= require("url");

var port = process.argv[2] || 8080;

function getQuestions(callback) {
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
server.listen(port);
console.log("Listening on port " + port);
