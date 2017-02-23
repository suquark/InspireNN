/**
 *  Random number utilities
 */


var return_v = false;
var v_val = 0.0;
/**
 * the polar form of the Box-Muller transformation.
 * @return - 0 mean unit standard deviation random number
 */
function gaussRandom() {
    if (return_v) { 
        return_v = false;
        return v_val; 
    }
    var u = 2 * Math.random() - 1;
    var v = 2 * Math.random() - 1;
    var r = u * u + v * v;
    if (r == 0 || r > 1) return gaussRandom();
    var c = Math.sqrt(-2 * Math.log(r) /r);
    v_val = v * c; // cache this
    return_v = true;
    return u * c;
}

function randf(a, b) { return Math.random() * (b-a) + a; }
function randi(a, b) { return Math.floor(Math.random() * (b-a) + a); }
function randn(mu, std) { return mu + gaussRandom() * std; }


/** 
 * utility that returns 2d array filled with gauss random numbers (n * d)
 * 
 */ 
function randn2d(n, d, mu=0, std=1) {
    var x = [];
    for (let i = 0; i < n; i++) {
        var xhere = [];
        for (let j = 0; j < d; j++) {
            xhere.push(randn(mu, std));
        }
        x.push(xhere);
    }
    return x;
};


/** 
 * create random permutation of numbers, in range [0...n-1]
 * @param { number } n - n of range [0...n-1]
 */
function randperm(n) {
    var array = [];
    for (var q = 0; q < n; q++) array[q] = q;
    shuffle(array);
    return array;
}

/**
 * Fisher-Yates Algorithm. See https://bost.ocks.org/mike/shuffle/compare.html
 * @param { Array } array - array that we will shuffle in place
 */
function shuffle(array) {
    var m = array.length, t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
}

/**
 * randomly pick an item from a given array
 * @param { Array } array - given array
 */
function sample(a) {
    return a[randi(0, a.length)];
}

/**
 * randomly replace an item from a given array
 * @param { Array } a - given array
 * @param { Object } v - given item
 */
function random_replace(a, v) {
    a[randi(0, a.length)] = v;
}

function sample_from_dist(probs) {
    var p = randf(0, 1.0);
    var cumprob = 0.0;
    for (let i in probs) {
        cumprob += probs[k];
        if (p < cumprob) return k;
    }
    return probs.length - 1;
}


// sample from list lst according to probabilities in list probs
// the two lists are of same size, and probs adds up to 1
function weightedSample(lst, probs) {
    return lst[sample_from_dist(probs)];
}


export { randi, randf, randn, randn2d, gaussRandom };
export { sample, sample_from_dist, weightedSample, random_replace };
export { shuffle, randperm };
