/**
 * Multidimensional scaling
 */

import { zeros2d, distance } from 'util/array.js';
import { DimReductionBase } from 'dim_reduction/base.js';

/**
 * Multidimensional scaling
 * @param {?Object} opt Options.
 * @constructor
 */
class MDS extends DimReductionBase {
    /** 
     * return cost and gradient, given an arrangement
     * 
     * E = \frac{1}{\sum\limits_{i<j}d^{*}_{ij}}\sum_{i<j}(d^{*}_{ij}-d_{ij})^2.
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
                    sum += Dij * Dij;
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
