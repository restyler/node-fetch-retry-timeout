/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

/* eslint-env mocha */
/* eslint mocha/no-mocha-arrows: "off" */


const nock = require('nock');
const assert = require('assert');
const fetch = require('../index');

// for tests requiring socket control
const http = require('http');
const getPort = require('get-port');

const ProxyAgent = require('proxy-agent');

const FAKE_BASE_URL = 'https://fakeurl.com';
const FAKE_PATH = '/image/test.png';


describe('test fetch retry', () => {
    afterEach(() => {
        assert(nock.isDone);
        nock.cleanAll();
    });

    it('test fetch get works 200', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .reply(200, { ok: true });
        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, { method: 'GET' });
        assert.strictEqual(response.ok, true);
    });

    it('test fetch get works 200 with custom headers (basic auth)', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .matchHeader('Authorization', 'Basic thisShouldBeAnAuthHeader')
            .reply(200, { ok: true });

        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`,
            { 
                method: 'GET', 
                headers: { Authorization: 'Basic thisShouldBeAnAuthHeader' } 
            }
        );
        assert.strictEqual(response.ok, true);
    });

    it('test fetch get works 200 with custom headers (bearer token)', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .matchHeader('Authorization', 'Bearer thisShouldBeAToken')
            .reply(200, { ok: true });

        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`,
            { 
                method: 'GET', 
                headers: { Authorization: 'Bearer thisShouldBeAToken' } 
            }
        );
        assert.strictEqual(response.ok, true);
    });

    it('test fetch get works 202', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .reply(202, { ok: true });
        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, { method: 'GET' });
        assert.strictEqual(response.ok, true);
    });

    it('test fetch put works 200', async () => {
        nock(FAKE_BASE_URL)
            .put(FAKE_PATH, 'hello')
            .reply(200, { ok: true });
        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, { method: 'PUT', body: 'hello' });
        assert.strictEqual(response.ok, true);
    });

    it('test fetch put works 202', async () => {
        nock(FAKE_BASE_URL)
            .put(FAKE_PATH, 'hello')
            .reply(202, { ok: true });
        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, { method: 'PUT', body: 'hello' });
        assert.strictEqual(response.ok, true);
    });

    it('test fetch stops on 401 with custom headers (basic auth)', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .matchHeader('Authorization', 'Basic thisShouldBeAnAuthHeader')
            .reply(401, { ok: false });

        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`,
            { 
                method: 'GET', 
                headers: { Authorization: 'Basic thisShouldBeAnAuthHeader' } 
            }
        );
        assert.strictEqual(response.ok, false);
    });

    it('test disable retry', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .reply(500);
        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, { method: 'GET', retry: 0, retryOnHttpResponse: false });
        assert.strictEqual(response.statusText, 'Internal Server Error');
    });

    it('test get retry with default settings 500 then 200', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .twice()
            .reply(500);
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .reply(200, { ok: true });
        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, { method: 'GET' });
        assert(nock.isDone());
        assert(response.ok);
        assert.strictEqual(response.statusText, 'OK');
        assert.strictEqual(response.status, 200);
    });

    it('test get retry with default settings 500 then 200 with auth headers set', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .matchHeader('Authorization', 'Basic thisShouldBeAnAuthHeader')
            .twice()
            .reply(500);
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .matchHeader('Authorization', 'Basic thisShouldBeAnAuthHeader')
            .reply(200, { ok: true });
        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, 
            { 
                method: 'GET', headers: { Authorization: 'Basic thisShouldBeAnAuthHeader' }  
            });
        assert(nock.isDone());
        assert(response.ok);
        assert.strictEqual(response.statusText, 'OK');
        assert.strictEqual(response.status, 200);
    });

    it('test retry with default settings 400', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .reply(400);
        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, { method: 'GET' });
        assert(nock.isDone());
        assert(!response.ok);
        assert.strictEqual(response.statusText, 'Bad Request');
        assert.strictEqual(response.status, 400);
    });

    it('test retry with default settings 404', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .reply(404);
        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, { method: 'GET' });
        assert(nock.isDone());
        assert(!response.ok);
        assert.strictEqual(response.statusText, 'Not Found');
        assert.strictEqual(response.status, 404);
    });

    it('test retry with default settings 300', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .reply(300);
        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, { method: 'GET' });
        assert(nock.isDone());
        assert(!response.ok);
        assert.strictEqual(response.statusText, 'Multiple Choices');
        assert.strictEqual(response.status, 300);
    });

    it('test retry with error 3 times 503', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .thrice()
            .replyWithError({
                message: 'something awful happened',
                code: '503',
            });
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .reply(200, { ok: true });
        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, { method: 'GET', retry: 3, retryOnHttpResponse: (r) => { r.status >= 500 } });
        assert(nock.isDone());
        assert.strictEqual(response.statusText, 'OK');
        assert.strictEqual(response.status, 200);
    });

    it('test retry timeout 503', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .twice()
            .delay(5000)
            .replyWithError({
                message: 'something awful happened',
                code: '503',
            });
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .reply(200, { ok: true });
        const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, { 
            method: 'GET', 
            retry: 2, 
            timeout: 2000, 
            retryOnHttpResponse: r => r.status >= 500
        });
        assert(nock.isDone());
        assert.strictEqual(response.statusText, 'OK');
        assert.strictEqual(response.status, 200);
    }).timeout(15000);


    it('test retry timeout on error 503', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .thrice()
            .replyWithError({
                message: 'something awful happened',
                code: '503',
            });
        try {
            await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, { method: 'GET', retry: 2 });
        } catch (e) {
            assert(nock.isDone());
            assert.strictEqual(e.message, 'request to https://fakeurl.com/image/test.png failed, reason: something awful happened');
            assert.strictEqual(e.code, '503');
        }
    });

    it("verifies handling of socket timeout when socket times out (after first failure)", async () => {
        const socketTimeout = 500;

        console.log("!! Test http server ----------");
        // The test needs to be able to control the server socket
        // (which nock or whatever-http-mock can't).
        // So here we are, creating a dummy very simple http server.

        const hostname = "127.0.0.1";
        const port = await getPort({ port: 8000 });

        const waiting = socketTimeout * 10; // time to wait for requests > 0
        let requestCounter = 0;
        const server = http.createServer((req, res) => {
            if (requestCounter === 0) { // let first request fail
                requestCounter++;
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Fail \n');
            } else {
                setTimeout(function () {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end('Worked! \n');
                }, waiting);
            }
        });

        server.listen(port, hostname, () => {
            console.log(`Dummy HTTP Test server running at http://${hostname}:${port}/`);
        });

        try {
            await fetch(`http://${hostname}:${port}`, { method: 'GET', retry: 2, timeout: 1000 });
            assert.fail("Should have timed out!");
        } catch (e) {
            console.log(e);
            assert(e.message.includes("The user aborted a request"));
        } finally {
            server.close();
        }
    }).timeout(15000);


    it('can change header on retry', async () => {
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .matchHeader('Random-Header', 'first-try')
            .replyWithError({ // this throws FetchError
                message: 'something awful happened',
                code: '503',
            });
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .matchHeader('Random-Header', 'second-try')
            .reply(503, { // this throws HTTPResponseError
                message: 'something awful happened'
            });
        nock(FAKE_BASE_URL)
            .get(FAKE_PATH)
            .matchHeader('Random-Header', 'third-try')
            .reply(200, { ok: true });


        let firstStatus, secondStatus
        let response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, { 
            method: 'GET', 
            retry: 2, 
            headers: { 'Random-header': 'first-try' },
            beforeRetry: (retryNum, error) => {
                console.log('BEFORE RETRY CALLBACK RUN!', retryNum, error.response ? error.response.status : '-')
                if (retryNum == 1) {
                    // for FetchError, there is no response property.
                    // but it exists for HTTPResponseError of node-fetch-retry-timeout
                    console.log('error.name #1:', error.name)
                    firstStatus = error.response ? error.response.status : error.errno

                    return { headers: { 'Random-header': 'second-try'} }
                }

                if (retryNum == 2) {
                    // for FetchError, there is no response property.
                    // but it exists for HTTPResponseError of node-fetch-retry-timeout
                    console.log('error.name #2:', error.name)
                    secondStatus = error.response ? error.response.status : error.errno
                    return { headers: { 'Random-header': 'third-try'} }
                }
                
                
            }
        });

        assert(nock.isDone());
        assert.equal(firstStatus, 503);
        assert.equal(secondStatus, 503);
        assert.strictEqual(response.status, 200);

    });


    it('can change agent on retry', async () => {
        const hostname = "127.0.0.1";
        const port = await getPort({ port: 8000 });

        const waiting = 100; // time to wait for requests > 0
        //let requestCounter = 0;
        const server = http.createServer((req, res) => {
            setTimeout(function () {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Worked! \n');
            }, waiting);
 
        });

        server.listen(port, hostname, () => {
            console.log(`Dummy HTTP Test server running at http://${hostname}:${port}/`);
        });
        
        const proxyPort = await getPort({ port: 8000 });
        let brokenProxyAgent = new ProxyAgent(`https://127.0.0.1:${proxyPort}`)


        const retryCb = (retryNum, e) => {
            // only one retry should be done
            assert.strictEqual(retryNum, 1)
            return {
                agent: http.globalAgent
            }
        }
        let response = await fetch(`http://${hostname}:${port}`, { 
            method: 'GET', 
            retry: 2, 
            timeout: 1000, 
            agent: brokenProxyAgent,
            beforeRetry: retryCb
        });
        assert.strictEqual(response.status, 200)

        server.close();

    });

});