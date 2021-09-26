'use strict';

const assert = require('assert');
const sandbox = require('sinon');

const { handler, API } = require('vercel-serverless-api');

const VercelServerlessApiTests = require('../lib');

describe('Vercel Serverless Api Tests', () => {

	describe('Getters', () => {
		it('Should return Sinon sandbox', () => {

			const { sinon } = VercelServerlessApiTests;

			assert.deepStrictEqual(sinon, sandbox);
		});
	});

	describe('Constructor', () => {

		it('Should throws if the handler is not passed', () => {
			assert.throws(() => new VercelServerlessApiTests());
		});

		it('Should set the handler', () => {

			const apiHanlder = (...args) => handler(API, ...args);

			const ApiTests = new VercelServerlessApiTests(apiHanlder);

			assert.deepStrictEqual(ApiTests.handler, apiHanlder);
		});
	});

	describe('Test Handler', () => {
		class TestAPI extends API {

			validate() {
				if(!this.data) {
					this.setHeader('x-custom', 10);
					return;
				}

				if(this.data && this.data.validate)
					throw new Error();
			}

			process() {

				if(!this.data)
					return;

				if(this.data.rejects)
					throw new Error();

				if(this.data.custom && this.pathIds && this.pathIds.id === 1) {
					this.setCode(202);
					this.setHeader('Content-Type', 'text/html');
					this.setHeader('x-test', 'test');
					this.setBody('<h1>Test</h1>');
				}
			}
		}

		const apiHanlder = (...args) => handler(TestAPI, ...args);

		let ApiTests;

		beforeEach(() => {
			ApiTests = new VercelServerlessApiTests(apiHanlder);
		});

		it('Should not fail when must verify status-code 200 and custom header, if API add a header and not changed status', async () => {
			await ApiTests.testHandler();
		});

		it('Should fail if cannot verify status-code', async () => {
			await assert.rejects(ApiTests.testHandler({ url: 'api/test' }, { status: 201 }));
		});

		it('Should fail if cannot verify header', async () => {
			await assert.rejects(ApiTests.testHandler({ method: 'GET' }, { headers: { 'x-custom': false } }));
		});

		it('Should fail if cannot verify body', async () => {
			await assert.rejects(ApiTests.testHandler({ cookies: { token: '10000' } }, { body: { message: 'Error' } }));
		});

		it('Should verify status-code 400 and verify body, if API rejects in validate', async () => {
			await ApiTests.testHandler({ headers: { client: 'tests' }, body: { validate: true } }, { status: 400 });
		});

		it('Should verify status-code 500, if API rejects in process', async () => {
			await ApiTests.testHandler({ queries: { sort: 'name' }, body: { rejects: true } }, {
				status: 500,
				body: {
					message: ''
				}
			});
		});

		// eslint-disable-next-line max-len
		it('Should verify custom status-code, custom content-type header and body, if API response with a custom status-code and content-type', async () => {
			await ApiTests.testHandler({
				pathIds: { id: 1 },
				body: { custom: true }
			}, {
				status: 202,
				body: '<h1>Test</h1>',
				headers: {
					'Content-Type': 'text/html',
					'x-test': 'test'
				}
			});
		});
	});

	describe('It Block', () => {

		const apiHanlder = (...args) => handler(API, ...args);

		let ApiTests;

		beforeEach(() => {
			ApiTests = new VercelServerlessApiTests(apiHanlder);
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('Should skip tests and not called the it function', async () => {

			sandbox.spy(ApiTests, 'itFunction');

			ApiTests.itTest({
				description: 'Should test',
				skip: true
			});

			sandbox.assert.notCalled(ApiTests.itFunction);
		});

		it('Should execute test without only', async () => {

			ApiTests.itTest({
				description: 'Should test',
				request: { url: 'api/test' },
				response: { status: 200 }
			});
		});

		it('Should execute test', async () => {

			const testFunction = () => { return true; };

			ApiTests.itTest({
				description: 'Should test',
				request: {},
				response: {},
				before: testFunction,
				after: testFunction
			});
		});
	});

	describe('It function', () => {

		const apiHanlder = (...args) => handler(API, ...args);

		let ApiTests;

		beforeEach(() => {
			ApiTests = new VercelServerlessApiTests(apiHanlder);
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('Should execute test without any before or after options', async () => {

			sandbox.stub(ApiTests, 'testHandler');

			await ApiTests.itFunction({ url: 'api/test' }, { status: 200 });

			sandbox.assert.calledOnceWithExactly(ApiTests.testHandler, { url: 'api/test' }, { status: 200 });
		});

		it('Should execute test with before or after options', async () => {

			const options = {
				itBefore: () => true,
				itAfter: () => true
			};

			sandbox.stub(ApiTests, 'testHandler');
			sandbox.spy(options, 'itBefore');
			sandbox.spy(options, 'itAfter');

			await ApiTests.itFunction({ url: 'api/test/1' }, { status: 201 }, options);

			sandbox.assert.calledOnceWithExactly(ApiTests.testHandler, { url: 'api/test/1' }, { status: 201 });
			sandbox.assert.calledOnce(options.itBefore);
			sandbox.assert.calledOnce(options.itAfter);
		});
	});

	describe('Context Block', () => {

		const apiHanlder = (...args) => handler(API, ...args);

		let ApiTests;

		const sampleTest = {
			description: 'Should test',
			request: {},
			response: {}
		};

		beforeEach(() => {
			ApiTests = new VercelServerlessApiTests(apiHanlder);
		});

		afterEach(() => {
			sandbox.restore();
		});

		it('Should skip context and not called any it', async () => {

			sandbox.spy(ApiTests, 'itTest');

			ApiTests.contextTest('When must execute test', [sampleTest], {
				skip: true
			});

			sandbox.assert.notCalled(ApiTests.itTest);
		});

		it('Should execute test without any options', async () => {

			sandbox.stub(ApiTests, 'itTest');

			ApiTests.contextTest('When must execute test without options', [
				sampleTest,
				sampleTest
			]);

			sandbox.assert.calledTwice(ApiTests.itTest);

		});

		it('Should execute test with any before or after options', async () => {

			const options = {
				before: () => { console.log('D'); },
				after: () => {}
			};

			sandbox.stub(ApiTests, 'itTest');

			ApiTests.contextTest('When must execute test with options', [
				sampleTest,
				sampleTest
			], options);

			sandbox.assert.calledTwice(ApiTests.itTest);
		});

		it('Should execute test with beforeEach or afterEach options', async () => {

			const options = {
				beforeEach: () => {},
				afterEach: () => {}
			};
			sandbox.spy(ApiTests, 'itTest');

			ApiTests.contextTest('When must execute test with beforeEach and afterEach', [
				sampleTest,
				sampleTest
			], options);

			sandbox.assert.calledTwice(ApiTests.itTest);
		});
	});
});
