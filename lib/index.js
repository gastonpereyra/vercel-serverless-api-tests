'use strict';

const sinon = require('sinon');
const assert = require('assert');

const Response = require('./helpers/response');

/**
 * The Request Data
 * @typedef {Object} Request
 * @property {string} url The relative endpoint
 * @property {string} method The REST Method
 * @property {object} cookies The Cookies
 * @property {object} headers The Headers
 * @property {object} queries The Queries
 * @property {object} pathIds The Path Ids
 * @property {object} body The Body request
 */

/**
 * The Response Data
 * @typedef {Object} Response
 * @property {number} status The status code, 200 by Default
 * @property {object} headers The Headers
 * @property {object} body The Body response
 */

/**
 * Options for IT Blocks
 * @typedef {Object} ItOptions
 * @property {function} itBefore A functions to execute before the handler
 * @property {function} itAfter A functions to execute after the handler
 */

/**
 * Properties for IT Function
 * @typedef {Object} ItProperties
 * @property {string} description IT description
 * @property {boolean} only If must execute only this IT
 * @property {boolean} skip If must skip this IT
 * @property {Request} request
 * @property {Response} response
 * @property {function} before A functions to execute before the handler
 * @property {function} after A functions to execute after the handler
 */

/**
 * Options for Context Blocks
 * @typedef {Object} ContextOptions
 * @property {boolean} only If must execute only this context
 * @property {boolean} skip If must skip this context
 * @property {function} before A functions to execute before every IT block
 * @property {function} beforeEach A functions to execute before each IT block
 * @property {function} after A functions to execute after every IT block
 * @property {function} afterEach A functions to execute after each IT block
 */
module.exports = class VercelServerlessApiTests {

	static get sinon() {
		return sinon;
	}

	constructor(handler) {

		if(!handler)
			throw new Error('API Tests needs a handler');

		this.handler = handler;
	}

	/**
     * Execute a list of test under a Context block
     * @param {string} contextTitle The context title description. Must begin with "When.."
     * @param {ItProperties[]} tests The list of tests
     * @param {ContextOptions} options
     */
	contextTest(contextTitle, tests, {
		skip,
		only,
		...options
	} = {}) {

		if(skip)
			return;

		/* istanbul ignore next */
		if(only)
			context.only(contextTitle, () => this.contextFunction(tests, options));
		else
			context(contextTitle, () => this.contextFunction(tests, options));
	}

	/**
     * The function for a Context Block
     * @param {ItProperties[]} tests The list of tests
     * @param {ContextOptions} options
     */
	contextFunction(tests, {
		before: optionsBefore,
		after: optionsAfter,
		beforeEach: optionsBeforerEach,
		afterEach: optionsAfterEach
	}) {

		/* istanbul ignore next */
		before(() => {
			if(optionsBefore)
				optionsBefore();
		});

		/* istanbul ignore next */
		beforeEach(() => {
			if(optionsBeforerEach)
				optionsBeforerEach();
		});

		/* istanbul ignore next */
		afterEach(() => {
			if(optionsAfterEach)
				optionsAfterEach();

			sinon.restore();
		});

		/* istanbul ignore next */
		after(() => {
			if(optionsAfter)
				optionsAfter();
		});

		tests.map(test => this.itTest(test));
	}

	/**
     * Execute an IT Block
     * @param {ItProperties} properties
     */
	itTest({
		description,
		only: itOnly,
		skip: itSkip,
		request,
		response,
		before: itBefore,
		after: itAfter
	}) {

		if(itSkip)
			return;

		const options = {
			...itBefore && { itBefore },
			...itAfter && { itAfter }
		};

		/* istanbul ignore next */
		if(itOnly)
			it.only(description, async () => this.itFunction(request, response, options));

		else
			it(description, async () => this.itFunction(request, response, options));
	}

	/**
     * The function to be executed in an IT block
     * @async
     * @param {Request} request
     * @param {Response} response
     * @param {ItOptions} options
     */
	async itFunction(request, response, { itBefore, itAfter } = {}) {

		if(itBefore)
			await itBefore(sinon);

		await this.testHandler(request, response);

		if(itAfter)
			await itAfter(sinon);
	}

	/**
     * Execute handler with the request object and checks if response is correct
     * @async
     * @param {Request} request
     * @param {Response} expectedResponse
     */
	async testHandler({
		url,
		method,
		headers: requestHeaders,
		pathIds,
		queries,
		cookies,
		body: requestBody
	} = {}, {
		status = 200,
		body: responseBody,
		headers: responseHeaders
	} = {}) {

		const response = new Response();

		await this.handler({
			...url && { url },
			...method && { method },
			...requestHeaders && { headers: requestHeaders },
			...cookies && { cookies },
			...requestBody && { body: requestBody },
			...(queries || pathIds) && {
				query: {
					...queries,
					...pathIds && this.transformPathIds(pathIds)
				}
			}
		}, response);

		assert.deepStrictEqual({ statusCode: status }, { statusCode: response.statusCode });

		if(responseHeaders)
			assert.deepStrictEqual({ headers: responseHeaders }, { headers: response.headers });

		if(responseBody)
			assert.deepStrictEqual({ body: responseBody }, { body: response.body });
	}

	/**
     * Transform path-ids into query-format
     * @param {object} pathIds The object with path ids
     * @returns {object} the ids in query-format
     */
	transformPathIds(pathIds) {
		return Object.entries(pathIds).reduce((pathQueries, [id, value]) => {
			pathQueries[`pathIds.${id}`] = value;
			return pathQueries;
		}, {});
	}
};
