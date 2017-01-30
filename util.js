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


export { getopt, assert, clip, normalize_angle, AvgWindow };

export * from 'util/random.js';
export * from 'util/array.js';
export * from 'util/numeric.js';
