# node-fetch-retry-timeout

Minimalistic drop-in replacement for node-fetch. Created because other alternatives were not good for me.

Major differences from https://www.npmjs.com/package/@adobe/node-fetch-retry:
1. Retries are configured by amount of attempts and not on total duration of request (more convenient when request latency is fluctuating between 1 and 20 seconds)
2. One simple retry strategy: just amount of attempts and delay between requests
3. No Apache OpenWhisk and no other fat
4. Uses simple AbortController based timeouts

Differences compared to https://www.npmjs.com/package/fetch-retry :
1. Based on node-fetch
2. More flexible retry on http response codes (not an array of codes but a callback so you can do `(response.status >= 400 && response.status <= 600) || response.status == 302`

Differences compared to https://www.npmjs.com/package/node-fetch-retry :
1. Can retry based on on http response statuses
