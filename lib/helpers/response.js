'use strict';

module.exports = class Response {

	status(statusCode) {
		this.statusCode = statusCode;
		return this;
	}

	setHeader(header, value) {

		if(!this.headers)
			this.headers = {};

		this.headers[header] = value;
		return this;
	}

	json(value) {
		this.body = value;
		return this;
	}

	send(value) {
		this.body = value;
		return this;
	}
};
