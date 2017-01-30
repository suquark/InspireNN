import { getopt } from 'util.js';
import { zeros } from 'util/array.js';
import { eps, grad_optimizer } from 'optimizer/optimizer.js';


/**
 * Nesterov Adam optimizer
 */
class Nadam extends grad_optimizer {
   
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
        let alpha1 = 1 - Math.pow(beta1, k);
        let alpha2 = 1 - Math.pow(beta2, k);
        
        // TODO: implement Nadam optimizer

    }
}

export { Nadam };
