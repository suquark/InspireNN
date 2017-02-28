import { getopt } from 'util.js';
import { assertArray2D, assertSquare } from 'util/assert.js';
import { randn, randn2d } from 'util/random.js';
import { zeros, array2d, zeros2d, centerPoints, adjMatrixDistance } from 'util/array.js';
import get_optimizer from 'optimizer.js'; // the default function

/**
 * @param {?Object} opt Options.
 * @constructor
 */
class DimReductionBase {

    constructor(opt = {}) {
        this.dim = getopt(opt, 'dim', 2); // by default 2-D
        this.epsilon = getopt(opt, 'epsilon', 10); // learning rate
        this.optimizer = getopt(opt, 'optimizer', 'adam');
        this.iter = 0;
    }

    // this function takes a set of high-dimensional points
    // and creates matrix P from them using gaussian kernel
    initDataRaw(X) {
        assertArray2D(X);
        var dists = adjMatrixDistance(X);
        this.initDataDist(dists);
    }

    // D is assumed to be provided as an array of size N^2.
    initDataDist(D) {
        var N = D.length;
        this.D = D;
        this.N = N; // back up the size of the dataset
        this.initSolution(); // refresh this
    }

    // (re)initializes the solution to random
    initSolution() {
        this.Y = randn2d(this.N, this.dim, 0.0, 1e-4); // the solution
        for (let i in this.Y) {
            this.Y[i].optimizer = get_optimizer(this.Y[i].length, { method: this.optimizer, learning_rate: this.epsilon });
        }
        this.iter = 0;
    }

    // return pointer to current solution
    get solution() { return this.Y; }

    get edges() { return []; }

    // perform a single step of optimization to improve the embedding
    step(calc_cost = true) {
        this.iter += 1;
        let N = this.N;

        let cg = this.costGrad(this.Y, calc_cost); // evaluate gradient
        let cost = cg.cost;
        let grad = cg.grad;

        // perform gradient step
        for (let i = 0; i < N; i++) {
            this.Y[i].optimizer.update(this.Y[i], grad[i]);
        }

        // reproject Y to be zero mean
        centerPoints(this.Y);

        return cost; // return current cost
    }

    /** 
     * return cost and gradient, given an arrangement
     */
    costGrad(Y, calc_cost = true) {
        throw "costGrad not implemented";
    }
}

export { DimReductionBase };