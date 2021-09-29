# Yet Another node-fetch-retry-timeout (YANFRT)

Minimalistic drop-in replacement for node-fetch. Created because other alternatives were not good for me (and believe me: I really tried hard to avoid creating yet another node-fetch replacement).

## Why, god, why?
Major differences from https://www.npmjs.com/package/@adobe/node-fetch-retry:
1. In YANFRT, Retries are configured by amount of attempts and not on total duration of request (more convenient when request latency is fluctuating between 1 and 20 seconds)
2. One simple retry strategy: just amount of attempts and delay between requests
3. No Apache OpenWhisk and no other fat

Differences compared to https://www.npmjs.com/package/fetch-retry :
1. YANFRT is based on node-fetch
2. More flexible retry on http response codes (not an array of codes but a callback so you can do `(response.status >= 400 && response.status <= 600) || response.status == 302`

Differences compared to https://www.npmjs.com/package/node-fetch-retry :
1. YANFRT has timeouts handling based on AbortController
1. Can retry based on http response statuses


## Example
```js
  const response = await fetch(`${FAKE_BASE_URL}${FAKE_PATH}`, { method: 'GET', retry: 2, timeout: 2000, retryOnHttpResponse: (r) => { r.status >= 500 } })
```

## Running tests
`npm run test`
