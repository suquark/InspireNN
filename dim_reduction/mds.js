/**
 * Multidimensional scaling
 */

import { getopt, assert } from 'util.js';
import { assertArray2D } from 'util/assert.js';
import { randn2d } from 'util/random.js';
import { centerPoints, zeros2d, adjMatrixDistance, distance } from 'util/array.js';
import { Adam } from 'optimizer/index.js';  // you can drop `index.js` if supported 

/**
 * Multidimensional scaling
 * @param {?Object} opt Options.
 * @constructor
 */
class MDS {
    constructor(opt={}) {
        this.dim = getopt(opt, 'dim', 2); // by default 2-D
        this.epsilon = getopt(opt, 'epsilon', 1); // learning rate
        this.iter = 0;
    }

    // this function takes a set of high-dimensional points
    // and creates matrix P from them using gaussian kernel
    initDataRaw(X) {
        assertArray2D(X);
        var dists = adjMatrixDistance(X); 
        this.initDataDist(dists);
    }

    // this function takes a fattened distance matrix and creates
    // matrix P from them.
    // D is assumed to be provided as an array of size N^2.
    initDataDist(D) {
        var N = D.length;
        this.D = D;
        this.N = N;  // back up the size of the dataset
        this.initSolution(); // refresh this
    }

    // (re)initializes the solution to random
    initSolution() {
        this.Y = randn2d(this.N, this.dim, 0.0, 1e-4); // the solution
        for (let i in this.Y) {
            this.Y[i].optimizer = new Adam(this.Y[i].length, { learning_rate: this.epsilon }); //new SpecialSGD(this.Y[i].length, { learning_rate: this.epsilon });
        }
        this.iter = 0;
    }

    // return pointer to current solution
    get solution() { return this.Y; }


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
     * 
     * E = \frac{1}{\sum\limits_{i<j}d^{*}_{ij}}\sum_{i<j}(d^{*}_{ij}-d_{ij})^2.
     * 
     * 
     */
    costGrad(Y, calc_cost=true) {
        let D = this.D;
        let N = this.N;
        let dim = this.dim;
        let grad = zeros2d(N, dim);
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                //if ( i!= j ){
                    let Dij = D[i][j];
                    let dij = distance(Y[i], Y[j]);
                    let k = 2.0 * (dij - Dij) / (dij + 1e-8);
                    for (let d = 0; d < dim; d++) {
                        let dx = Y[i][d] - Y[j][d];
                        grad[i][d] += k * dx;
                        grad[j][d] -= k * dx;
                    }
               // }
            }
        }
        // calc cost
        let cost = 0.;
        if (calc_cost) {
            let sum = 0.;  // normalize sum
            for (let i = 0; i < N; i++) {
                for (let j = i + 1; j < N; j++) {
                    let Dij = D[i][j];
                    let dij = distance(Y[i], Y[j]);
                    sum += Dij;
                    let Dd = Dij - dij;
                    cost += Dd * Dd;
                }
            }
            cost /= sum; 
        }
        return { grad: grad, cost: cost };
    }


}

export { MDS };