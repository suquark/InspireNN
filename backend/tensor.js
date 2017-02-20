import { assert, checkClass, isArray } from 'util/assert.js';
import { zeros } from 'util/array.js';

class Tensor {
    constructor(shape=[null], rawdata=undefined) {
        this._shape = shape;
        this._size = 1;
        let vacant = -1;
        for (let i in this._shape) {
            let n = this._shape[i];
            if (typeof n !== 'number') {
                assert(vacant <= 0, 'A tensor can have at most 1 dim of arbitary length.');
                vacant = i;
            } else {
                assert(n > 0, 'Length of a specified dim should be positive.');                
                assert(Math.floor(n) == n, 'Length of a specified dim should be an interger.');
                this._size *= n;
            }
        }

        if (typeof rawdata !== 'undefined') {
            assert(isArray(rawdata), 'Input should be Array type.');
            assert(rawdata.length > 0, 'Input should be Array of positive length.');
        }

        if (vacant > 0) {
            assert(typeof rawdata !== 'undefined', 'need input to fulfill dims.');
            // fulfill
            assert(rawdata.length % this._size == 0, 'Fail to fit data into the shape: cannot be divide.');
            this._shape[vacant] = rawdata.length / this._size;
            this._size = rawdata.length;
        } else {
            if (typeof rawdata !== 'undefined') {
                assert(rawdata.length === this._size, 'Fail to fit data into the shape: size not equal.');
            }
        }

        // turn into native
        this._data = new ArrayBuffer(this._size * 4);
        this.w = new Float32Array(this._data);
        // TODO: not very efficient as of copy
        if (typeof rawdata !== 'undefined') {
            for (let i = 0; i < this._size; i++) {
                this.w[i] = rawdata[i];
            }
        }
    }

    get ndim() {
        return this._shape.length;
    }

    get shape() {
        return this._shape;
    }

    get size() {
        return this._size;
    }

    /**
     * length of pixel
     */
    get depth() {
        return this.axis(-1);
    }

    /**
     * width of image
     */
    get sx() {
        return this.axis(-2);
    }

    /**
     * height of image
     */
    get sy() {
        return this.axis(-3);
    }

    axis(idx) {
        return idx >= 0 ? this.shape[idx] : this.shape[this.ndim + idx]; 
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
    
    cloneAndZero() { return new Tensor(this.shape); }

    clone() {
        return new Tensor(this.shape, this.w.slice());
    }

    zeros_like() {
        return zeros(this.size);
    }

    get serialize() {
        let bytes = new Uint8Array(buffer);
        let s = String.fromCharCode.apply(bytes);
        return window.btoa(s);
    }

    load(s) {
        let bs = window.atob(s);
        for (let i = 0; i < bs.length; i++) {
            this.w[i] = bs.charCodeAt(i);
        }
    }
    
}

class Vector extends Tensor {
    constructor(size, rawdata) {
        super([size], rawdata);
    }
}

class Placeholder {
    constructor(shape=[null]) {
        this._shape = shape;
        this._size = 1;
    }
}

export { Tensor, Vector, Placeholder };
