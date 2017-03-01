import { Tensor } from 'backend/tensor.js';

class Placeholder {
    constructor(ops, feeds) {
        this._shape = shape;
        this._size = 1;
        this.ops = ops;
        this.feeds = feeds;

        // dirty means needing re-evaluate 
        this.dirty = true;
        // refers to output Placeholder
        this.output_ref = new Set();
    }

    shape() {
        return this.shape;
    }

    eval() {

    }
}

export { Placeholder };