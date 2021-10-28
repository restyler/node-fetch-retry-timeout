const fetch = require('node-fetch');
const AbortController = require('abort-controller');


class HTTPResponseError extends Error {
	constructor(response, ...args) {
		super(`HTTP Error Response: ${response.status} ${response.statusText}`, ...args);
		this.response = response;
	}
}

module.exports = async (url, opts) => {
    let retriesLeft = opts && opts.retry !== undefined ? opts.retry : 2
    let attemptsNum = ++retriesLeft // add first request to attemps


    if (opts.retryOnHttpResponse == undefined) {
        opts.retryOnHttpResponse = response => response.status >= 500
    } else {
        if (opts.retryOnHttpResponse === false) {
            opts.retryOnHttpResponse = response => false
        } else if (typeof opts.retryOnHttpResponse != 'function') {
            throw new Error(`'retryOnHttpResponse' must be a function: ${opts.retryOnHttpResponse}`);
        }
    }

    if (opts.beforeRetry != undefined && typeof opts.beforeRetry != 'function') {
        throw new Error(`'beforeRetry' must be a function: ${opts.beforeRetry}`);
    }
    

    while (retriesLeft > 0) {
        let controller = new AbortController();

        let timeout = setTimeout(() => {
            controller.abort();
        }, opts.timeout || 20000);
        opts.signal = controller.signal
        if (!opts.redirect) opts.redirect = 'manual'
        
        let response = null
        try {
            response = await fetch(url, opts)
            
            if (opts.retryOnHttpResponse(response)) {
                throw new HTTPResponseError(response);
            }
            
            return response
        } catch(e) {
            if (!opts.silent) console.error(e)
            
            retriesLeft--
            

            if (opts.beforeRetry) {
               
               let newOpts = opts.beforeRetry(attemptsNum-retriesLeft, e)
               if (newOpts) {
                   //console.log('opts override via beforeRetry', newOpts)
                   opts = { ...opts, ...newOpts }
               }
            }
            
            if (retriesLeft == 0) {
                throw e
            }
            

            if (opts.pause) {
                if (!opts.silent) console.log("pausing..");
                await sleep(opts.pause);
                if (!opts.silent) console.log("done pausing...");
            }
        } finally {
            clearTimeout(timeout);
        }
    }
};


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
