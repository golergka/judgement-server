/*jslint node: true */
"use strict";

var Q			= require('q'),
	User		= require('./database/models/user'),
	Question	= require('./database/models/question'),
	Answer		= require('./database/models/answer');

var Request = function Request(path, params, res) {
	this.path	= path;
	this.params = params;
	this.res	= res;
};

module.exports = Request;

var RequestError = function(error, errorCode) {
	this.error = error;
	this.errorCode = errorCode;
};

Request.prototype.getParameter = function getParameter(paramName) {
	var result = Q.defer();
	var param = this.params[paramName];
	if (!param) {
		result.reject(new RequestError(paramName + ' parameter required', 1));
	} else {
		result.resolve(param);
	}
	return result.promise;
};

Request.prototype.validateSignature = function() {
	// TODO actually check something
	var result = Q.defer();
	Q.resolve();
	return result;
};

Request.prototype.registerUser = function() {
	var that = this;
	return that.getExistingValidatedUser()
		.fail(function() {
			return that.getParameter('vendorIdHash')
				.then(function(vendorIdHash) {
					return User.create({
						vendorIdHash: vendorIdHash
					});
				});
		});
};

Request.prototype.getExistingValidatedUser = function() {
	return this.getParameter('vendorIdHash')
		.then(function(vendorIdHash){
			return User.find({
				where: {
					vendorIdHash: vendorIdHash
				}
			});
		})
		.then(function(user) {
			if (!!user) {
				return user;
			} else {
				var result = Q.defer();
				result.reject(new RequestError("Can't find user", 3));
				return result.promise;
			}
		});
};

Request.prototype.getQuestion = function() {
	return this.getParameter('questionId')
		.then(function(questionId){
			return Question.find({
				where: {id: questionId}
			});
		})
		.then(function(question) {
			if (!!question) {
				return question;
			} else {
				var result = Q.defer();
				result.reject(new RequestError("Can't find question", 3));
				return result.promise;
			}
		});
};

Request.prototype.getAnswer = function() {
	var that = this;
	return Q.all([
		that.getUser(),
		that.getParameter('questionId')
	])
	.spread(function(user, questionId) {
		return Answer.find({
			where: {
				QuestionId	: questionId,
				UserId		: user.id
			},
			order: '"updatedAt" DESC'
		});
	});
};

Request.prototype.answer = function() {
	var that = this;
	return Q.all([
		that.getValidatedUser(),
		that.getQuestion(),
		that.getParameter('answer')
	])
	.spread(function(user, question, answer) {
		if (question.deadline > new Date()) {
			return Answer.create({value: !!JSON.parse(answer)})
				.then(function(answer) {
					return Q.all([
						answer.setUser(user),
						answer.setQuestion(question)
					]);
				});
		} else {
			var result = Q.defer();
			result.reject(new RequestError('Deadline for question has passed',5));
			return result.promise;
		}
	});
};

Request.prototype.addQuestion = function() {
};

Request.prototype.getUser = function() {
	return this.getParameter('userId')
		.then(function(userId) {
			return User.find({
				where: {id: userId}
			});
		})
		.then(function(user) {
			if (!!user) {
				return user;
			} else {
				var result = Q.defer();
				result.reject(new RequestError("Can't find user", 3));
				return result.promise;
			}
		});
};

Request.prototype.getValidatedUser = function() {
	var that = this;
	return this.getParameter('method')
	.then(function(method) {
		if (method === 'register') {
			return that.registerUser();
		} else {
			return that.getExistingValidatedUser();
		}
	});
};

Request.prototype.reply = function(reply, code) {
	console.log('replying: ' + JSON.stringify(reply) + ' code: ' + code);
	this.res.writeHead(code, { 'Content-Type': 'application/json' });
	this.res.end(JSON.stringify(reply));
};

Request.prototype.replyOK = function(reply) {
	this.reply({ content: reply, errorCode: 0 }, 200);
};

Request.prototype.replyError = function(error) {
	this.reply(error,400);
};

Request.prototype.process = function() {
	console.log('processing request: ' + JSON.stringify(this.params));
	var that = this;
	return that.getParameter('method')
	.then(function(method) {
		switch(method) {
			case 'getQuestions':
				return Question.findAll();

			case 'register':
				return that.registerUser();

			case 'getAnswer':
				return that.getAnswer();

			case 'answer':
				return that.answer();

			case 'addQuestion':
				return that.addQuestion();

			default:
				var result = Q.defer();
				result.reject(new RequestError ('Unknown method ' + method, 4));
				return result.promise;
		}
	})
	.then(function(reply) {
		that.replyOK(reply);
	})
	.fail(function(error) {
		if (error instanceof RequestError) {
			that.replyError(error);
		} else {
			console.error(error.stack);
			that.replyError(new RequestError('Internal error', 5));
		}
	});
};
