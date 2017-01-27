
// Random number utilities
var return_v = false;
var v_val = 0.0;
function gaussRandom() {
    if (return_v) { 
        return_v = false;
        return v_val; 
    }
    var u = 2 * Math.random()-1;
    var v = 2 * Math.random()-1;
    var r = u*u + v*v;
    if(r == 0 || r > 1) return gaussRandom();
    var c = Math.sqrt(-2*Math.log(r)/r);
    v_val = v * c; // cache this
    return_v = true;
    return u*c;
}

function randf(a, b) { return Math.random()*(b-a)+a; }
function randi(a, b) { return Math.floor(Math.random()*(b-a)+a); }
function randn(mu, std) { return mu+gaussRandom()*std; }

// Array utilities
function zeros(n) {
    if (typeof(n) === 'undefined' || isNaN(n)) { return []; }
    return new Array(n).fill(0.);
}

function arrContains(arr, elt) {
    return arr.includes(elt);
}

function arrUnique(arr) {
    return [...new Set(arr)];
}

// return max and min of a given non-empty array.
var maxmin = function(w) {
    if(w.length === 0) { return {}; } // ... ;s
    var maxv = w[0];
    var minv = w[0];
    var maxi = 0;
    var mini = 0;
    var n = w.length;
    for(var i=1;i<n;i++) {
      if(w[i] > maxv) { maxv = w[i]; maxi = i; } 
      if(w[i] < minv) { minv = w[i]; mini = i; } 
    }
    return {maxi: maxi, maxv: maxv, mini: mini, minv: minv, dv:maxv-minv};
}

// create random permutation of numbers, in range [0...n-1]
var randperm = function(n) {
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
var weightedSample = function(lst, probs) {
  var p = randf(0, 1.0);
  var cumprob = 0.0;
  for(var k=0,n=lst.length;k<n;k++) {
    cumprob += probs[k];
    if(p < cumprob) { return lst[k]; }
  }
}

// syntactic sugar function for getting default parameter values
function getopt(opt, field_name, default_value) {
  if(typeof field_name === 'string') {
    // case of single string
    return (typeof opt[field_name] !== 'undefined') ? opt[field_name] : default_value;
  } else {
    // assume we are given a list of string instead
    var ret = default_value;
    for(var i=0;i<field_name.length;i++) {
      var f = field_name[i];
      if (typeof opt[f] !== 'undefined') {
        ret = opt[f]; // overwrite return value
      }
    }
    return ret;
  }
}

function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}

function one_hot(n, k, value=1) {
    let a = new Array(n).fill(0);
    a[k] = value;
    return a;
}

function indexOfMax(arr) {
    return reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
}

function clip(ori, floor, ceil) {
    let v = ori;
    if (v < floor) v = floor;
    if (v > ceil) v = ceil;
    return v;
}

function normalize_angle(angle) {
    let nangle = angle % (Math.PI * 2);
    if (nangle < 0) nangle += 2 * Math.PI;
    return nangle;
}

class AvgWindow {
    // a window stores _size_ number of values
    // and returns averages. Useful for keeping running
    // track of validation or training accuracy during SGD
    constructor(size, minsize) {
        this.v = [];
        this.size = typeof(size)==='undefined' ? 100 : size;
        this.minsize = typeof(minsize)==='undefined' ? 20 : minsize;
        this.sum = 0;
    }
    add(x) {
        this.v.push(x);
        this.sum += x;
        if(this.v.length>this.size) {
            var xold = this.v.shift();
            this.sum -= xold;
        }
    }
    get_average() {
        if(this.v.length < this.minsize) return -1;
        else return this.sum/this.v.length;
    }
    reset(x) {
        this.v = [];
        this.sum = 0;
    }
}


export {
    randf, randi, randn, 
    zeros, maxmin, randperm, arrUnique, arrContains, 
    getopt, assert,
    indexOfMax, weightedSample, sample_from_dist, random_replace, sample,
    one_hot, clip, normalize_angle, AvgWindow
};