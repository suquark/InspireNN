function numeric_bsearch_decent(f, init, target, eps, max_tries=50) {
    /**
     * f(x) goes down with x goes up...
     */
    let bottom = -Infinity;
    let upper = Infinity;
    let x = init;
    for (let epoch = 1; ; epoch++) {
        let y = f(x);
        // adjust beta based on result
        if (y > target) {
            // f(x) too big, x is too small
            bottom = x; // move up the bounds
            if (upper === Infinity) x *= 2; 
            else { x = (x + upper) / 2; }
        } else {
            // f(x) too small, x is too big
            upper = x;
            if (bottom === -Infinity) x /= 2; 
            else { x = (x + bottom) / 2; }
        }
        // stopping conditions: too many tries or got a good precision
        if (Math.abs(y - target) < eps || epoch >= max_tries) return x;
    }
}

function numeric_bsearch(f, init, target, eps, max_tries=50) {
    /**
     * f(x) goes up with x goes up...
     */
    let bottom = -Infinity;
    let upper = Infinity;
    let x = init;
    for (let epoch = 1; ; epoch++) {
        let y = f(x);
        // adjust beta based on result
        if (y < target) {
            // f(x) too small, x is too small
            bottom = x; // move up the bounds
            if (upper === Infinity) x *= 2; 
            else { x = (x + upper) / 2; }
        } else {
            // f(x) too big, x is too big
            upper = x;
            if (bottom === -Infinity) x /= 2; 
            else { x = (x + bottom) / 2; }
        }
        // stopping conditions: too many tries or got a good precision
        if (Math.abs(y - target) < eps || epoch >= max_tries) return x;
    }
}

export { numeric_bsearch, numeric_bsearch_decent };
