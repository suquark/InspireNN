/** @license
 * Modified form Andrej Karpathy's work.
 * Here's the origin license:
 * 
 * The MIT License (MIT)
 * Copyright (c) 2015 Andrej Karpathy
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import { getopt, assert } from 'util.js';
import { randn, randn2d } from 'util/random.js';
import { zeros, array2d, zeros2d, center_points, L2, adj_matrix_L2 } from 'util/array.js';
import { entropy, norm_dist } from 'util/prob.js';
import { numeric_bsearch_decent } from 'util/numeric.js';
import { Adam, SpecialSGD } from 'optimizer/index.js';  // you can drop `index.js` if supported 

/**
 * @param {?Object} opt Options.
 * @constructor
 */
class tSNE {
    constructor(opt={}) {
        this.perplexity = getopt(opt, 'perplexity', 30);
        this.dim = getopt(opt, 'dim', 2); // by default 2-D tSNE
        this.epsilon = getopt(opt, 'epsilon', 10); // learning rate
        this.iter = 0;
    }

    // this function takes a set of high-dimensional points
    // and creates matrix P from them using gaussian kernel
    initDataRaw(X) {
        var N = X.length;
        var D = X[0].length;
        assert(N > 0, ' X is empty? You must have some data!');
        assert(D > 0, ' X[0] is empty? Where is the data?');
        var dists = adj_matrix_L2(X); // convert X to distances using gaussian kernel
        this.initDataDist(dists);
    }

    // this function takes a fattened distance matrix and creates
    // matrix P from them.
    // D is assumed to be provided as an array of size N^2.
    initDataDist(D) {
        var N = D.length;
        this.P = this.distance_gaussian(D, this.perplexity, 1e-4); // attach to object
        this.N = N;  // back up the size of the dataset
        this.initSolution(); // refresh this
    }

    // (re)initializes the solution to random
    initSolution() {
        // generate random solution to t-SNE
        this.Y = randn2d(this.N, this.dim, 0.0, 1e-4); // the solution
        for (let i in this.Y) {
            this.Y[i].optimizer = new SpecialSGD(this.Y[i].length, { learning_rate: this.epsilon });
        }
        this.gains = array2d(this.N, this.dim, 1.0); // step gains
                                // to accelerate progress in unchanging directions
        this.ystep = zeros2d(this.N, this.dim); // momentum accumulator
        this.iter = 0;
        this.Qu = zeros2d(this.N, this.N); // t-distribution
    }

    // return pointer to current solution
    get solution() { return this.Y; }

        /**
     * 
     *   Compute (p_{i|j} + p_{j|i})/(2n) from adj-matrix
     * 
     *   perplexity(P) = 2^H(P), the effective neighbor counts
     */
     distance_gaussian(D, perplexity, tol) {

        assert(D.length === D[0].length, 'D should have square number of elements.');
        let N = D.length;
        var Htarget = Math.log(perplexity); // target entropy of distribution
        var P = zeros2d(N, N); // temporary probability matrix

        for (let i = 0; i < N; i++) {
            let prow = P[i];
            let drow = D[i];
            // perform binary search to find a suitable precision beta
            // so that the entropy of the distribution is appropriate
            numeric_bsearch_decent(beta => {
                // if entropy was too high (distribution too diffuse) =>
                // we need to increase the precision for more peaky distribution

                // compute kernel row with beta precision (beta = 0.5/sigma^2)
                for (let j = 0; j < N; j++) {
                    prow[j] = Math.exp(- drow[j] * beta);
                }
                prow[i] = 0.0; // we dont care about diagonals. It should be zero
                // normalize p
                norm_dist(prow);
                // compute entropy
                return entropy(prow);
            }, 1.0, Htarget, tol);
        }

        // symmetrize P and normalize it to sum to 1 over all ij
        var Pout = zeros2d(N, N);
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                // refill too small ones
                Pout[i][j] = Math.max((P[i][j] + P[j][i]) / (N * 2), 1e-100);
            }
        }

        return Pout;
    }

    distance_t(Y) {
        // compute current Q distribution, unnormalized first
        let Qu = this.Qu;
        let N = this.N;
        var qsum = 0.0;
        for (var i = 0; i < N; i++) {
            for (var j = i + 1; j < N; j++) {
                // Student t-distribution, with freedom = n - 1 = 1
                // It will help separate two distant object
                // f(t) = 1 / (Pi * (1 + t^2))
                let qu = 1.0 / (1.0 + L2(Y[i], Y[j]));
                Qu[i][j] = Qu[j][i] = qu;
                qsum += 2 * qu;
            }
        }
        return qsum;
    }

    /**
     * faster design for 2D
     */
    distance_t2d(Y) {
        // compute current Q distribution, unnormalized first
        let Qu = this.Qu;
        let N = this.N | 0;
        var qsum = 0.0;
        for (var i = 0; i < N; i++) {
            let Yi = Y[i | 0];
            for (var j = i + 1; j < N; j++) {
                // Student t-distribution, with freedom = n - 1 = 1
                // It will help separate two distant object
                // f(t) = 1 / (Pi * (1 + t^2))
                let Yj = Y[j | 0];
                let d1 = Yi[0] - Yj[0];
                let d2 = Yi[1] - Yj[1];
                let qu = 1.0 / (1.0 +  d1 * d1 + d2 * d2);
                Qu[i][j] = Qu[j][i] = +qu;
                qsum += 2 * qu;
            }
        }
        return qsum;
    }

    /**
     * faster design for 3D
     */
    distance_t3d(Y) {
        // compute current Q distribution, unnormalized first
        let Qu = this.Qu;
        let N = this.N | 0;
        var qsum = 0.0;
        for (var i = 0; i < N; i++) {
            let Yi = Y[i | 0];
            for (var j = i + 1; j < N; j++) {
                // Student t-distribution, with freedom = n - 1 = 1
                // It will help separate two distant object
                // f(t) = 1 / (Pi * (1 + t^2))
                let Yj = Y[j | 0];
                let d1 = Yi[0] - Yj[0];
                let d2 = Yi[1] - Yj[1];
                let d3 = Yi[2] - Yj[2];
                let qu = 1.0 / (1.0 +  d1 * d1 + d2 * d2 + d3 * d3);
                Qu[i][j] = Qu[j][i] = +qu;
                qsum += 2 * qu;
            }
        }
        return qsum;
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
        center_points(this.Y);

        return cost; // return current cost
    }

    // for debugging: gradient check
    debugGrad() {
        var N = this.N;

        var cg = this.costGrad(this.Y); // evaluate gradient
        var cost = cg.cost;
        var grad = cg.grad;

        var e = 1e-5;
        for (var i = 0; i < N; i++) {
            for (var d = 0; d < this.dim; d++) {
                var yold = this.Y[i][d];

                this.Y[i][d] = yold + e;
                var cg0 = this.costGrad(this.Y);

                this.Y[i][d] = yold - e;
                var cg1 = this.costGrad(this.Y);
                var analytic = grad[i][d];
                var numerical = (cg0.cost - cg1.cost) / (2 * e);
                console.log(i + ',' + d + ': gradcheck analytic: ' + analytic +
                    ' vs. numerical: ' + numerical);

                this.Y[i][d] = yold;
            }
        }
    }



    /** 
     * return cost and gradient, given an arrangement
     * compute `cost` take > 99% time in t-SNE, so we make it optional
     */
    costGrad(Y, calc_cost=true) {
        if (!calc_cost) return this.grad(Y);
        var N = this.N;
        var dim = this.dim; // dim of output space
        var P = this.P;

        let qsum = this.distance_t(Y);
        let Qu = this.Qu;

        var cost = 0.0;
        var grad = [];
        // we need to optimize it heavily ...

        var pmul = this.iter < 100 ? 4 : 1; // trick that helps with local optima


        for (var i = 0; i < N; i++) {
            var gsum = zeros(dim); // init grad for point i
            let Pi = P[i];
            let Yi = Y[i];
            for (var j = 0; j < N; j++) {
                let Pij = Pi[j];
                let Quij = Qu[i][j];
                let Yj = Y[j];
                let Qij = Math.max(Quij / qsum, 1e-100); // Yes, don't blow-up plz
                
                // cost = `KL(P, Q) = H(P, Q) - H(P)`
                // Math.log2 may be faster than Math.log
                cost += Pij * Math.log2(Pij / Qij); // accumulate cost
                
                for (let d = 0; d < dim; d++) {
                    // derivative of KL
                    gsum[d] += 4 * (pmul * Pij - Qij) * Quij * (Yi[d] - Yj[d]);
                }
            }
            grad.push(gsum);
        }

        return { cost: cost, grad: grad };
    }

    /**
     * a much faster version
     */
    grad(Y) {
        "use asm";
        var N = this.N;
        var dim = this.dim; // dim of output space
        var P = this.P;

        let qsum = 0.0;
        if (dim == 2) qsum = +this.distance_t2d(Y); 
        else if (dim == 3) qsum = +this.distance_t3d(Y); 
        else qsum = +this.distance_t(Y);

        let Qu = this.Qu;

        var grad = [];
        // we need to optimize it heavily ...

        var pmul = this.iter < 100 ? 4 : 1; // trick that helps with local optima

        if (dim == 2) {
            let gbuf = zeros(2 * N);
            if (this.iter < 100) {
                for (var i = 0; i < N; i++) {
                    let Pi = P[i];
                    let Yi = Y[i];
                    let Qi = Qu[i];
                    for (var j = 0; j < N; j++) {
                        let Pij = +Pi[j];
                        let Quij = +Qi[j];
                        let Yj = Y[j];
                        let prefix = + 4 * (4 * Pij - Quij / qsum) * Quij;
                        gbuf[i << 1] += prefix * (Yi[0] - Yj[0]);
                        gbuf[(i << 1) + 1] += prefix * (Yi[1] - Yj[1]);
                    }
                }
            } else {
                for (var i = 0; i < N; i++) {
                    let Pi = P[i];
                    let Yi = Y[i];
                    let Qi = Qu[i];
                    for (var j = 0; j < N; j++) {
                        let Pij = +Pi[j];
                        let Quij = +Qi[j];
                        let Yj = Y[j];
                        let prefix = + 4 * (Pij - Quij / qsum) * Quij;
                        gbuf[i << 1] += prefix * (Yi[0] - Yj[0]);
                        gbuf[(i << 1) + 1] += prefix * (Yi[1] - Yj[1]);
                    }
                }
            }
            for (var i = 0; i < N; i++) {
                grad.push([gbuf[i << 1], gbuf[(i << 1) + 1]]);
            }
            

        } else if (dim == 3) {
            for (var i = 0; i < N; i++) {
                var gsum = zeros(dim); // init grad for point i
                let Pi = P[i];
                let Yi = Y[i];
                let Qi = Qu[i];
                for (var j = 0; j < N; j++) {
                    let Pij = +Pi[j];
                    let Quij = +Qi[j];
                    let Yj = Y[j];
                    let prefix = + 4 * (pmul * Pij - Quij / qsum) * Quij;
                    gsum[0] += prefix * (Yi[0] - Yj[0]);
                    gsum[1] += prefix * (Yi[1] - Yj[1]);
                    gsum[2] += prefix * (Yi[2] - Yj[2]);
                }
                grad.push(gsum);
            }
        } else {
            for (var i = 0; i < N; i++) {
                var gsum = zeros(dim); // init grad for point i
                let Pi = P[i];
                let Yi = Y[i];
                let Qi = Qu[i];
                for (var j = 0; j < N; j++) {
                    let Pij = +Pi[j];
                    let Quij = +Qi[j];
                    let Yj = Y[j];
                    let prefix = + 4 * (pmul * Pij - Quij / qsum) * Quij;
                    for (let d = 0; d < dim; d++) {
                        // derivative of KL
                        gsum[d] += prefix * (Yi[d] - Yj[d]);
                    }
                }
                grad.push(gsum);
            }
        }

        return { cost: 0.0, grad: grad };
    }


}

export { tSNE };