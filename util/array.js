
/** 
 * Array utilities
 * 
 */

// utilitity that creates contiguous vector of zeros of size n
function zeros(n) {
    if (typeof(n) === 'undefined' || isNaN(n)) { return []; }
    if (typeof ArrayBuffer === 'undefined') {
        // lacking browser support
        return new Array(n).fill(0.);
    } else {
        return new Float32Array(n);  // typed arrays are faster
    }
}

/**
 * utility that returns 2d array filled with 0
 */
function zeros2d(n, d) {
    var x = [];
    for (let i = 0; i < n; i++) {
        x.push(zeros(d));
    }
    return x;
}

/**
 * utility that returns 2d array filled with value s
 */
function array2d(n, d, s) {
    var x = [];
    for (let i = 0; i < n; i++) {
        x.push(zeros(d).fill(s));
    }
    return x;
};

/**
 * Create one-hot array
 * @param { int } n - length of array
 * @param { int } k - array[k] fill value
 * @param { number } value - fill array[k] with value
 */
function one_hot(n, k, value=1) {
    let a = zeros(n);
    a[k] = value;
    return a;
}

function arrContains(arr, elt) {
    return arr.includes(elt);
}

function arrUnique(arr) {
    return [...new Set(arr)];
}

// return max and min of a given non-empty array.
function maxmin(w) {
    if(w.length === 0) { return {}; } // ... ;s
    var maxv = w[0];
    var minv = w[0];
    var maxi = 0;
    var mini = 0;
    var n = w.length;
    for (var i = 1; i < n; i++) {
        if(w[i] > maxv) { maxv = w[i]; maxi = i; } 
        if(w[i] < minv) { minv = w[i]; mini = i; } 
    }
    return {maxi: maxi, maxv: maxv, mini: mini, minv: minv, dv:maxv-minv};
}

function indexOfMax(arr) {
    return reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
}

/**
 *  compute L1 distance between two vectors
 */
function L1(x1, x2) {
    let d = 0;
    let N = x1.length;  // important! length of array not of object!
    for (let i = 0; i < N; i++) {
        d += Math.abs(x1[i] - x2[i]);
    }
    return d;
}

/**
 *  compute L2 square distance between two vectors
 */
function L2(x1, x2) {
    let d = 0;
    let N = x1.length;  // important! length of array not of object!
    for (let i = 0; i < N; i++) {
        let dx = x1[i] - x2[i];
        d += dx * dx;
    }
    return d;
}

/**
 *  compute Euclidean distance between two vectors
 */
function distance(x1, x2) {
    return Math.sqrt(L2(x1, x2));
}

/**
 *  compute adjacent matrix with L2 square distance
 */
function adjMatrixL2(X) {
    // compute L2 pairwise distance in all vectors in X
    let N = X.length;
    let dist = zeros2d(N, N);
    for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
            let d = L2(X[i], X[j]);
            dist[i][j] = dist[j][i] = d;
        }
    }
    return dist;
}

/**
 *  compute adjacent matrix with Euclidean distance
 */
function adjMatrixDistance(X) {
    // compute Euclidean pairwise distance in all vectors in X
    let N = X.length;
    let dist = zeros2d(N, N);
    for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
            let d = distance(X[i], X[j]);
            dist[i][j] = dist[j][i] = d;
        }
    }
    return dist;
}

/**
 *  compute adjacent matrix with Euclidean distance
 */
function adjMatrixDistanceBy(X, attr) {
    // compute Euclidean pairwise distance in all vectors in X
    let N = X.length;
    let dist = zeros2d(N, N);
    for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
            let d = distance(X[i][attr], X[j][attr]);
            dist[i][j] = dist[j][i] = d;
        }
    }
    return dist;
}


/**
 * center points
 */
function centerPoints(arr) {
    let N = arr.length;
    let dim = arr[0].length;

    let mean = zeros(dim);
    for (let i = 0; i < N; i++) {
        for (let d = 0; d < dim; d++) {
            mean[d] += arr[i][d];           
        }
    }

    // reproject to be zero mean
    for (let i = 0; i < N; i++) {
        for (let d = 0; d < dim; d++) {
            arr[i][d] -= mean[d] / N;
        }
    }

}


// create array
export { zeros, zeros2d, array2d, one_hot };
// property of array
export { maxmin, indexOfMax, arrUnique, arrContains };
// geometry
export { L1, L2, distance, adjMatrixL2, adjMatrixDistance, adjMatrixDistanceBy, centerPoints };
