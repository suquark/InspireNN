/**
 * Force field
 */

import { getopt } from 'util.js';
import { assertArray2D, assert } from 'util/assert.js';
import { randn2d } from 'util/random.js';
import { centerPoints, zeros2d, adjMatrixDistance, distance, L2 } from 'util/array.js';
import { Adam } from 'optimizer/index.js';  // you can drop `index.js` if supported 
import { naive_knn } from 'util/knn.js';
/**
 * @param {?Object} opt Options.
 * @constructor
 */
class ForceField {
    constructor(opt={}) {
        this.dim = getopt(opt, 'dim', 2); // by default 2-D
        this.epsilon = getopt(opt, 'epsilon', 1); // learning rate
        this.nn = getopt(opt, 'nn', 3); // nested neighbors
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
        this.N = N;  // back up the size of the dataset
        if (this.nn > 0) {
            assert(this.N - 1 >= this.nn, "Error: K-NN need at least N + 1 points");
            this.A = naive_knn(D, this.nn);
        }
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

    get edges() {
        let edges = [];
        let A = this.A;
        let n = A.length;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < A[i].length; j++) {
                edges.push([i, A[i][j]]);
            }
        }
        return edges;
    }


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
     * E = \frac{1}{\sum\limits_{i<j}d^{*}_{ij}}\sum_{i<j}\frac{(d^{*}_{ij}-d_{ij})^2}{d^{*}_{ij}}.
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
                let k = -1.0 / (L2(Y[i], Y[j]) + 1e-8);
                for (let d = 0; d < dim; d++) {
                    let dx = Y[i][d] - Y[j][d];
                    grad[i][d] += k * dx;
                    grad[j][d] -= k * dx;
                }
            }
        }

        // calc cost
        let sum = 0. // normalize sum
        let cost = 0.;
        if (calc_cost) {
            for (let i = 0; i < N; i++) {
                for (let j = i + 1; j < N; j++) {
                    let Dij = D[i][j];
                    sum += Dij * Dij;                    
                    let dij = distance(Y[i], Y[j]);
                    cost += 1 / (dij + 1e-8);
                }
            }
             
        }

        /////////////////

        if (this.nn <= 0) {  // then calc all pairs
            
            for (let i = 0; i < N; i++) {
                for (let j = i + 1; j < N; j++) {
                    let Dij = D[i][j];
                    let dij = distance(Y[i], Y[j]);
                    let k = (dij - Dij) / (dij + 1e-8);
                    for (let d = 0; d < dim; d++) {
                        let dx = Y[i][d] - Y[j][d];
                        grad[i][d] += k * dx;
                        grad[j][d] -= k * dx;
                    }
                }
            }

            if (calc_cost) {
                for (let i = 0; i < N; i++) {
                    for (let j = i + 1; j < N; j++) {
                        let Dij = D[i][j];
                        let dij = distance(Y[i], Y[j]);
                        let Dd = Dij - dij;
                        cost += 0.5 * (Dd * Dd);
                    }
                }
            }
        } else {  // calc knn edges, note: the cost become Dij irrelative
            let A = this.A;
            for (let i = 0; i < N; i++) {
                for (let e in A[i]) {
                    let j = A[i][e];
                    let dij = distance(Y[i], Y[j]);
                    //let k = (dij - Dij) / (dij + 1e-8);
                    //let k = 10 * (dij - 1);
                    let k = 10 * (dij - 1); // k = 5, length = 1
                    for (let d = 0; d < dim; d++) {
                        let dx = Y[i][d] - Y[j][d];
                        grad[i][d] += k * dx;
                        grad[j][d] -= k * dx;
                    }
                }
            }


            if (calc_cost) {
                for (let i = 0; i < N; i++) {
                    for (let e in A[i]) {
                        let j = A[i][e];
                        cost += 0.5 * L2(Y[i], Y[j]);
                    }
                }
            }


        }
        return { grad: grad, cost: cost / sum };
    }
}

export { ForceField };