import { randn } from 'convnet_utils';

class Vol {
    constructor(sx, sy, depth, c) {
        // this is how you check if a variable is an array. Oh, Javascript :)
        if(Object.prototype.toString.call(sx) === '[object Array]') {
            var arr = sx;
            // we were given a list in sx, assume 1D volume and fill it up
            sx = 1;
            sy = 1;
            depth = arr.length;
        }
        
        // we were given dimensions of the vol
        this.sx = sx;
        this.sy = sy;
        this.depth = depth;
        let n = this.sx * this.sy * this.depth;
        this.dw = new Array(w.length).fill(0.);

        if (Object.prototype.toString.call(sx) === '[object Array]') {
            this.w = arr.slice(); // copy content
        } else {
            if(typeof c === 'undefined') {
                // weight normalization is done to equalize the output
                // variance of every neuron, otherwise neurons with a lot
                // of incoming connections have outputs of larger variance
                let scale = Math.sqrt(1.0 / (sx*sy*depth));
                this.w = new Array(n).fill(0.);
                for (let i = 0; i < n; i++) this.w[i] = randn(0.0, scale);
            } else {
                this.w = new Array(n).fill(c);
            }
        }

        this.length = w.length;
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
    max(limit=V.w.length) {
        if (limit === V.w.length) 
            return Math.max.apply(Math, V.w);
            
        var amax = V.w[0];
        for(let i = 1; i < limit; i++) {
            if(as[i] > amax) amax = as[i];
        }
        return amax;
    }
    cloneAndZero() { return new Vol(this.sx, this.sy, this.depth, 0.0); } 
    clone() {
        var V = new Vol(this.sx, this.sy, this.depth, 0.0);
        var n = this.w.length;
        V.w = this.w.slice();
        return V;
    }
    zeros_like() {
        return new Array(w.length).fill(0.);
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
        this.w = global.zeros(n);
        this.dw = global.zeros(n);
        // copy over the elements.
        this.w[i] = json.w.slice();
        this.length = w.length;
        // for map function
        return this;
    }
}

export { Vol };