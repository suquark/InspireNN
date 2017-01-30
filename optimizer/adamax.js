import { getopt } from 'util.js';
import { zeros } from 'util/array.js';
import { eps, grad_optimizer } from 'optimizer/optimizer.js';

/**
 * AdaMax, a variant of Adam based on the infinity norm. 
 */
class Adamax extends grad_optimizer {
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
        ++this.k;        
        let v = this.v, w = this.w;
        let lr = this.learning_rate;
        let k = this.k;
        let beta1 = this.beta1, beta2 = this.beta2;
        let alpha1 = 1 - Math.pow(beta1, k);
        let alpha2 = 1 - Math.pow(beta2, k);
        for (let j = 0; j < g.length; j++) {
            v[j] = beta1 * v[j] + (1 - beta1) * g[j]; // update biased first moment estimate
            w[j] = Math.max(beta2 * w[j], Math.abs(g[j])); // update biased infinity norm moment estimate
            x[j] -= lr / alpha1 * v[j] / (w[j] + eps);
        }
    }
}

export { Adamax };
