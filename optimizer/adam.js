import { getopt } from 'util.js';
import { zeros } from 'util/array.js';
import { eps, grad_optimizer } from 'optimizer/optimizer.js';


/**
 * Adaptive moment estimation (Adam), combining
 * classical momentum (using a decaying mean instead of a decaying sum) 
 * with RMSProp to improve performance on a number of benchmarks.
 * 
 * References
 *      Adam - A Method for Stochastic Optimization (http://arxiv.org/abs/1412.6980v8)
 */
class Adam extends grad_optimizer {
    /** Adam update
     * u <- ( b^p * u + (1 - b^p) * g^p ) ^ (1/p) : k-moment estimate
     */ 
    constructor(len, opt={}) {
        super(len, opt);
        this.k = 0;
        this.learning_rate = getopt(opt, 'learning_rate', 0.01);
        this.beta1 = getopt(opt, 'beta1', 0.9);
        this.beta2 = getopt(opt, 'beta2', 0.999);
        this.v = zeros(len);
        this.w = zeros(len);
    }

    update(x, g) {
        ++this.k; // k > 0, or 1 / biasCorr will be NaN
        let v = this.v, w = this.w;
        let lr = this.learning_rate;
        let k = this.k;
        let beta1 = this.beta1, beta2 = this.beta2;
        /**
         * initialization bias correction terms, 
         * which offset some of the instability that initializing v and w to 0 can create.
         */
        let alpha1 = 1.0 - Math.pow(beta1, k);
        let alpha2 = 1.0 - Math.pow(beta2, k);
        
        for (let j = 0; j < g.length; j++) {
            v[j] = beta1 * v[j] + (1 - beta1) * g[j]; // update biased first moment estimate
            w[j] = beta2 * w[j] + (1 - beta2) * g[j] * g[j]; // update biased second moment estimate
            let biasCorr1 = v[j] / alpha1; // correct bias first moment estimate
            let biasCorr2 = w[j] / alpha2; // correct bias second moment estimate
            x[j] -= lr * biasCorr1 / (Math.sqrt(biasCorr2) + eps);
        }
    }
}

export { Adam };
