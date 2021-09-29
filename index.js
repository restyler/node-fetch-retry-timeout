const fetch = require('node-fetch');
const AbortController = require('abort-controller');




module.exports = async (url, opts) => {
    let retry = opts && opts.retry !== undefined ? opts.retry : 2
    retry++ // add first request to attemps


    if (opts.retryOnHttpResponse == undefined) {
        opts.retryOnHttpResponse = (response) => { return response.status >= 500 }
    } else {
        if (opts.retryOnHttpResponse === false) {
            opts.retryOnHttpResponse = (response) => { return false }
        } else if (typeof opts.retryOnHttpResponse != 'function') {
            throw new Error(`'retryOnHttpResponse' must be a function: ${opts.retryOnHttpResponse}`);
        }
    }
    

    while (retry > 0) {
        let controller = new AbortController();

        let timeout = setTimeout(() => {
            controller.abort();
        }, opts.timeout || 8000);
        opts.signal = controller.signal
        if (!opts.redirect) opts.redirect = 'manual'
        
        try {
            console.log('$$$$REQ', retry)
            let response = await fetch(url, opts)
            
            if (opts.retryOnHttpResponse(response)) {
                throw new Error('Response code: ' + response.status);
            }
            
            return response
        } catch(e) {
            console.error(e)
            //if (e instanceof fetch.AbortError) {
            //    console.log('request was aborted');
            //}

            if (opts.callback) {
                opts.callback(retry)
            }        
            retry--
            if (retry == 0) {
                console.log('##Ff3#F#')
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