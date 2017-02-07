import { getopt } from 'util.js';
import { assertSquare } from 'util/assert.js';
import { zeros2d, L2 } from 'util/array.js';
import { entropy, norm_dist } from 'util/prob.js';
import { numeric_bsearch_decent } from 'util/numeric.js';
import { DimReductionBase } from 'dim_reduction/base.js';

/**
 * @param {?Object} opt Options.
 * @constructor
 */
class tSNE extends DimReductionBase {
    constructor(opt={}) {
        super(opt);
        this.perplexity = getopt(opt, 'perplexity', 30);
        this.optimizer = 'specialsgd';
    }

    // this function takes a fattened distance matrix and creates
    // matrix P from them.
    // D is assumed to be provided as an array of size N^2.
    initDataDist(D) {
        super.initDataDist(D);
        // convert input distance into probability
        this.P = this.distanceGaussian(D, this.perplexity, 1e-4);        
    }

    // (re)initializes the solution to random
    initSolution() {
        super.initSolution();
        this.Qu = zeros2d(this.N, this.N); // t-distribution
    }

    gaussianKernel(X, Y, beta) {
        let N = X.length;
        for (let i = 0; i < N; i++) {
            let x = X[i];
            Y[i] = Math.exp(- x * x * beta);
        }
    }

    /**
     * 
     *   Compute (p_{i|j} + p_{j|i})/(2n) from adj-matrix
     * 
     *   perplexity(P) = 2^H(P), the effective neighbor counts
     */
    distanceGaussian(D, perplexity, tol) {
        let N = assertSquare(D);
        var Htarget = Math.log(perplexity); // target entropy of distribution
        var P = zeros2d(N, N); // temporary probability matrix

        for (let i = 0; i < N; i++) {
            let prow = P[i];
            let drow = D[i];
            // perform binary search to find a suitable precision beta
            // so that the entropy of the distribution is appropriate
            // if entropy was too high (distribution too diffuse) =>
            // we need to increase the precision for more peaky distribution
            numeric_bsearch_decent(beta => {
                // compute kernel row with beta precision (beta = 0.5/sigma^2)
                this.gaussianKernel(drow, prow, beta);
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

    /** 
     * return cost and gradient, given an arrangement
     * compute `cost` take > 90% time in t-SNE, so we make it optional
     */
    costGrad(Y, calc_cost=true) {
        var N = this.N;
        var dim = this.dim; // dim of output space
        var P = this.P;
        let Qu = this.Qu;

        let qsum = 0.;
        if (dim == 2) qsum = this.distance_t2d(Y); 
        else if (dim == 3) qsum = this.distance_t3d(Y); 
        else qsum = this.distance_t(Y);
        
        // we need to optimize it heavily ...
        let pmul = this.iter < 100 ? 4 : 1; // trick that helps with local optima, form Andrej Karpathy's tsnejs
        let grad = zeros2d(N, dim);
        for (let i = 0; i < N; i++) {
            let gradi = grad[i];
            let Pi = P[i], Qui = Qu[i], Yi = Y[i];
            for (let j = 0; j < N; j++) {
                let Pij = Pi[j], Quij = Qui[j], Yj = Y[j];
                let Qij = Quij / qsum;
                for (let d = 0; d < dim; d++) {
                    // derivative of KL
                    gradi[d] += 4 * (pmul * Pij - Qij) * Quij * (Yi[d] - Yj[d]);
                }
            }
        }

        let cost = 0.0;
        if (calc_cost) {
            for (let i = 0; i < N; i++) {
                let Pi = P[i], Qui = Qu[i];
                for (var j = 0; j < N; j++) {
                    let Pij = Pi[j];
                    let Quij = Qui[j];
                    let Qij = Math.max(Quij / qsum, 1e-100); // Yes, don't blow-up plz
                    // cost = `KL(P, Q) = H(P, Q) - H(P)`
                    cost += Pij * Math.log(Pij / Qij); // accumulate cost
                }
            }
        }

        return { cost: cost, grad: grad };
    }
}

export { tSNE };