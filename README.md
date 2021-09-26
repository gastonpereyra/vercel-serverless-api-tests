# Vercel Serverless API Tests

## Code Quality Status
![Build Status](https://github.com/gastonpereyra/vercel-serverless-api-tests/workflows/Build%20Status/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/gastonpereyra/vercel-serverless-api-tests/badge.svg?branch=master)](https://coveralls.io/github/gastonpereyra/vercel-serverless-api-tests?branch=master)

![vercel-serverless-api-tests Banner](https://user-images.githubusercontent.com/39351850/134091893-712c5542-7d7c-4c51-8fba-3dd2ae1a8247.png)

## Description
A Helper to make tests with vercel-serverless-api package

## Installation

```
npm i vercel-serverless-tests --save-dev
```

## Sinon
The package offers Sinon to help you to realize the tests

```js

const { sinon } = require('vercel-serverless-tests');
```

## Tests

The package has 3 levels to help you:

- Handler
- It
- Context

### Handler
In order to make easier test the Handler, offers the `testHandler` function, this has a response dummy.

- `testHandler(request, response)`
    - `request`
        - `url` _optional_ | string
        - `method` _optional_ | string
        - `cookies` _optional_ | object
        - `headers` _optional_ | object
        - `queries` _optional_ | object
        - `pathIds` _optional_ | object
        - `body` _optional_ | object
    - `response`
        - `status` _optional_ | default: 200
        - `headers` _optional_ | object
        - `body` _optional_ | any

```js
const VercelServerlessApiTests = require('vercel-serverless-tests');

const handler = require('../../api/test/get');

const ApiTest = new VercelServerlessApiTests(handler);

describe('Test API', () => {
    context('When try the It Block', () => {
        it('Should return status code 200 with message body and x-custom header', async () => {

            await ApiTest.testHandler({
                url: 'api/test/10',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                pathIds: { id: 10 },
                body: { message: 'Try it!' }
            },{
                status: 201,
                headers: { 'x-custom': true },
                body: { message: 'Got It!' }
            });
        });
    });
});

```

### It

In order to try to make a Standard, an easy way to make an It block.

- `itTest(properties)`
    - `properties`
        - `description` _optional_ | string | It description
		- `only` _optional_ | boolean | If you want to execute this only tests
		- `skip` _optional_ | string | If you want to skip the tests
		- `request` _optional_ | object | Request - Same as before
		- `response` _optional_ | object | Response - Same as before
		- `before` _optional_ | function | If want to do something before to trigger the handler
		- `after` _optional_ | function |  If want to do something after to trigger the handler

```js
const { sinon, ...VercelServerlessApiTests} = require('vercel-serverless-tests');

const handler = require('../../api/test/get');
const Model = require('../../models/test);

const ApiTest = new VercelServerlessApiTests(handler);

describe('Test API', () => {
    context('When try the It Block', () => {
        ApiTest.itTest({
            description: 'Should return status code 200 with message body and x-custom header',
            only: true,
            request: {
                url: 'api/test/10',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                pathIds: { id: 10 },
                body: { message: 'Try it!' }
            },
            response: {
                status: 201,
                headers: { 'x-custom': true },
                body: { message: 'Got It!' }
            },
            before: () => {
                sinon.stub(Model.prototype, 'get').resolves([]);
            },
            after: () => {
                sinon.assert.calledOnce(Model.prototype.get);
            }
        });
    });
});
```

### Context

To make multiple It blocks under a context

- `contextTest(description, tests, options)`
    - `description` _required_ | string | Context descriptition
    - `tests` _required_ | Array of `properties` (See [It](#It))
    - `options` _optional_
        - `skip` _optional_ | boolean | For skip whole context
        - `only` _optional_ | boolean | For execute only this context
        - `before` _optional_ | function | Do somenthing before every tests
        - `beforeEach` _optional_ | function | Do somenthing before each tests
        - `after` _optional_ | function | Do somenthing after every tests
        - `afterEach` _optional_ | function | Do somenthing after each tests

```js
const { sinon, ...VercelServerlessApiTests} = require('vercel-serverless-tests');

const handler = require('../../api/test/get');
const Model = require('../../models/test);

const ApiTest = new VercelServerlessApiTests(handler);

describe('Test API', () => {
    ApiTest.contextTest('When try the It Block', [
        {
            description: 'Should return status code 200 with message body and x-custom header',
            request: {
                url: 'api/test/10',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                pathIds: { id: 10 },
                body: { message: 'Try it!' }
            },
            response: {
                status: 201,
                headers: { 'x-custom': true },
                body: { message: 'Got It!' }
            },
            before: () => {
                sinon.stub(Model.prototype, 'get').resolves([]);
            },
            after: () => {
                sinon.assert.calledOnce(Model.prototype.get);
            }
        }
    ], {
        only: true,
        before: () => {
            process.env.Secret = '100000';
        },
        beforeEach: () => {
            sinon.stub(Model.prototype, 'save');
        },
        afterEach: () => {
            sinon.assert.notCalled(Model.prototype, 'save');
        },
        after: () => {
            process.env.Secret = undefined;
        }
    });
```

## Bug :bug:

[Report Here](https://github.com/gastonpereyra/vercel-serverless-api-tests/issues/new?assignees=gastonpereyra&labels=bug&template=bug.md&title=[BUG])

## Idea :bulb:

[Tell me](https://github.com/gastonpereyra/vercel-serverless-api-tests/issues/new?assignees=gastonpereyra&labels=enhancement&title=%5BIDEA%5D+-)
