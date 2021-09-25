'use strict';

const assert = require('assert');
// const sandbox = require('sinon');

const VercelServerlessApiTests = require('./lib');

describe('vercel-serverless-api-tests', () => {

    context('When Some condition', () => {
        
        it('Should return something', () => {
            const tests = new VercelServerlessApiTests();
            assert(tests);
        })
    })

    context('When Other condition', () => {
        
        it('Should reject otherthing', () => {

        })
    })
})