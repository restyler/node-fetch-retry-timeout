# Yet Another node-fetch-retry-timeout (YANFRT)

Minimalistic drop-in replacement for node-fetch. Created because other alternatives were not good for me (and believe me: I really tried hard to avoid creating yet another node-fetch extra feature package).

## Notable differences from default node-fetch behaviour:
1. Default redirect strategy is 'manual' so we get 30x redirects as responses
2. Response timeout is 20s
3. Will consider each 50x response as a bad one and will retry (pass `retryOnHttpResponse: false` to disable)

## Why, god, why?
Major differences from https://www.npmjs.com/package/@adobe/node-fetch-retry:
1. In YANFRT, Retries are configured by amount of attempts and not by total allowed duration of request (more convenient when request latency is fluctuating between 1 and 20 seconds like in most of my use cases)
2. One simple retry strategy: just amount of attempts and delay between requests
3. No Apache OpenWhisk and no other fat

Differences compared to https://www.npmjs.com/package/fetch-retry :
1. YANFRT is based on node-fetch
2. More flexible retry on http response codes (not an array of codes but a callback so you can do `(response.status >= 400 && response.status <= 600) || response.status == 302`

Differences compared to https://www.npmjs.com/package/node-fetch-retry :
1. YANFRT has timeouts handling based on AbortController
1. Can retry based on http response statuses

## Unique feature
Since version 1.2 YANFRT supports changing opts of request on each retry (via `beforeRetry` optional callback). This allows switching broken proxies. 
See /test/ folder ("can change agent on retry" test)

## Installation
`npm i node-fetch-retry-timeout`

## Example
```js
  const fetch = require('node-fetch-retry-timeout')
  let response = await fetch('https://google.com', {
    method: 'GET', 
    retry: 2, // number attempts to retry
    pause: 500, // pause between requests (ms)
    timeout: 5000,  // timeout PER 1 REQUEST (ms)
    retryOnHttpResponse: r => r.status >= 500, // this is the default implementation of retryOnHttpResponse, pass false to disable
    beforeRetry: (retryNum, error) => { // switch opts on retry (retryNum == 1 before first retry is initiated, check the existence of error.response for advanced logic)
      return { headers: { 'Switch header': 'header-value' }, agent: SomeRandomAgent }
    }
  })
```

## Running tests
`npm run test`
