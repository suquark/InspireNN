import { get_norm_weights } from 'weights_init.js';
import { zeros } from 'util/array.js';

class Vol {
    constructor(sx, sy, depth, c) {
        // this is how you check if a variable is an array. Oh, Javascript :)
        if(Object.prototype.toString.call(sx) === '[object Array]') {
            this.w = sx.slice(); // copy content
            // we were given a list in sx, assume 1D volume and fill it up
            sx = 1;
            sy = 1;
            depth = this.w.length;
        }
        
        // we were given dimensions of the vol
        this.sx = sx;
        this.sy = sy;
        this.depth = depth;

        this.shape = [this.depth, this.sy, this.sx];
        this.size = this.sx * this.sy * this.depth;
 
        if (typeof this.w === 'undefined') {
            if (typeof c === 'undefined') {
                this.w = get_norm_weights(this.size);
            } else {
                this.w = zeros(this.size).fill(c);
            }
        }

        this.dw = this.zeros_like();  // -- save memory, allocmem at training?
        this.length = this.size;
    }

    get ndim() { return this.shape.length };

    axis(idx) {
        return idx >= 0 ? this.shape[idx] : this.shape[this.ndim + idx]; 
    }

    get(x, y, d) { 
        let ix = ((this.sx * y) + x) * this.depth + d;
        return this.w[ix];
    }
    set(x, y, d, v) { 
        let ix = ((this.sx * y) + x) * this.depth + d;
        this.w[ix] = v;
    }
    add(x, y, d, v) { 
        var ix = ((this.sx * y) + x) * this.depth + d;
        this.w[ix] += v; 
    }
    get_grad(x, y, d) { 
        var ix = ((this.sx * y) + x) * this.depth + d;
        return this.dw[ix]; 
    }
    set_grad(x, y, d, v) { 
        var ix = ((this.sx * y) + x) * this.depth + d;
        this.dw[ix] = v; 
    }
    add_grad(x, y, d, v) { 
        var ix = ((this.sx * y) + x) * this.depth + d;
        this.dw[ix] += v; 
    }

 

    get max() {
        let limit = this.size;
        let amax = this.w[0];
        for (let i = 1; i < limit; i++) {
            if(w[i] > amax) amax = w[i];
        }
        return amax;
    }

    get softmax() {
        let es = zeros(N);
        this.softmax_a(es);
        return es;
    }

    softmax_a(es) {
        let w = this.w;
        let N = this.size;
        // compute max activation
        let amax = this.max;
        // compute exponentials (carefully to not blow up)
        let esum = 0.0;
        for (let i = 0; i < N; i++) {
            let e = Math.exp(w[i] - amax);
            esum += e;
            es[i] = e;
        }
        // normalize and output to sum to one
        for (let i = 0; i < N; i++) es[i] /= esum;
    }

    get max_index() {  
        let limit = this.size;   
        let amax = this.w[0];
        let idx = 0;
        for (let i = 1; i < limit; i++) {
            if (this.w[i] > amax) 
            {
                idx = i;
                amax = this.w[i];
            }
        }
        return idx;
    }

    batchGrad(batch_size) {
        for (let i = 0; i < this.size; i++) {
            this.dw[i] /= batch_size;
        }
    }
    
    cloneAndZero() { return new Vol(this.sx, this.sy, this.depth, 0.0); } 
    clone() {
        var V = new Vol(this.sx, this.sy, this.depth, 0.0);
        var n = this.w.length;
        V.w = this.w.slice();
        return V;
    }
    zeros_like() {
        return zeros(this.size);
    }
    addFrom(V) { for(var k = 0; k < this.w.length; k++) { this.w[k] += V.w[k]; }}
    addFromScaled(V, a) { for(var k = 0; k < this.w.length; k++) { this.w[k] += a * V.w[k]; }}
    setConst(a) { this.w.fill(a); }
    scale(f) {
        for (let i = 0; i < w.length; i++) w[i] *= f; 
    }

    toJSON() {
        // todo: we may want to only save d most significant digits to save space
        var json = {}
        json.sx = this.sx; 
        json.sy = this.sy;
        json.depth = this.depth;
        json.w = this.w;
        return json;
        // we wont back up gradients to save space
    }
    fromJSON(json) {
        this.sx = json.sx;
        this.sy = json.sy;
        this.depth = json.depth;
        var n = this.sx*this.sy*this.depth;
        this.w = zeros(n);
        this.dw = zeros(n);

        if (json.w instanceof Array) {
            // copy over the elements.
            this.w = json.w.slice();
        } else {
            this.w = zeros(json.w.length);
            for (let i in json.w) {
                this.w[i] = json.w[i];
            }
        }
            
        
        this.shape = [this.sx, this.sy, this.depth];
        this.size = this.sx * this.sy * this.depth;
        this.length = this.size;
        // for map function
        return this;
    }
}

class Constant extends Vol {
    constructor(value) {
        super(1, 1, 1, value);
    }
}

function createVector(depth, bias) {
    // bias == undefined will cause initialize
    return new Vol(1, 1, depth, bias);
}

function createMatrix(m, n) {
    // m * n Matrix, m: output, n: input
    let filters = [];
    for (let i = 0; i < m; i++) {
        filters.push(new Vol(1, 1, n));
    }
    return filters;
}

function getVolFromJSON(json) {
    return new Vol(0, 0, 0, 0).fromJSON(json);
}

export { Vol, createVector, createMatrix, getVolFromJSON, Constant };