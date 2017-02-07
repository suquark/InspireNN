/**
 * Force field
 */

import { getopt } from 'util.js';
import { assert } from 'util/assert.js';
import { DimReductionBase } from 'dim_reduction/base.js';
import { zeros2d, distance, L2 } from 'util/array.js';
import { naive_knn } from 'util/knn.js';
/**
 * @param {?Object} opt Options.
 * @constructor
 */
class ForceField extends DimReductionBase {
    constructor(opt={}) {
        super(opt);
        this.nn = getopt(opt, 'nn', 3); // nested neighbors
    }

    // D is assumed to be provided as an array of size N^2.
    initDataDist(D) {
        super.initDataDist(D);
        if (this.nn > 0) {
            assert(this.N - 1 >= this.nn, "Error: K-NN need at least N + 1 points");
            this.A = naive_knn(D, this.nn);
        }
    }

    get edges() {
        let edges = [];
        if (this.nn > 0) {
            let A = this.A;
            let n = A.length;
            for (let i = 0; i < n; i++) {
                for (let j = 0; j < A[i].length; j++) {
                    edges.push([i, A[i][j]]);
                }
            }
        }
        return edges;
    }

    /** 
     * return cost and gradient, given an arrangement
     * 
     * E = \frac{1}{\sum\limits_{i<j}d^{*}_{ij}}\sum_{i<j}\frac{(d^{*}_{ij}-d_{ij})^2}{d^{*}_{ij}}.
     * 
     */
    costGrad(Y, calc_cost=true) {
        let D = this.D;
        let N = this.N;
        let dim = this.dim;
        let grad = zeros2d(N, dim);
        let cost = 0.;
        let sum = 0. // normalize sum
        
        /**
         *  energy of charge pair
         */

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


        /**
         *  energy of edges
         */
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