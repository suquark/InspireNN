/**
 *  Random number utilities
 */

// return 0 mean unit standard deviation random number
/**
 * the polar form of the Box-Muller transformation
 */
var return_v = false;
var v_val = 0.0;
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

// utility that returns 2d array filled with random numbers (n * d)
function randn2d(n, d, mu, std) {
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


// create random permutation of numbers, in range [0...n-1]
function randperm(n) {
  var i = n,
      j = 0,
      temp;
  var array = [];
  for(var q=0;q<n;q++)array[q]=q;
  while (i--) {
      j = Math.floor(Math.random() * (i+1));
      temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
  return array;
}

function sample(a) {
    return a[randi(0, a.length)];
}

function random_replace(a, v) {
    a[randi(0, a.length)] = v;
}

function sample_from_dist(probs) {
    var p = randf(0, 1.0);
    var cumprob = 0.0;
    for (let i in probs) {
        cumprob += probs[k];
        if (p < cumprob) {
            return k;
        }
    }
    return probs.length - 1;
}

// sample from list lst according to probabilities in list probs
// the two lists are of same size, and probs adds up to 1
function weightedSample(lst, probs) {
    var p = randf(0, 1.0);
    var cumprob = 0.0;
    for (let k in probs) {
        cumprob += probs[k];
        if (p < cumprob) { return lst[k]; }
    }
}


export { randf, randi, randn, randn2d, gaussRandom };
export { sample, sample_from_dist, weightedSample, random_replace, randperm };
